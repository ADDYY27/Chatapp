// Night Garden Settings and Appearance Service
// Persists user preferences and applies dynamic CSS tokens app-wide

export const ACCENT_COLORS = [
  { name: "Saffron", hex: "#E8A33D", fg: "#16110A" },
  { name: "Terracotta", hex: "#C9743E", fg: "#16110A" },
  { name: "Sage", hex: "#7FA38F", fg: "#0E1311" },
  { name: "Teal", hex: "#6E9AA6", fg: "#0E1311" },
  { name: "Lilac", hex: "#B89FD9", fg: "#0E1311" },
];

export const BUBBLE_STYLES = {
  rounded: {
    id: "rounded",
    label: "Rounded",
    mine: "18px 18px 4px 18px",
    theirs: "18px 18px 18px 4px",
  },
  sharp: {
    id: "sharp",
    label: "Sharp",
    mine: "4px 4px 0px 4px",
    theirs: "4px 4px 4px 0px",
  },
  minimal: {
    id: "minimal",
    label: "Minimal",
    mine: "10px 10px 2px 10px",
    theirs: "10px 10px 10px 2px",
  },
};

const DEFAULT_SETTINGS = {
  accentColor: "#E8A33D",
  accentColorFg: "#16110A",
  bubbleStyle: "rounded",
  readReceipts: true,
  typingIndicators: true,
  lastSeen: true,
  quietHours: {
    enabled: false,
    start: "23:00",
    end: "07:00",
  },
  vibeTags: ["#design", "#night owl", "#lofi"],
  statusNote: "building ChatApp",
};

const STORAGE_KEY = "chatapp_ng_settings";

export const getSettings = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export const updateSettings = (updates) => {
  try {
    const current = getSettings();
    const updated = { ...current, ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    applyTheme(updated);
    window.dispatchEvent(new CustomEvent("chatapp:settingsUpdated", { detail: updated }));
    return updated;
  } catch (err) {
    console.error("Failed to update settings:", err);
    return DEFAULT_SETTINGS;
  }
};

export const applyTheme = (settings = getSettings()) => {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  // Apply accent color tokens
  root.style.setProperty("--ng-accent", settings.accentColor || "#E8A33D");
  root.style.setProperty("--ng-accent-fg", settings.accentColorFg || "#16110A");
  root.style.setProperty("--chat-accent", settings.accentColor || "#E8A33D");
  root.style.setProperty("--chat-accent-fg", settings.accentColorFg || "#16110A");

  // Apply bubble style radius tokens
  const style = BUBBLE_STYLES[settings.bubbleStyle] || BUBBLE_STYLES.rounded;
  root.style.setProperty("--r-bubble-mine", style.mine);
  root.style.setProperty("--r-bubble-theirs", style.theirs);
};

export const isQuietHoursActive = () => {
  const settings = getSettings();
  if (!settings.quietHours?.enabled) return false;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startH, startM] = settings.quietHours.start.split(":").map(Number);
  const [endH, endM] = settings.quietHours.end.split(":").map(Number);

  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }
  // Overnight span (e.g. 23:00 to 07:00)
  return currentMinutes >= startMinutes || currentMinutes < endMinutes;
};

// Initialize theme immediately on script evaluation
applyTheme();
