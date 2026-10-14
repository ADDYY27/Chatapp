# Night Garden Chat Extras - Technical Documentation

## 1. Schema Additions

### Message Model (`backend/Models/messageSchema.js`)
| Field | Type | Default | Purpose |
| :--- | :--- | :--- | :--- |
| `message` | `String` | `""` | Made optional with empty string default to support audio-only voice notes |
| `audioUrl` | `String` | `null` | Base64 audio URI data for voice notes, adhering to existing app media patterns |
| `audioDuration` | `Number` | `0` | Actual audio duration in seconds |
| `reactions` | `Array` | `[]` | Array of `{ userId: ObjectId, emoji: String, createdAt: Date }` for message reactions |
| `isPinned` | `Boolean` | `false` | Indicates whether the message is pinned in the conversation |
| `pinnedAt` | `Date` | `null` | Timestamp when the message was pinned |
| `pinnedBy` | `ObjectId` | `null` | Reference to `User` who pinned the message |
| `replyTo` | `ObjectId` | `null` | Reference to `Message` being replied to (populated on fetch) |
| `deletedFor` | `[ObjectId]` | `[]` | User IDs who executed "Delete for me", hiding it exclusively for them |
| `isScheduled` | `Boolean` | `false` | Queued state for scheduled messages |
| `scheduledFor` | `Date` | `null` | Scheduled future send timestamp |
| `expiresAt` | `Date` | `null` | Expiration timestamp calculated from conversation's `disappearingDuration` |

### Conversation Model (`backend/Models/conversationModels.js`)
| Field | Type | Default | Purpose |
| :--- | :--- | :--- | :--- |
| `disappearingDuration` | `String` | `"off"` | Disappearing messages duration setting: `"off"`, `"1h"`, or `"24h"` |

---

## 2. API Endpoints

### Existing Modified Endpoints
- **`POST /api/message/send/:id`**
  - Accepts `messages`, `audioUrl`, `audioDuration`, `replyTo`, `scheduledFor`.
  - Automatically calculates `expiresAt` based on the conversation's `disappearingDuration`.
  - If `scheduledFor` is set in the future, sets `isScheduled: true` and defers immediate Socket.IO broadcast.
- **`GET /api/message/:id`**
  - Filters out expired messages (`expiresAt: { $gt: now }` or null).
  - Filters out scheduled messages not yet delivered (`isScheduled: { $ne: true }`).
  - Filters out messages deleted by the requesting user (`deletedFor: { $ne: req.user._id }`).
  - Populates referenced `replyTo` message data (`_id message senderId createdAt audioUrl`).

### New Endpoints
- **`POST /api/message/:id/reaction`**
  - Toggles reaction for authenticated user. If user already reacted with the same emoji, removes it; otherwise updates/adds reaction.
  - Emits `messageReaction` via Socket.IO to recipient.
- **`PUT /api/message/:id/pin`**
  - Toggles `isPinned` state for message after validating conversation participation.
  - Emits `messagePinned` via Socket.IO to recipient.
- **`POST /api/message/:id/delete-for-me`**
  - Adds requesting user ID to `deletedFor` array without modifying visibility for other participants.
- **`PUT /api/message/conversation/:id/disappearing`**
  - Updates `disappearingDuration` (`"off"`, `"1h"`, `"24h"`) for the conversation between authenticated user and target participant.

---

## 3. Socket.IO Events

| Event Name | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `messageReaction` | Server -> Client | `{ messageId, reactions, senderId }` | Synchronizes added or removed emoji reaction in real time |
| `messagePinned` | Server -> Client | `{ messageId, isPinned, pinnedAt, pinnedBy }` | Synchronizes pin/unpin status in real time |
| `nudge` | Client -> Server | `{ receiverId }` | Requests a lightweight nudge ping to the recipient |
| `nudge` | Server -> Client | `{ senderId }` | Triggers the `ngNudge` animated shake on recipient's chat view |
| `nudgeError` | Server -> Client | `{ message }` | Emitted when a user exceeds the 5-second nudge rate limit |
| `newMessage` | Server -> Client | `messageDoc` | Dispatches new messages (immediate or when scheduler fires) |

---

## 4. Scheduling & Background Processing

- **Scheduler Worker (`backend/utils/scheduledJob.js`)**:
  - Implements a lightweight recurring 10-second background worker initialized in `backend/index.js` on boot.
  - Queries MongoDB for pending messages: `{ isScheduled: true, scheduledFor: { $lte: new Date() } }`.
  - Atomically marks `isScheduled: false`, updates conversation `lastMessage` and timestamp, and emits `newMessage` via Socket.IO to recipient.
  - Survives backend restarts because scheduled messages are persisted in MongoDB.

---

## 5. Real vs. Mocked Architecture (Prompt 4)

### Groups Section
- **Real Backend Features**:
  - Group creation (`POST /group/create` via `CreateGroup.jsx`).
  - Group conversation listing (`GET /group/my-groups`).
  - Group messaging & real-time socket events (`POST /group/:id/messages` and `GET /group/:id/messages`).
  - Group unread counts (`unreadGroupCounts`).
  - Group info & avatar updates (`GET /group/:id/info`, `PUT /group/:id/pic`).
- **Mock Service Layer (`frontend/src/services/groupExtrasService.js`)**:
  - **Polls**: Question, live vote percentage bars, single-vote-per-user enforcement.
  - **Tasks**: Shared checklist with dynamic `completed/total` counter and strikethrough.
  - **Events**: Event cards with date block, `Going` / `Maybe` attendee counts, and RSVP toggle.
  - **Files**: Shared document & asset listing.

### Meet Section
- **Real Hardware & Browser Features**:
  - Real camera video capture and live preview using `navigator.mediaDevices.getUserMedia({ video: true })`.
  - Real microphone toggle using `navigator.mediaDevices.getUserMedia({ audio: true })`.
  - Device capture error handling (graceful handling of `NotAllowedError` / permission denial).
  - Explicit release of all `MediaStreamTrack`s on component unmount and preview stop.
  - Meeting code format validation.
- **Mock Service Layer (`frontend/src/services/meetService.js`)**:
  - Drop-in rooms list (`Late night coding`, `Chill lounge`, `Frontend sync`) with stacked avatar participant previews.
  - Upcoming scheduled meeting cards.
- **Media Transport Limitation (TODO)**:
  - There is no WebRTC mesh or SFU signaling server in the current backend.
  - Per instructions, clicking "Join room" does not simulate a fake call; it displays a clear `[TODO: Media Transport]` modal explaining that signaling infrastructure is pending.

### Find People Section
- **Real Backend Features**:
  - User search (`GET /user/search?search=...`).
  - Online status from live Socket.IO connection.
  - "Say hi" action immediately creates or selects conversation in `Recent Chats` and opens Chat view.
- **Mock Service Layer (`frontend/src/services/discoveryService.js`)**:
  - Candidate sorting by shared vibe count.
  - Vibe tags mapping (`#gamedev`, `#lofi`, `#night owl`, `#design`).
  - Pending friend requests list (`MOCK_PENDING_REQUESTS`) with "Accept" and "View" actions.

### Profile & Settings Section
- **Real App & Privacy Features**:
  - Authenticated user account details (`useAuth()`).
  - Profile avatar upload (`PUT /auth/profile/pic`).
  - Shared CSS theme accent tokens (`--ng-accent`, `--ng-accent-fg`) updated dynamically across all 5 swatches.
  - Message bubble border-radius tokens (`--r-bubble-mine`, `--r-bubble-theirs`) updated dynamically across all 3 styles.
  - Read receipts privacy preference (`readReceipts` setting directly respected in `Message.jsx`).
  - Quiet hours window calculation (`isQuietHoursActive()`).
  - Interactive keyboard shortcuts documentation.
- **Mock Service Layer (`frontend/src/services/settingsService.js`)**:
  - Vibe tags selection (max 5 limit validated) and status note edits persisted to `localStorage`.

---

## 6. Missing Backend Endpoints for Future Implementation

To replace the mock data-service layer with real persistence in future sprints, the following endpoints are needed:

| Feature | HTTP Method | Proposed Path | Expected Payload / Response |
| :--- | :--- | :--- | :--- |
| **Group Polls** | `POST` | `/api/group/:id/polls` | `{ question: String, options: [String], closingDate: Date }` |
| **Poll Voting** | `POST` | `/api/group/:id/polls/:pollId/vote` | `{ optionId: String }` -> returns updated vote tallies |
| **Group Tasks** | `POST` / `PUT` | `/api/group/:id/tasks` | `{ title: String, completed: Boolean }` |
| **Group Events** | `POST` | `/api/group/:id/events` | `{ title: String, date: Date, time: String }` |
| **Event RSVP** | `POST` | `/api/group/:id/events/:eventId/rsvp` | `{ status: "going" \| "maybe" }` |
| **Friend Requests**| `POST` / `PUT` | `/api/user/friends/request` | `{ targetUserId: ObjectId, action: "accept" \| "reject" }` |
| **User Profile Tags**| `PUT` | `/api/auth/profile/vibes` | `{ vibeTags: [String], statusNote: String }` |

---

## 7. Environment Configuration

Uses existing environment variables:
- `PORT`: HTTP server port (default 3000)
- `MONGO_URL`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT signing
- `NODE_ENV`: Application environment (`development` / `production`)

No external third-party API keys are required.
