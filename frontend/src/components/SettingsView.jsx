import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Avatar from "./Avatar";
import toast from "react-hot-toast";
import {
  getSettings,
  updateSettings,
  ACCENT_COLORS,
  BUBBLE_STYLES,
} from "../services/settingsService";
import axiosInstance from "../utils/axios";

const SettingsView = ({ initialTab = "profile" }) => {
  const { authUser, setAuthUser } = useAuth();
  const [settings, setSettingsState] = useState(getSettings);
  const [activeTab, setActiveTab] = useState(initialTab);

  // Vibe tags input state
  const [showAddVibe, setShowAddVibe] = useState(false);
  const [newVibeText, setNewVibeText] = useState("");

  // Edit profile modal state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFullname, setEditFullname] = useState(authUser?.fullname || "");
  const [editStatusNote, setEditStatusNote] = useState(
    authUser?.statusNote !== undefined ? authUser.statusNote : (settings.statusNote || "")
  );
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    const handleUpdate = (e) => {
      if (e.detail) setSettingsState(e.detail);
    };
    window.addEventListener("chatapp:settingsUpdated", handleUpdate);
    return () => window.removeEventListener("chatapp:settingsUpdated", handleUpdate);
  }, []);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const handleAccentChange = (hex, fg) => {
    updateSettings({ accentColor: hex, accentColorFg: fg });
    toast.success("Theme accent updated!");
  };

  const handleBubbleChange = (styleKey) => {
    updateSettings({ bubbleStyle: styleKey });
    toast.success(`Message bubble style: ${BUBBLE_STYLES[styleKey]?.label}`);
  };

  const handleToggle = (key) => {
    const updated = !settings[key];
    updateSettings({ [key]: updated });
    toast.success(`${key.replace(/([A-Z])/g, " $1")} ${updated ? "enabled" : "disabled"}`);
  };

  const handleQuietHoursToggle = () => {
    const enabled = !settings.quietHours?.enabled;
    updateSettings({
      quietHours: {
        ...settings.quietHours,
        enabled,
      },
    });
    toast.success(`Quiet hours ${enabled ? "enabled" : "disabled"}`);
  };

  const handleQuietHoursTimeChange = (type, val) => {
    updateSettings({
      quietHours: {
        ...settings.quietHours,
        [type]: val,
      },
    });
  };

  const handleAddVibeTag = async () => {
    const trimmed = newVibeText.trim().replace(/^#+/, "");
    if (!trimmed) {
      setShowAddVibe(false);
      return;
    }
    const formatted = `#${trimmed.toLowerCase()}`;
    const currentTags = authUser?.vibeTags || settings.vibeTags || [];

    if (currentTags.length >= 5) {
      toast.error("You can choose up to 5 vibe tags maximum");
      return;
    }
    if (currentTags.includes(formatted)) {
      toast.error("Tag already added");
      return;
    }

    const updatedTags = [...currentTags, formatted];
    try {
      const { data } = await axiosInstance.put("/auth/profile", { vibeTags: updatedTags });
      if (data.success && data.user) {
        if (setAuthUser) setAuthUser(data.user);
        updateSettings({ vibeTags: data.user.vibeTags });
        setNewVibeText("");
        setShowAddVibe(false);
        toast.success(`Added ${formatted}`);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to add vibe tag");
    }
  };

  const handleRemoveVibeTag = async (tagToRemove) => {
    const currentTags = authUser?.vibeTags || settings.vibeTags || [];
    const updatedTags = currentTags.filter((t) => t !== tagToRemove);
    try {
      const { data } = await axiosInstance.put("/auth/profile", { vibeTags: updatedTags });
      if (data.success && data.user) {
        if (setAuthUser) setAuthUser(data.user);
        updateSettings({ vibeTags: data.user.vibeTags });
        toast.success(`Removed ${tagToRemove}`);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to remove vibe tag");
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const trimmedName = editFullname.trim();
    if (!trimmedName) {
      toast.error("Full name cannot be empty");
      return;
    }
    const trimmedStatus = editStatusNote.trim();
    if (trimmedStatus.length > 40) {
      toast.error("Status note cannot exceed 40 characters");
      return;
    }

    setSavingProfile(true);
    try {
      const { data } = await axiosInstance.put("/auth/profile", {
        fullname: trimmedName,
        statusNote: trimmedStatus,
      });
      if (data.success && data.user) {
        if (setAuthUser) setAuthUser(data.user);
        updateSettings({ statusNote: data.user.statusNote });
        setIsEditingProfile(false);
        toast.success("Profile updated successfully!");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div
      style={{
        flex: 1,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        background: "var(--ng-bg)",
        padding: "28px 36px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: 860, width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
        
        {/* ================= PROFILE CARD (NG5) ================= */}
        <div
          style={{
            background: "var(--ng-panel)",
            border: "1px solid var(--ng-border)",
            borderRadius: "var(--r-card)",
            overflow: "hidden",
            boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
          }}
        >
          {/* Warm Gradient Banner */}
          <div
            style={{
              height: 140,
              width: "100%",
              background: "linear-gradient(135deg, #A85D2C 0%, #4D2612 50%, #1E120A 100%)",
              position: "relative",
            }}
          />

          {/* Profile Details Body */}
          <div
            style={{
              padding: "0 28px 24px",
              marginTop: -42,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
              {/* Avatar + Name row */}
              <div style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
                <div style={{ borderRadius: "50%", padding: 4, background: "var(--ng-panel)" }}>
                  <Avatar
                    src={authUser?.profilepic}
                    name={authUser?.fullname || authUser?.username}
                    size={84}
                    ring={true}
                    ringColor="var(--ng-accent)"
                  />
                </div>
                <div style={{ marginBottom: 4 }}>
                  <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 24, fontWeight: 700, color: "var(--ng-text)", margin: "0 0 4px" }}>
                    {authUser?.fullname || authUser?.username}
                  </h2>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--ng-muted)", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: "var(--ng-online)" }}>●</span>
                    <span style={{ fontWeight: 600, color: "var(--ng-online)" }}>Active</span>
                    <span>·</span>
                    <span>{authUser?.statusNote || settings.statusNote || "Exploring Night Garden"}</span>
                  </p>
                </div>
              </div>

              {/* Edit button */}
              <button
                onClick={() => {
                  setEditFullname(authUser?.fullname || "");
                  setEditStatusNote(authUser?.statusNote !== undefined ? authUser.statusNote : (settings.statusNote || ""));
                  setIsEditingProfile(true);
                }}
                style={{
                  background: "var(--ng-hover)",
                  color: "var(--ng-text)",
                  border: "1px solid var(--ng-border)",
                  borderRadius: "var(--r-btn)",
                  padding: "8px 20px",
                  fontFamily: "var(--font-body)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "background 0.15s, border-color 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--ng-border)";
                  e.currentTarget.style.borderColor = "var(--ng-accent)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--ng-hover)";
                  e.currentTarget.style.borderColor = "var(--ng-border)";
                }}
              >
                Edit
              </button>
            </div>

            {/* Vibe Tags Section */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
              {((authUser?.vibeTags && authUser.vibeTags.length > 0) ? authUser.vibeTags : (settings.vibeTags || [])).map((tag) => (
                <span
                  key={tag}
                  style={{
                    background: "var(--ng-hover)",
                    color: "var(--ng-text)",
                    border: "1px solid var(--ng-border)",
                    borderRadius: 99,
                    padding: "4px 12px",
                    fontFamily: "var(--font-body)",
                    fontSize: 12,
                    fontWeight: 500,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveVibeTag(tag)}
                    aria-label={`Remove ${tag}`}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--ng-muted)",
                      cursor: "pointer",
                      padding: 0,
                      fontSize: 12,
                      lineHeight: 1,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ng-terracotta)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ng-muted)")}
                  >
                    ×
                  </button>
                </span>
              ))}

              {/* Add vibe action */}
              {showAddVibe ? (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <input
                    type="text"
                    autoFocus
                    placeholder="tag (e.g. gamedev)"
                    value={newVibeText}
                    onChange={(e) => setNewVibeText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddVibeTag();
                      if (e.key === "Escape") setShowAddVibe(false);
                    }}
                    style={{
                      background: "var(--ng-hover)",
                      border: "1px solid var(--ng-accent)",
                      borderRadius: 99,
                      padding: "4px 12px",
                      fontFamily: "var(--font-body)",
                      fontSize: 12,
                      color: "var(--ng-text)",
                      outline: "none",
                      width: 140,
                    }}
                  />
                  <button
                    onClick={handleAddVibeTag}
                    style={{
                      background: "var(--ng-accent)",
                      color: "var(--ng-accent-fg)",
                      border: "none",
                      borderRadius: 99,
                      padding: "4px 10px",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Add
                  </button>
                </div>
              ) : (
                (settings.vibeTags || []).length < 5 && (
                  <button
                    onClick={() => setShowAddVibe(true)}
                    style={{
                      background: "none",
                      color: "var(--ng-muted)",
                      border: "1px dashed var(--ng-border)",
                      borderRadius: 99,
                      padding: "4px 12px",
                      fontFamily: "var(--font-body)",
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: "pointer",
                      transition: "color 0.15s, border-color 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "var(--ng-accent)";
                      e.currentTarget.style.borderColor = "var(--ng-accent)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "var(--ng-muted)";
                      e.currentTarget.style.borderColor = "var(--ng-border)";
                    }}
                  >
                    + add vibe
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {/* ================= DUAL SETTINGS GRID ================= */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
          
          {/* Card 1: Privacy & Notifications */}
          <div
            style={{
              background: "var(--ng-panel)",
              border: "1px solid var(--ng-border)",
              borderRadius: "var(--r-card)",
              padding: "20px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: 16, fontWeight: 700, color: "var(--ng-text)", margin: 0 }}>
              Privacy & Notifications
            </h3>

            {/* Read receipts */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600, color: "var(--ng-text)", margin: "0 0 2px" }}>
                  Read receipts
                </p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--ng-muted)", margin: 0 }}>
                  Show when you have seen messages
                </p>
              </div>
              <button
                role="switch"
                aria-checked={settings.readReceipts}
                onClick={() => handleToggle("readReceipts")}
                style={{
                  width: 44,
                  height: 24,
                  borderRadius: 99,
                  backgroundColor: settings.readReceipts ? "var(--ng-accent)" : "var(--ng-hover)",
                  border: "1px solid var(--ng-border)",
                  cursor: "pointer",
                  position: "relative",
                  transition: "background 0.2s",
                  padding: 0,
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: 2,
                    left: settings.readReceipts ? 22 : 2,
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    backgroundColor: settings.readReceipts ? "var(--ng-accent-fg)" : "var(--ng-muted)",
                    transition: "left 0.2s, background 0.2s",
                  }}
                />
              </button>
            </div>

            {/* Typing indicator */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600, color: "var(--ng-text)", margin: "0 0 2px" }}>
                  Typing indicator
                </p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--ng-muted)", margin: 0 }}>
                  Let others see you typing
                </p>
              </div>
              <button
                role="switch"
                aria-checked={settings.typingIndicators}
                onClick={() => handleToggle("typingIndicators")}
                style={{
                  width: 44,
                  height: 24,
                  borderRadius: 99,
                  backgroundColor: settings.typingIndicators ? "var(--ng-accent)" : "var(--ng-hover)",
                  border: "1px solid var(--ng-border)",
                  cursor: "pointer",
                  position: "relative",
                  transition: "background 0.2s",
                  padding: 0,
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: 2,
                    left: settings.typingIndicators ? 22 : 2,
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    backgroundColor: settings.typingIndicators ? "var(--ng-accent-fg)" : "var(--ng-muted)",
                    transition: "left 0.2s, background 0.2s",
                  }}
                />
              </button>
            </div>

            {/* Quiet hours */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600, color: "var(--ng-text)", margin: "0 0 2px" }}>
                    Quiet hours
                  </p>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--ng-muted)", margin: 0 }}>
                    {settings.quietHours?.start || "23:00"} to {settings.quietHours?.end || "07:00"}, only nudges pass
                  </p>
                </div>
                <button
                  role="switch"
                  aria-checked={settings.quietHours?.enabled}
                  onClick={handleQuietHoursToggle}
                  style={{
                    width: 44,
                    height: 24,
                    borderRadius: 99,
                    backgroundColor: settings.quietHours?.enabled ? "var(--ng-accent)" : "var(--ng-hover)",
                    border: "1px solid var(--ng-border)",
                    cursor: "pointer",
                    position: "relative",
                    transition: "background 0.2s",
                    padding: 0,
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      top: 2,
                      left: settings.quietHours?.enabled ? 22 : 2,
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      backgroundColor: settings.quietHours?.enabled ? "var(--ng-accent-fg)" : "var(--ng-muted)",
                      transition: "left 0.2s, background 0.2s",
                    }}
                  />
                </button>
              </div>

              {settings.quietHours?.enabled && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4, background: "var(--ng-hover)", padding: "8px 12px", borderRadius: "var(--r-btn)" }}>
                  <span style={{ fontSize: 12, color: "var(--ng-muted)" }}>From</span>
                  <input
                    type="time"
                    value={settings.quietHours?.start || "23:00"}
                    onChange={(e) => handleQuietHoursTimeChange("start", e.target.value)}
                    style={{
                      background: "var(--ng-panel)",
                      border: "1px solid var(--ng-border)",
                      color: "var(--ng-text)",
                      padding: "4px 8px",
                      borderRadius: 6,
                      fontSize: 12,
                    }}
                  />
                  <span style={{ fontSize: 12, color: "var(--ng-muted)" }}>To</span>
                  <input
                    type="time"
                    value={settings.quietHours?.end || "07:00"}
                    onChange={(e) => handleQuietHoursTimeChange("end", e.target.value)}
                    style={{
                      background: "var(--ng-panel)",
                      border: "1px solid var(--ng-border)",
                      color: "var(--ng-text)",
                      padding: "4px 8px",
                      borderRadius: 6,
                      fontSize: 12,
                    }}
                  />
                </div>
              )}
            </div>

            {/* Last seen */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600, color: "var(--ng-text)", margin: "0 0 2px" }}>
                  Last seen
                </p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--ng-muted)", margin: 0 }}>
                  Hide when you were last online
                </p>
              </div>
              <button
                role="switch"
                aria-checked={settings.lastSeen}
                onClick={() => handleToggle("lastSeen")}
                style={{
                  width: 44,
                  height: 24,
                  borderRadius: 99,
                  backgroundColor: settings.lastSeen ? "var(--ng-accent)" : "var(--ng-hover)",
                  border: "1px solid var(--ng-border)",
                  cursor: "pointer",
                  position: "relative",
                  transition: "background 0.2s",
                  padding: 0,
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: 2,
                    left: settings.lastSeen ? 22 : 2,
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    backgroundColor: settings.lastSeen ? "var(--ng-accent-fg)" : "var(--ng-muted)",
                    transition: "left 0.2s, background 0.2s",
                  }}
                />
              </button>
            </div>
          </div>

          {/* Card 2: Appearance & Styling (NG5) */}
          <div
            style={{
              background: "var(--ng-panel)",
              border: "1px solid var(--ng-border)",
              borderRadius: "var(--r-card)",
              padding: "20px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 22,
            }}
          >
            <div>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--ng-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  margin: "0 0 12px",
                }}
              >
                Accent Colour
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {ACCENT_COLORS.map((swatch) => {
                  const isSelected = (settings.accentColor || "#E8A33D") === swatch.hex;
                  return (
                    <button
                      key={swatch.name}
                      onClick={() => handleAccentChange(swatch.hex, swatch.fg)}
                      aria-label={`Select ${swatch.name} accent`}
                      title={swatch.name}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        backgroundColor: swatch.hex,
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        boxShadow: isSelected
                          ? `0 0 0 2px var(--ng-panel), 0 0 0 4px ${swatch.hex}`
                          : "none",
                        transition: "transform 0.15s, box-shadow 0.15s",
                        transform: isSelected ? "scale(1.15)" : "scale(1)",
                      }}
                    />
                  );
                })}
              </div>
            </div>

            <div>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--ng-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  margin: "0 0 12px",
                }}
              >
                Bubble Style
              </p>
              <div style={{ display: "flex", gap: 8, background: "var(--ng-hover)", padding: 4, borderRadius: "var(--r-btn)", width: "fit-content" }}>
                {Object.values(BUBBLE_STYLES).map((b) => {
                  const isSelected = (settings.bubbleStyle || "rounded") === b.id;
                  return (
                    <button
                      key={b.id}
                      onClick={() => handleBubbleChange(b.id)}
                      style={{
                        background: isSelected ? "var(--ng-accent)" : "transparent",
                        color: isSelected ? "var(--ng-accent-fg)" : "var(--ng-muted)",
                        border: "none",
                        borderRadius: "var(--r-btn)",
                        padding: "6px 16px",
                        fontFamily: "var(--font-body)",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "background 0.15s, color 0.15s",
                      }}
                    >
                      {b.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ================= KEYBOARD SHORTCUTS REFERENCE ================= */}
        <div
          style={{
            background: "var(--ng-panel)",
            border: "1px solid var(--ng-border)",
            borderRadius: "var(--r-card)",
            padding: "20px 24px",
          }}
        >
          <h3 style={{ fontFamily: "var(--font-heading)", fontSize: 16, fontWeight: 700, color: "var(--ng-text)", margin: "0 0 12px" }}>
            Keyboard Shortcuts
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
            {[
              { keys: "Ctrl + K", desc: "Focus search input" },
              { keys: "Enter", desc: "Send message" },
              { keys: "Shift + Enter", desc: "Add new line in composer" },
              { keys: "Escape", desc: "Close modals and details drawer" },
              { keys: "Ctrl + /", desc: "Toggle shortcuts view" },
            ].map((sc) => (
              <div key={sc.keys} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "var(--ng-hover)", borderRadius: "var(--r-btn)" }}>
                <span style={{ fontSize: 13, color: "var(--ng-text)" }}>{sc.desc}</span>
                <kbd style={{ fontFamily: "monospace", fontSize: 11, background: "var(--ng-panel)", border: "1px solid var(--ng-border)", padding: "2px 6px", borderRadius: 4, color: "var(--ng-accent)" }}>
                  {sc.keys}
                </kbd>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ================= EDIT PROFILE MODAL ================= */}
      {isEditingProfile && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: 16,
          }}
          onClick={() => setIsEditingProfile(false)}
        >
          <div
            style={{
              background: "var(--ng-panel)",
              border: "1px solid var(--ng-border)",
              borderRadius: "var(--r-card)",
              width: "100%",
              maxWidth: 420,
              padding: 24,
              boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: 18, fontWeight: 700, color: "var(--ng-text)", margin: "0 0 16px" }}>
              Edit Profile
            </h3>
            <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ng-muted)", marginBottom: 6 }}>
                  Display Name
                </label>
                <input
                  type="text"
                  value={editFullname}
                  onChange={(e) => setEditFullname(e.target.value)}
                  style={{
                    width: "100%",
                    background: "var(--ng-hover)",
                    border: "1px solid var(--ng-border)",
                    borderRadius: "var(--r-btn)",
                    padding: "8px 12px",
                    color: "var(--ng-text)",
                    fontSize: 14,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ng-muted)", marginBottom: 6 }}>
                  Status Note
                </label>
                <input
                  type="text"
                  value={editStatusNote}
                  onChange={(e) => setEditStatusNote(e.target.value)}
                  placeholder="e.g. building ChatApp"
                  style={{
                    width: "100%",
                    background: "var(--ng-hover)",
                    border: "1px solid var(--ng-border)",
                    borderRadius: "var(--r-btn)",
                    padding: "8px 12px",
                    color: "var(--ng-text)",
                    fontSize: 14,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--ng-muted)",
                    padding: "8px 16px",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  style={{
                    background: "var(--ng-accent)",
                    color: "var(--ng-accent-fg)",
                    border: "none",
                    borderRadius: "var(--r-btn)",
                    padding: "8px 20px",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {savingProfile ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsView;
