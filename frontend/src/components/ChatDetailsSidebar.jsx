import { useState, useEffect } from "react";
import Avatar from "./Avatar";
import useChatStore from "../store/useChatStore";
import axiosInstance from "../utils/axios";
import toast from "react-hot-toast";

const PALETTE = [
  { name: "Saffron", hex: "#E8A33D", fg: "#16110A" },
  { name: "Terracotta", hex: "#C9743E", fg: "#16110A" },
  { name: "Sage", hex: "#7FA38F", fg: "#0E1311" },
  { name: "Teal", hex: "#6E9AA6", fg: "#0E1311" },
  { name: "Lilac", hex: "#B89FD9", fg: "#0E1311" },
];

const ChatDetailsSidebar = ({
  user,
  group,
  onClose,
  activeColor = "#E8A33D",
  onColorChange,
  onViewPinned,
}) => {
  const { messages } = useChatStore();

  const entityId = user?._id || group?._id;

  const [isMuted, setIsMuted] = useState(() => {
    try {
      return localStorage.getItem(`chatapp_muted_${entityId}`) === "true";
    } catch {
      return false;
    }
  });

  const [disappearingMode, setDisappearingMode] = useState("off");

  const displayName = group ? group.groupName : (user?.fullname || user?.username || "Contact");
  const handle = group
    ? `${group.participants?.length || 0} members · Group`
    : `@${user?.username || "user"}`;
  const avatarSrc = group ? group.groupPic : user?.profilepic;

  // Filter actual shared media/files from current conversation messages
  const sharedItems = (messages || []).filter(
    (m) => m.audioUrl || m.image || m.message?.startsWith("audio::")
  );

  // Filter pinned messages from current conversation
  const pinnedMessages = (messages || []).filter((m) => m.isPinned);

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    try {
      localStorage.setItem(`chatapp_muted_${entityId}`, String(next));
    } catch {
      // ignore
    }
    toast.success(next ? `Muted notifications for ${displayName}` : `Unmuted ${displayName}`);
  };

  const handleDisappearingChange = async (duration) => {
    setDisappearingMode(duration);
    if (user?._id) {
      try {
        await axiosInstance.put(`/message/conversation/${user._id}/disappearing`, { duration });
        toast.success(`Disappearing messages: ${duration === "off" ? "Off" : duration}`);
      } catch {
        toast.error("Failed to update disappearing setting");
      }
    }
  };

  const S = {
    sectionLabel: {
      fontFamily: "var(--font-body)",
      fontSize: 10,
      fontWeight: 600,
      color: "var(--ng-muted)",
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      margin: "0 0 10px",
    },
    row: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "12px 0",
      borderBottom: "1px solid var(--ng-border)",
    },
    rowLabel: {
      fontFamily: "var(--font-body)",
      fontSize: 13,
      fontWeight: 500,
      color: "var(--ng-text)",
      margin: 0,
    },
  };

  return (
    <aside
      style={{
        width: 272,
        minWidth: 272,
        height: "100%",
        background: "var(--ng-panel)",
        borderLeft: "1px solid var(--ng-border)",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        flexShrink: 0,
        boxSizing: "border-box",
      }}
      aria-label="Conversation details"
    >
      {/* Top bar with close button */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          padding: "12px 14px 0",
        }}
      >
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close conversation details"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--ng-muted)",
              padding: 6,
              borderRadius: "var(--r-btn)",
              minWidth: 36,
              minHeight: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "color 0.15s, background 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--ng-text)";
              e.currentTarget.style.background = "var(--ng-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--ng-muted)";
              e.currentTarget.style.background = "none";
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Profile Header */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          padding: "4px 16px 20px",
          borderBottom: "1px solid var(--ng-border)",
        }}
      >
        <Avatar
          src={avatarSrc}
          name={displayName}
          size={72}
          ring={true}
          ringColor={activeColor}
        />
        <p
          style={{
            fontFamily: "var(--font-heading)",
            fontWeight: 700,
            fontSize: 17,
            color: "var(--ng-text)",
            margin: "12px 0 2px",
          }}
        >
          {displayName}
        </p>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 12,
            color: "var(--ng-muted)",
            margin: 0,
          }}
        >
          {handle}
        </p>
      </div>

      <div style={{ padding: "16px 16px" }}>
        {/* SHARED SECTION */}
        <div style={{ marginBottom: 20 }}>
          <p style={S.sectionLabel}>Shared ({sharedItems.length})</p>
          {sharedItems.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 6,
              }}
            >
              {sharedItems.slice(0, 9).map((item, idx) => (
                <div
                  key={item._id || idx}
                  role="button"
                  tabIndex={0}
                  aria-label={`Shared item ${idx + 1}`}
                  onClick={() => {
                    const el = document.getElementById(`msg-${item._id}`);
                    el?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                  style={{
                    width: "100%",
                    aspectRatio: "1",
                    borderRadius: 8,
                    backgroundColor: "var(--ng-hover)",
                    border: "1px solid var(--ng-border)",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 4,
                    transition: "transform 0.15s, opacity 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.04)";
                    e.currentTarget.style.opacity = "0.9";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.opacity = "1";
                  }}
                >
                  <span style={{ fontSize: 18 }}>
                    {item.audioUrl ? "🎤" : item.image ? "🖼️" : "📁"}
                  </span>
                  <span
                    style={{
                      fontSize: 9,
                      color: "var(--ng-muted)",
                      marginTop: 2,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: "100%",
                    }}
                  >
                    {item.audioUrl ? "Voice" : "Media"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                padding: "16px 0",
                textAlign: "center",
                color: "var(--ng-muted)",
                fontSize: 12,
              }}
            >
              No shared media yet
            </div>
          )}
        </div>

        {/* THEIR COLOUR SECTION */}
        <div style={{ marginBottom: 20 }}>
          <p style={S.sectionLabel}>Their Colour</p>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {PALETTE.map((swatch) => {
              const isSelected = activeColor === swatch.hex;
              return (
                <button
                  key={swatch.name}
                  onClick={() => onColorChange?.(swatch.hex, swatch.fg)}
                  aria-label={`Choose conversation color ${swatch.name}`}
                  title={swatch.name}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    backgroundColor: swatch.hex,
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    boxShadow: isSelected
                      ? `0 0 0 2px var(--ng-panel), 0 0 0 4px ${swatch.hex}`
                      : "none",
                    transition: "transform 0.15s, box-shadow 0.15s",
                    transform: isSelected ? "scale(1.1)" : "scale(1)",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.transform = "scale(1.12)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.transform = "scale(1)";
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* PINNED MESSAGES SECTION */}
        <div style={{ marginBottom: 20, paddingTop: 10, borderTop: "1px solid var(--ng-border)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <p style={{ ...S.sectionLabel, margin: 0 }}>Pinned Messages ({pinnedMessages.length})</p>
          </div>
          {pinnedMessages.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {pinnedMessages.map((msg) => (
                <div
                  key={msg._id}
                  onClick={() => {
                    const el = document.getElementById(`msg-${msg._id}`);
                    el?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                  role="button"
                  tabIndex={0}
                  style={{
                    padding: "8px 10px",
                    background: "var(--ng-hover)",
                    borderRadius: "var(--r-btn)",
                    border: "1px dashed var(--ng-accent)",
                    cursor: "pointer",
                    transition: "opacity 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "var(--ng-accent)" }}>📌 PINNED</span>
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 12,
                      color: "var(--ng-text)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {msg.message || (msg.audioUrl ? "🎤 Voice note" : "Message")}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: "var(--ng-muted)", fontSize: 12, padding: "8px 0" }}>
              No pinned messages
            </div>
          )}
        </div>

        {/* TOGGLES & SETTINGS */}
        <div>
          {/* Mute */}
          <div style={S.row}>
            <p style={S.rowLabel}>Mute</p>
            <button
              role="switch"
              aria-checked={isMuted}
              aria-label="Mute notifications"
              onClick={handleToggleMute}
              style={{
                width: 36,
                height: 20,
                borderRadius: 99,
                backgroundColor: isMuted ? "var(--ng-accent)" : "var(--ng-hover)",
                border: "1px solid var(--ng-border)",
                cursor: "pointer",
                position: "relative",
                transition: "background 0.2s",
                padding: 0,
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 2,
                  left: isMuted ? 18 : 2,
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  backgroundColor: isMuted ? "var(--ng-accent-fg)" : "var(--ng-muted)",
                  transition: "left 0.2s, background 0.2s",
                }}
              />
            </button>
          </div>

          {/* Disappearing Messages Duration */}
          <div style={{ ...S.row, flexDirection: "column", alignItems: "flex-start", gap: 8, borderBottom: "none" }}>
            <p style={S.rowLabel}>Disappearing Messages</p>
            <div style={{ display: "flex", gap: 6, width: "100%" }}>
              {["off", "1h", "24h"].map((dur) => (
                <button
                  key={dur}
                  onClick={() => handleDisappearingChange(dur)}
                  style={{
                    flex: 1,
                    padding: "4px 0",
                    borderRadius: 6,
                    border: disappearingMode === dur ? `1px solid ${activeColor}` : "1px solid var(--ng-border)",
                    background: disappearingMode === dur ? "rgba(232,163,61,0.15)" : "var(--ng-hover)",
                    color: disappearingMode === dur ? "var(--ng-accent)" : "var(--ng-muted)",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {dur === "off" ? "Off" : dur}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default ChatDetailsSidebar;
