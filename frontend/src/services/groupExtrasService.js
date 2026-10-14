// Group Extras Data Service
// Manages Polls, Tasks, Events, and Shared Files for Groups
// Clearly labelled as a client-persisted service layer pending backend endpoint migration

export const DEFAULT_POLLS = [
  {
    id: "poll-1",
    question: "Where do we meet?",
    closingDate: "Ends Friday",
    options: [
      { id: "opt-1", text: "Campus cafe", votes: 8 },
      { id: "opt-2", text: "Library", votes: 3 },
      { id: "opt-3", text: "Online", votes: 2 },
    ],
    voters: {}, // userId -> optionId
  },
];

export const DEFAULT_TASKS = [
  { id: "task-1", title: "Finalise wireframes", completed: true },
  { id: "task-2", title: "Pick the demo order", completed: false },
  { id: "task-3", title: "Book the room", completed: false },
];

export const DEFAULT_EVENTS = [
  {
    id: "event-1",
    title: "Demo day",
    day: "FRI",
    time: "6PM",
    subtitle: "Group event",
    goingCount: 3,
    maybeCount: 1,
    attendees: {}, // userId -> 'going' | 'maybe'
  },
];

export const DEFAULT_FILES = [
  { id: "file-1", name: "NightGarden_Design_Specs.pdf", size: "2.4 MB", type: "pdf", date: "Yesterday" },
  { id: "file-2", name: "demo_wireframes_v2.png", size: "1.1 MB", type: "image", date: "2 days ago" },
  { id: "file-3", name: "standup_audio_recap.webm", size: "3.8 MB", type: "audio", date: "Oct 12" },
];

// ---- Polls ----
export const getGroupPolls = (groupId) => {
  try {
    const raw = localStorage.getItem(`chatapp_polls_${groupId}`);
    return raw ? JSON.parse(raw) : DEFAULT_POLLS;
  } catch {
    return DEFAULT_POLLS;
  }
};

export const voteGroupPoll = (groupId, pollId, optionId, userId) => {
  const polls = getGroupPolls(groupId);
  const updated = polls.map((p) => {
    if (p.id !== pollId) return p;

    const previousVote = p.voters?.[userId];
    const newVoters = { ...p.voters, [userId]: optionId };

    const newOptions = p.options.map((opt) => {
      let v = opt.votes;
      if (previousVote === opt.id) v = Math.max(0, v - 1);
      if (optionId === opt.id) v += 1;
      return { ...opt, votes: v };
    });

    return { ...p, options: newOptions, voters: newVoters };
  });

  localStorage.setItem(`chatapp_polls_${groupId}`, JSON.stringify(updated));
  return updated;
};

// ---- Tasks ----
export const getGroupTasks = (groupId) => {
  try {
    const raw = localStorage.getItem(`chatapp_tasks_${groupId}`);
    return raw ? JSON.parse(raw) : DEFAULT_TASKS;
  } catch {
    return DEFAULT_TASKS;
  }
};

export const toggleGroupTask = (groupId, taskId) => {
  const tasks = getGroupTasks(groupId);
  const updated = tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t));
  localStorage.setItem(`chatapp_tasks_${groupId}`, JSON.stringify(updated));
  return updated;
};

export const addGroupTask = (groupId, title) => {
  if (!title.trim()) return getGroupTasks(groupId);
  const tasks = getGroupTasks(groupId);
  const newTask = { id: `task-${Date.now()}`, title: title.trim(), completed: false };
  const updated = [...tasks, newTask];
  localStorage.setItem(`chatapp_tasks_${groupId}`, JSON.stringify(updated));
  return updated;
};

// ---- Events ----
export const getGroupEvents = (groupId) => {
  try {
    const raw = localStorage.getItem(`chatapp_events_${groupId}`);
    return raw ? JSON.parse(raw) : DEFAULT_EVENTS;
  } catch {
    return DEFAULT_EVENTS;
  }
};

export const toggleEventRsvp = (groupId, eventId, userId) => {
  const events = getGroupEvents(groupId);
  const updated = events.map((ev) => {
    if (ev.id !== eventId) return ev;

    const isGoing = ev.attendees?.[userId] === "going";
    const nextState = isGoing ? null : "going";
    const newAttendees = { ...ev.attendees };

    if (nextState) {
      newAttendees[userId] = "going";
    } else {
      delete newAttendees[userId];
    }

    const goingDelta = isGoing ? -1 : 1;
    return {
      ...ev,
      goingCount: Math.max(0, ev.goingCount + goingDelta),
      attendees: newAttendees,
    };
  });

  localStorage.setItem(`chatapp_events_${groupId}`, JSON.stringify(updated));
  return updated;
};

// ---- Files ----
export const getGroupFiles = (groupId) => {
  return DEFAULT_FILES;
};
