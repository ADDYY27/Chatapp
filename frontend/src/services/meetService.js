// Meet Data Service
// Manages Drop-in rooms, upcoming meetings, and lobby validation

export const DROP_IN_ROOMS = [
  {
    id: "late-night-coding",
    name: "Late night coding",
    count: 3,
    participants: [
      { name: "XERO", initials: "XE", color: "#C9743E" },
      { name: "adarshd", initials: "AD", color: "#7FA38F" },
      { name: "priya", initials: "PR", color: "#6E9AA6" },
    ],
  },
  {
    id: "chill-lounge",
    name: "Chill lounge",
    count: 0,
    participants: [],
  },
  {
    id: "frontend-sync",
    name: "Frontend sync",
    count: 2,
    participants: [
      { name: "adarshd", initials: "AD", color: "#7FA38F" },
      { name: "Design sprint", initials: "DS", color: "#B89FD9" },
    ],
  },
];

export const UPCOMING_MEETS = [
  {
    id: "design-sync",
    title: "Design sync",
    timeBadge: "6PM",
    subtitle: "Today · Design sprint",
  },
  {
    id: "weekly-standup",
    title: "Weekly standup",
    timeBadge: "10AM",
    subtitle: "Tomorrow · Team pulse",
  },
];

export const getDropInRooms = () => {
  return DROP_IN_ROOMS;
};

export const getUpcomingMeets = () => {
  return UPCOMING_MEETS;
};

export const validateMeetingCode = (code) => {
  if (!code || !code.trim()) {
    return { valid: false, error: "Please enter a meeting code" };
  }
  const clean = code.trim().toLowerCase();
  // Valid format: alphanumeric or dash separated (e.g. abc-def-ghi or meet123)
  if (clean.length < 3) {
    return { valid: false, error: "Meeting code is too short" };
  }
  return { valid: true, code: clean };
};
