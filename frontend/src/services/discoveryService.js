// Discovery & Find People Data Service
// Calculates shared vibes, sorts candidates, and provides pending request service

export const SAMPLE_VIBE_POOL = [
  "#gamedev",
  "#lofi",
  "#night owl",
  "#design",
  "#typescript",
  "#ambient",
  "#synthwave",
  "#minimal",
  "#coffee",
];

// Mock pending requests (Clearly labelled as mock service data)
export const MOCK_PENDING_REQUESTS = [
  {
    id: "req-1",
    user: {
      _id: "mock-user-1",
      fullname: "Elena Rostova",
      username: "elena_r",
      statusNote: "exploring generative art & shader toys",
      vibeTags: ["#design", "#lofi", "#night owl"],
    },
    sentAt: "2h ago",
    status: "pending",
  },
  {
    id: "req-2",
    user: {
      _id: "mock-user-2",
      fullname: "Marcus Vance",
      username: "mvance",
      statusNote: "building rust audio engines",
      vibeTags: ["#gamedev", "#lofi", "#ambient"],
    },
    sentAt: "Yesterday",
    status: "pending",
  },
];

// Fallback vibe tag mapping for real database users who don't have tags yet
const DEFAULT_USER_VIBES = {
  jhanvii: ["#design", "#night owl", "#lofi"],
  xero: ["#gamedev", "#night owl", "#lofi"],
  adarshd: ["#design", "#typescript", "#coffee"],
  priya: ["#lofi", "#ambient", "#night owl"],
};

export const getUserVibes = (user) => {
  if (user?.vibeTags && user.vibeTags.length > 0) {
    return user.vibeTags;
  }
  const uname = user?.username?.toLowerCase() || "";
  return DEFAULT_USER_VIBES[uname] || ["#night owl", "#lofi"];
};

export const calculateSharedVibes = (myVibes = [], targetVibes = []) => {
  if (!myVibes || !targetVibes) return [];
  const mySet = new Set(myVibes.map((v) => v.toLowerCase()));
  return targetVibes.filter((v) => mySet.has(v.toLowerCase()));
};

export const sortUsersBySharedVibes = (users = [], myVibes = []) => {
  return [...users].sort((a, b) => {
    const aShared = calculateSharedVibes(myVibes, getUserVibes(a)).length;
    const bShared = calculateSharedVibes(myVibes, getUserVibes(b)).length;
    return bShared - aShared;
  });
};

export const filterUsers = (users = [], filterType = "all", myVibes = [], onlineUserIds = []) => {
  let list = users;
  if (filterType === "online") {
    list = list.filter((u) => onlineUserIds.includes(u._id));
  } else if (filterType === "same_vibe") {
    list = list.filter((u) => calculateSharedVibes(myVibes, getUserVibes(u)).length > 0);
  } else if (filterType === "new") {
    // Show newest registered accounts
    list = [...list].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }
  return sortUsersBySharedVibes(list, myVibes);
};
