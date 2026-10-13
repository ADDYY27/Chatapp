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

## 5. Environment Configuration

Uses the existing environment variables:
- `PORT`: HTTP server port (default 3000)
- `MONGO_URL`: MongoDB connection string
- `JWT_SECRET`: Secret key for signing and verifying JWT tokens
- `NODE_ENV`: Application environment (`development` / `production`)

No new environment variables or external API keys are required.

---

## 6. Limitations & Notes

- **Microphone Permissions**: Voice note recording requires browser microphone permissions granted via `navigator.mediaDevices.getUserMedia`.
- **Audio Storage**: Voice recordings are stored as base64 audio data URIs matching existing user profile image storage, handled within the existing `express.json({ limit: "10mb" })` payload ceiling.
- **Local Color Scoping**: "Their colour" swatch picker persists to `localStorage` per user (`chatapp_color_<userId>`), tinting the avatar ring and accent locally without overwriting the global user profile on the server.
