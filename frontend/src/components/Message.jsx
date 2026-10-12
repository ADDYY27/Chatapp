import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Avatar from "./Avatar";

const Message = ({
  message,
  activeColor = "var(--ng-accent)",
  activeColorFg = "var(--ng-accent-fg)",
  onPinMessage,
}) => {
  const { authUser } = useAuth();
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [reactions, setReactions] = useState(message.reaction || null);

  const senderId = message.senderId?._id?.toString() || message.senderId?.toString();
  const myId = authUser?._id?.toString();
  const isMine = senderId === myId;

  const isGroup = message.isGroupMessage;
  const senderName = message.senderId?.fullname;
  const senderPic = message.senderId?.profilepic;

  const timeStr = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "4:09 PM";

  const isAudio = message.isAudio || message.message?.startsWith("audio::");
  const isPinned = message.isPinned;

  useEffect(() => {
    let interval;
    if (isPlayingAudio) {
      interval = setInterval(() => {
        setAudioProgress((prev) => {
          if (prev >= 100) {
            setIsPlayingAudio(false);
            return 0;
          }
          return prev + 5;
        });
      }, 300);
    }
    return () => clearInterval(interval);
  }, [isPlayingAudio]);

  const toggleAudioPlay = () => {
    setIsPlayingAudio(!isPlayingAudio);
  };

  /* Waveform bars heights */
  const barHeights = [8, 14, 20, 12, 18, 10, 16, 22, 14, 18, 12, 20, 16, 10, 14, 8];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        marginBottom: 8,
        alignItems: isMine ? "flex-end" : "flex-start",
        width: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 10,
          justifyContent: isMine ? "flex-end" : "flex-start",
          maxWidth: "75%",
          alignItems: "flex-end",
        }}
      >
        {/* Sender avatar for incoming messages in group */}
        {!isMine && isGroup && (
          <Avatar
            src={senderPic}
            name={senderName}
            size={28}
            style={{ marginBottom: 4 }}
          />
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
          {isGroup && !isMine && senderName && (
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 11,
                color: "var(--ng-muted)",
                margin: "0 0 2px",
                paddingLeft: 4,
              }}
            >
              {senderName}
            </p>
          )}

          {/* PINNED MESSAGE CARD */}
          {isPinned ? (
            <div
              style={{
                padding: "12px 18px",
                borderRadius: "var(--r-card)",
                background: "var(--ng-panel)",
                border: "1px solid var(--ng-border)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
                maxWidth: 360,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 6,
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.2}
                  style={{ color: "var(--ng-accent)" }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16 4v4l2 3v2h-6v7l-1 1-1-1v-7H4v-2l2-3V4h10z"
                  />
                </svg>
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 10,
                    fontWeight: 700,
                    color: "var(--ng-accent)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  Pinned
                </span>
              </div>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 14,
                  fontWeight: 500,
                  color: "var(--ng-text)",
                  margin: 0,
                  lineHeight: 1.4,
                }}
              >
                {message.message}
              </p>
            </div>
          ) : isAudio ? (
            /* AUDIO / VOICE NOTE BUBBLE */
            <div style={{ position: "relative" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 16px",
                  borderRadius: "24px",
                  background: isMine ? activeColor : "var(--ng-hover)",
                  color: isMine ? activeColorFg : "var(--ng-text)",
                  border: isMine ? "none" : "1px solid var(--ng-border)",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
                  minWidth: 220,
                }}
              >
                {/* Play/Pause Button */}
                <button
                  onClick={toggleAudioPlay}
                  aria-label={isPlayingAudio ? "Pause voice message" : "Play voice message"}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    background: isMine ? activeColorFg : "var(--ng-accent)",
                    color: isMine ? activeColor : "var(--ng-accent-fg)",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "transform 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                >
                  {isPlayingAudio ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      style={{ marginLeft: 2 }}
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>

                {/* Waveform Bars */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                    flex: 1,
                    height: 24,
                  }}
                >
                  {barHeights.map((h, i) => {
                    const isPlayed = (i / barHeights.length) * 100 <= audioProgress;
                    return (
                      <span
                        key={i}
                        style={{
                          width: 3,
                          height: isPlayingAudio ? Math.max(6, (h * (0.6 + Math.random() * 0.8))) : h,
                          borderRadius: 2,
                          backgroundColor: isMine
                            ? (isPlayed ? activeColorFg : "rgba(22,17,10,0.35)")
                            : (isPlayed ? "var(--ng-accent)" : "var(--ng-muted)"),
                          transition: "height 0.2s, background-color 0.15s",
                        }}
                      />
                    );
                  })}
                </div>

                {/* Duration */}
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 12,
                    fontWeight: 600,
                    opacity: 0.85,
                    whiteSpace: "nowrap",
                  }}
                >
                  {message.duration || "0:14"}
                </span>
              </div>

              {/* Reaction badge floating below */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  marginTop: 4,
                  marginLeft: 12,
                  background: "var(--ng-panel)",
                  border: "1px solid var(--ng-border)",
                  borderRadius: 99,
                  padding: "2px 8px",
                  fontSize: 11,
                  fontFamily: "var(--font-body)",
                  cursor: "pointer",
                }}
                onClick={() => setReactions(reactions ? null : "🧡 1")}
              >
                <span>{reactions || "🧡 1"}</span>
              </div>
            </div>
          ) : (
            /* STANDARD TEXT MESSAGE BUBBLE */
            <div
              style={{
                padding: "10px 16px",
                borderRadius: isMine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                fontFamily: "var(--font-body)",
                fontSize: 14,
                lineHeight: 1.5,
                wordBreak: "break-word",
                backgroundColor: isMine ? activeColor : "var(--ng-hover)",
                color: isMine ? activeColorFg : "var(--ng-text)",
                border: isMine ? "none" : "1px solid rgba(255,255,255,0.04)",
                boxShadow: isMine
                  ? "0 2px 12px rgba(232, 163, 61, 0.15)"
                  : "0 1px 4px rgba(0,0,0,0.2)",
              }}
            >
              {message.message}
            </div>
          )}

          {/* STATUS / READ RECEIPT / TIMESTAMP */}
          {!isPinned && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontSize: 11,
                fontFamily: "var(--font-body)",
                marginTop: 2,
                justifyContent: isMine ? "flex-end" : "flex-start",
                padding: "0 4px",
              }}
            >
              {isMine ? (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="13"
                    height="13"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="var(--ng-online)"
                    strokeWidth={2.5}
                    style={{ flexShrink: 0 }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span style={{ color: "var(--ng-muted)", fontSize: 11 }}>
                    Seen {timeStr}
                  </span>
                </>
              ) : (
                <span style={{ color: "var(--ng-muted)", opacity: 0.6 }}>
                  {timeStr}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Message;