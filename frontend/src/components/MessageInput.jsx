import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";

const EMOJIS = ["😊", "🧡", "🔥", "👍", "🎉", "😂", "✨", "👋", "👀", "🚀", "💯", "😴", "🙌", "💡"];

const MessageInput = ({
  onSend,
  sending,
  recipientName = "",
  onNudge,
  onSendAudio,
  activeColor = "var(--ng-accent)",
  activeColorFg = "var(--ng-accent-fg)",
}) => {
  const [text, setText] = useState("");
  const [showEmojis, setShowEmojis] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [disappearMode, setDisappearMode] = useState("off"); // off, 24h, 7d
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    let timer;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  const handleSubmit = (e) => {
    e?.preventDefault?.();
    if (!text.trim()) return;
    onSend(text);
    setText("");
    setShowEmojis(false);
    setShowAttachMenu(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSelectEmoji = (emoji) => {
    setText((prev) => prev + emoji);
    textareaRef.current?.focus();
  };

  const handleDisappearToggle = () => {
    const next = disappearMode === "off" ? "24h" : disappearMode === "24h" ? "7d" : "off";
    setDisappearMode(next);
    toast(`Disappearing messages: ${next === "off" ? "Off" : next}`);
  };

  const handleScheduleSend = () => {
    toast("Schedule send: Choose a time (feature preview)");
  };

  const handleFinishRecording = () => {
    setIsRecording(false);
    if (onSendAudio) {
      onSendAudio(`audio::voice_note_${Date.now()}`, `${Math.max(1, recordingSeconds)}s`);
    } else {
      onSend(`🎤 Voice message (${recordingSeconds}s)`);
    }
    toast.success("Voice note sent!");
  };

  const handleCancelRecording = () => {
    setIsRecording(false);
    toast("Voice recording cancelled");
  };

  const handleAttachment = (type) => {
    setShowAttachMenu(false);
    if (type === "photo") {
      fileInputRef.current?.click();
    } else {
      toast(`Attachment selected: ${type}`);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        background: "var(--ng-bg)",
        borderTop: "1px solid var(--ng-border)",
        padding: "10px 16px 14px",
        flexShrink: 0,
        position: "relative",
      }}
    >
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        style={{ display: "none" }}
        onChange={(e) => {
          if (e.target.files?.[0]) {
            toast.success(`Attached ${e.target.files[0].name}`);
          }
        }}
      />

      {/* QUICK ACTION CHIPS ROW (Disappear, Schedule, Nudge) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
        }}
      >
        {/* Disappear chip */}
        <button
          onClick={handleDisappearToggle}
          aria-label={`Toggle disappearing messages, current: ${disappearMode}`}
          style={{
            background: "var(--ng-hover)",
            border: "1px solid var(--ng-border)",
            color: disappearMode === "off" ? "var(--ng-muted)" : "var(--ng-accent)",
            fontFamily: "var(--font-body)",
            fontSize: 12,
            fontWeight: 500,
            padding: "5px 12px",
            borderRadius: 99,
            cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ng-text)")}
          onMouseLeave={(e) =>
            (e.currentTarget.style.color =
              disappearMode === "off" ? "var(--ng-muted)" : "var(--ng-accent)")
          }
        >
          Disappear: {disappearMode}
        </button>

        {/* Schedule send chip */}
        <button
          onClick={handleScheduleSend}
          aria-label="Schedule send message"
          style={{
            background: "var(--ng-hover)",
            border: "1px solid var(--ng-border)",
            color: "var(--ng-muted)",
            fontFamily: "var(--font-body)",
            fontSize: 12,
            fontWeight: 500,
            padding: "5px 12px",
            borderRadius: 99,
            cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ng-text)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ng-muted)")}
        >
          Schedule send
        </button>

        {/* Nudge chip with accent outline */}
        <button
          onClick={onNudge}
          aria-label="Nudge user"
          style={{
            background: "transparent",
            border: `1px solid ${activeColor}`,
            color: activeColor,
            fontFamily: "var(--font-body)",
            fontSize: 12,
            fontWeight: 600,
            padding: "5px 14px",
            borderRadius: 99,
            cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = activeColor;
            e.currentTarget.style.color = activeColorFg;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = activeColor;
          }}
        >
          Nudge
        </button>
      </div>

      {/* ATTACHMENT MENU POPUP */}
      {showAttachMenu && (
        <div
          style={{
            position: "absolute",
            bottom: 64,
            left: 16,
            background: "var(--ng-panel)",
            border: "1px solid var(--ng-border)",
            borderRadius: "var(--r-card)",
            padding: "6px 0",
            width: 180,
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            zIndex: 30,
          }}
        >
          <button
            onClick={() => handleAttachment("photo")}
            style={{
              width: "100%",
              textAlign: "left",
              padding: "10px 16px",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font-body)",
              fontSize: 13,
              color: "var(--ng-text)",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--ng-hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            <span>📷</span> Photos & Videos
          </button>
          <button
            onClick={() => handleAttachment("document")}
            style={{
              width: "100%",
              textAlign: "left",
              padding: "10px 16px",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font-body)",
              fontSize: 13,
              color: "var(--ng-text)",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--ng-hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            <span>📄</span> Document
          </button>
          <button
            onClick={() => handleAttachment("poll")}
            style={{
              width: "100%",
              textAlign: "left",
              padding: "10px 16px",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font-body)",
              fontSize: 13,
              color: "var(--ng-text)",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--ng-hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            <span>📊</span> Poll
          </button>
        </div>
      )}

      {/* EMOJI PICKER POPUP */}
      {showEmojis && (
        <div
          style={{
            position: "absolute",
            bottom: 64,
            right: 64,
            background: "var(--ng-panel)",
            border: "1px solid var(--ng-border)",
            borderRadius: "var(--r-card)",
            padding: "10px 12px",
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 6,
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            zIndex: 30,
          }}
        >
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleSelectEmoji(emoji)}
              style={{
                background: "none",
                border: "none",
                fontSize: 20,
                cursor: "pointer",
                padding: "4px",
                borderRadius: 8,
                transition: "transform 0.1s, background 0.1s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--ng-hover)";
                e.currentTarget.style.transform = "scale(1.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "none";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* MAIN PILL INPUT CONTAINER */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          flexWrap: "nowrap",
          background: "var(--ng-hover)",
          border: "1px solid var(--ng-border)",
          borderRadius: 28,
          padding: "4px 8px 4px 6px",
          minHeight: 52,
          transition: "border-color 0.15s, box-shadow 0.15s",
        }}
      >
        {isRecording ? (
          /* RECORDING IN PROGRESS VIEW */
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              padding: "4px 10px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  backgroundColor: "var(--ng-terracotta)",
                  animation: "ngPulseSlow 1s infinite ease-in-out",
                }}
              />
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--ng-text)",
                }}
              >
                Recording voice note... {recordingSeconds}s
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                onClick={handleCancelRecording}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--ng-muted)",
                  fontFamily: "var(--font-body)",
                  fontSize: 13,
                  padding: "6px 12px",
                  borderRadius: "var(--r-btn)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleFinishRecording}
                style={{
                  background: activeColor,
                  color: activeColorFg,
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "var(--font-body)",
                  fontSize: 13,
                  fontWeight: 600,
                  padding: "6px 16px",
                  borderRadius: 99,
                }}
              >
                Send
              </button>
            </div>
          </div>
        ) : (
          /* STANDARD INPUT VIEW */
          <>
            {/* '+' Attachment button (44px min touch target) */}
            <button
              type="button"
              onClick={() => {
                setShowAttachMenu(!showAttachMenu);
                setShowEmojis(false);
              }}
              aria-label="Add attachment"
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: showAttachMenu ? "var(--ng-text)" : "var(--ng-muted)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "color 0.15s, background 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--ng-text)";
                e.currentTarget.style.background = "rgba(255,255,255,0.04)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = showAttachMenu
                  ? "var(--ng-text)"
                  : "var(--ng-muted)";
                e.currentTarget.style.background = "none";
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>

            {/* Input field */}
            <input
              ref={textareaRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={recipientName ? `Message ${recipientName}` : "Type a message..."}
              aria-label="Message input"
              style={{
                flex: 1,
                minWidth: 0,
                background: "transparent",
                border: "none",
                outline: "none",
                fontFamily: "var(--font-body)",
                fontSize: 14,
                color: "var(--ng-text)",
                caretColor: activeColor,
                padding: "8px 4px",
              }}
            />

            {/* Emoji button (44px min touch target) */}
            <button
              type="button"
              onClick={() => {
                setShowEmojis(!showEmojis);
                setShowAttachMenu(false);
              }}
              aria-label="Add emoji"
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: showEmojis ? "var(--ng-text)" : "var(--ng-muted)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "color 0.15s, background 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--ng-text)";
                e.currentTarget.style.background = "rgba(255,255,255,0.04)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = showEmojis
                  ? "var(--ng-text)"
                  : "var(--ng-muted)";
                e.currentTarget.style.background = "none";
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="19"
                height="19"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" />
              </svg>
            </button>

            {/* Microphone button (44px min touch target) */}
            <button
              type="button"
              onClick={() => setIsRecording(true)}
              aria-label="Record voice message"
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--ng-muted)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "color 0.15s, background 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--ng-text)";
                e.currentTarget.style.background = "rgba(255,255,255,0.04)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--ng-muted)";
                e.currentTarget.style.background = "none";
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="19"
                height="19"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            </button>

            {/* Saffron Send button (44px min touch target) */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={sending || !text.trim()}
              aria-label="Send message"
              style={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                backgroundColor: text.trim() ? activeColor : "var(--ng-border)",
                color: text.trim() ? activeColorFg : "var(--ng-muted)",
                border: "none",
                cursor: text.trim() ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                opacity: text.trim() ? 1 : 0.6,
                transition: "transform 0.15s, background-color 0.15s, opacity 0.15s",
              }}
              onMouseEnter={(e) => {
                if (text.trim()) e.currentTarget.style.transform = "scale(1.06)";
              }}
              onMouseLeave={(e) => {
                if (text.trim()) e.currentTarget.style.transform = "scale(1)";
              }}
            >
              {sending ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                  style={{ transform: "rotate(-20deg) translate(1px, -1px)" }}
                >
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default MessageInput;
