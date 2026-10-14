import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import Avatar from "./Avatar";
import useChatStore from "../store/useChatStore";
import axiosInstance from "../utils/axios";
import toast from "react-hot-toast";
import { getSettings } from "../services/settingsService";

const QUICK_EMOJIS = ["❤️", "👍", "😂", "🔥", "➕"];
const MORE_EMOJIS = ["🎉", "✨", "👀", "🚀", "💯", "😴", "💡", "👏"];

const Message = ({
  message,
  activeColor = "var(--ng-accent)",
  activeColorFg = "var(--ng-accent-fg)",
}) => {
  const { authUser } = useAuth();
  const {
    setReplyingTo,
    updateMessageReactions,
    updateMessagePinned,
    removeMessageForMe,
  } = useChatStore();

  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showExtraEmojis, setShowExtraEmojis] = useState(false);

  // Audio playback state
  const audioRef = useRef(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);

  const senderId = message.senderId?._id?.toString() || message.senderId?.toString();
  const myId = authUser?._id?.toString();
  const isMine = senderId === myId;

  const isGroup = message.isGroupMessage;
  const senderName = message.senderId?.fullname;
  const senderPic = message.senderId?.profilepic;

  const formatReceiptTime = (dateVal) => {
    if (!dateVal) return "";
    try {
      return new Date(dateVal).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  const createdTimeStr = formatReceiptTime(message.createdAt) || formatReceiptTime(new Date());
  const readTimeStr = formatReceiptTime(message.readAt);
  const deliveredTimeStr = formatReceiptTime(message.deliveredAt);

  const isAudio = Boolean(message.audioUrl || message.isAudio || message.message?.startsWith("audio::"));
  const audioSrc = message.audioUrl;
  const isPinned = Boolean(message.isPinned);

  // Audio element listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (audio.duration) {
        setAudioProgress((audio.currentTime / audio.duration) * 100);
        setAudioCurrentTime(audio.currentTime);
      }
    };

    const handleEnded = () => {
      setIsPlayingAudio(false);
      setAudioProgress(0);
      setAudioCurrentTime(0);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [audioSrc]);

  const toggleAudioPlay = () => {
    if (!audioRef.current && !audioSrc) {
      // Fallback timer simulation for legacy voice notes
      setIsPlayingAudio((prev) => !prev);
      return;
    }
    if (audioRef.current) {
      if (isPlayingAudio) {
        audioRef.current.pause();
        setIsPlayingAudio(false);
      } else {
        audioRef.current.play().then(() => {
          setIsPlayingAudio(true);
        }).catch((err) => {
          console.error("Audio playback error:", err);
          toast.error("Could not play audio");
        });
      }
    }
  };

  // Waveform heights
  const barHeights = [8, 14, 20, 12, 18, 10, 16, 22, 14, 18, 12, 20, 16, 10, 14, 8, 18, 12, 16, 10];

  // Group reactions by emoji and check if current user reacted
  const reactionGroups = {};
  (message.reactions || []).forEach((r) => {
    if (!reactionGroups[r.emoji]) {
      reactionGroups[r.emoji] = { count: 0, hasReacted: false };
    }
    reactionGroups[r.emoji].count += 1;
    const rUserId = r.userId?._id?.toString() || r.userId?.toString();
    if (rUserId === myId) {
      reactionGroups[r.emoji].hasReacted = true;
    }
  });

  const handleReact = async (emoji) => {
    setShowExtraEmojis(false);
    try {
      // Optimistic update
      const existing = (message.reactions || []).filter(
        (r) => !((r.userId?._id?.toString() || r.userId?.toString()) === myId && r.emoji === emoji)
      );
      const wasReacted = (message.reactions || []).some(
        (r) => (r.userId?._id?.toString() || r.userId?.toString()) === myId && r.emoji === emoji
      );
      const nextReactions = wasReacted
        ? existing
        : [...existing, { emoji, userId: myId }];

      updateMessageReactions(message._id, nextReactions);
      await axiosInstance.post(`/message/${message._id}/reaction`, { emoji });
    } catch {
      toast.error("Failed to update reaction");
    }
  };

  const handleTogglePin = async () => {
    setShowMenu(false);
    try {
      const nextPinned = !isPinned;
      updateMessagePinned(message._id, nextPinned, nextPinned ? new Date() : null, nextPinned ? myId : null);
      await axiosInstance.put(`/message/${message._id}/pin`);
      toast.success(nextPinned ? "Message pinned" : "Message unpinned");
    } catch {
      toast.error("Failed to pin message");
    }
  };

  const handleReply = () => {
    setShowMenu(false);
    setReplyingTo({
      _id: message._id,
      text: message.message || (isAudio ? "🎤 Voice message" : "Message"),
      senderName: isMine ? "You" : senderName || "Them",
    });
  };

  const handleDeleteForMe = async () => {
    setShowMenu(false);
    try {
      removeMessageForMe(message._id);
      await axiosInstance.post(`/message/${message._id}/delete-for-me`);
      toast.success("Message deleted for you");
    } catch {
      toast.error("Failed to delete message");
    }
  };

  const scrollToRepliedMessage = (targetId) => {
    if (!targetId) return;
    const el = document.getElementById(`msg-${targetId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.style.transition = "background-color 0.3s";
      el.style.backgroundColor = "rgba(232, 163, 61, 0.2)";
      setTimeout(() => {
        el.style.backgroundColor = "transparent";
      }, 1500);
    } else {
      toast("Original message is not in current view");
    }
  };

  return (
    <div
      id={`msg-${message._id}`}
      style={{
        display: "flex",
        flexDirection: "column",
        marginBottom: 8,
        alignItems: isMine ? "flex-end" : "flex-start",
        width: "100%",
        position: "relative",
        borderRadius: "var(--r-card)",
        padding: "2px 4px",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowMenu(false);
        setShowExtraEmojis(false);
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 10,
          justifyContent: isMine ? "flex-end" : "flex-start",
          maxWidth: "75%",
          alignItems: "flex-end",
          position: "relative",
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

        <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0, position: "relative" }}>
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

          {/* REPLIED MESSAGE QUOTE PREVIEW */}
          {message.replyTo && (
            <div
              role="button"
              tabIndex={0}
              onClick={() => scrollToRepliedMessage(message.replyTo._id || message.replyTo)}
              onKeyDown={(e) => e.key === "Enter" && scrollToRepliedMessage(message.replyTo._id || message.replyTo)}
              aria-label="View replied message"
              style={{
                padding: "6px 10px",
                marginBottom: 2,
                borderRadius: "var(--r-btn)",
                background: "rgba(0, 0, 0, 0.28)",
                borderLeft: `3px solid ${activeColor}`,
                fontSize: 11,
                fontFamily: "var(--font-body)",
                color: "var(--ng-muted)",
                cursor: "pointer",
                maxWidth: 320,
                alignSelf: isMine ? "flex-end" : "flex-start",
                transition: "opacity 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              <span style={{ fontWeight: 600, color: "var(--ng-accent)", display: "block" }}>
                {message.replyTo.senderId?.fullname || (message.replyTo.senderId === myId ? "You" : "Reply")}
              </span>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                {message.replyTo.message || (message.replyTo.audioUrl ? "🎤 Voice message" : "Original message")}
              </span>
            </div>
          )}

          {/* PINNED MESSAGE CARD */}
          {isPinned ? (
            <div
              style={{
                padding: "12px 18px",
                borderRadius: "var(--r-card)",
                background: "var(--ng-panel)",
                border: "1px dashed var(--ng-accent)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
                maxWidth: 360,
                position: "relative",
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
                  width="13"
                  height="13"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.4}
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
                  PINNED
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
                {message.message || (isAudio ? "🎤 Voice message" : "")}
              </p>
            </div>
          ) : isAudio ? (
            /* AUDIO / VOICE NOTE BUBBLE */
            <div style={{ position: "relative" }}>
              {audioSrc && <audio ref={audioRef} src={audioSrc} preload="metadata" />}
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
                  minWidth: 230,
                }}
              >
                {/* Play/Pause Button */}
                <button
                  onClick={toggleAudioPlay}
                  aria-label={isPlayingAudio ? "Pause voice message" : "Play voice message"}
                  style={{
                    width: 36,
                    height: 36,
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

                {/* 20-Bar Waveform */}
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
                          height: isPlayingAudio ? Math.max(6, Math.min(24, h * (0.6 + Math.random() * 0.8))) : h,
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
                  {message.audioDuration
                    ? `${Math.floor(message.audioDuration / 60)}:${String(Math.floor(message.audioDuration % 60)).padStart(2, "0")}`
                    : (message.duration || "0:08")}
                </span>
              </div>
            </div>
          ) : (
            /* STANDARD TEXT MESSAGE BUBBLE */
            <div
              style={{
                padding: "10px 16px",
                borderRadius: isMine
                  ? "var(--r-bubble-mine, 18px 18px 4px 18px)"
                  : "var(--r-bubble-theirs, 18px 18px 18px 4px)",
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

          {/* FLOATING HOVER REACTION & ACTIONS BAR */}
          {isHovered && (
            <div
              style={{
                position: "absolute",
                top: -34,
                [isMine ? "right" : "left"]: 0,
                zIndex: 40,
                display: "flex",
                alignItems: "center",
                gap: 4,
                background: "var(--ng-panel)",
                border: "1px solid var(--ng-border)",
                borderRadius: 99,
                padding: "3px 8px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.35)",
              }}
            >
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    if (emoji === "➕") {
                      setShowExtraEmojis((prev) => !prev);
                    } else {
                      handleReact(emoji);
                    }
                  }}
                  aria-label={`React ${emoji}`}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: emoji === "➕" ? 12 : 15,
                    padding: "2px 4px",
                    borderRadius: 99,
                    transition: "transform 0.12s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.25)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                >
                  {emoji}
                </button>
              ))}

              {/* Extra emojis popup */}
              {showExtraEmojis && (
                <div
                  style={{
                    position: "absolute",
                    top: -42,
                    left: 0,
                    zIndex: 50,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    background: "var(--ng-panel)",
                    border: "1px solid var(--ng-border)",
                    borderRadius: 99,
                    padding: "3px 8px",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
                  }}
                >
                  {MORE_EMOJIS.map((em) => (
                    <button
                      key={em}
                      onClick={() => handleReact(em)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: 15,
                        padding: "2px 4px",
                        transition: "transform 0.12s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.25)")}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              )}

              {/* Reply icon button */}
              <button
                onClick={handleReply}
                aria-label="Reply to message"
                title="Reply"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--ng-muted)",
                  padding: "2px 4px",
                  display: "flex",
                  alignItems: "center",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ng-text)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ng-muted)")}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a5 5 0 015 5v2m-15-7l4-4m-4 4l4 4" />
                </svg>
              </button>

              {/* More options (Pin, Delete for me) */}
              <button
                onClick={() => setShowMenu((prev) => !prev)}
                aria-label="More message options"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--ng-muted)",
                  fontSize: 14,
                  padding: "0 3px",
                  lineHeight: 1,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ng-text)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ng-muted)")}
              >
                ⋮
              </button>

              {showMenu && (
                <div
                  style={{
                    position: "absolute",
                    top: 28,
                    right: 0,
                    zIndex: 60,
                    background: "var(--ng-panel)",
                    border: "1px solid var(--ng-border)",
                    borderRadius: "var(--r-card)",
                    padding: "4px 0",
                    width: 130,
                    boxShadow: "0 6px 24px rgba(0,0,0,0.4)",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={handleReply}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "8px 12px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "var(--font-body)",
                      fontSize: 12,
                      color: "var(--ng-text)",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--ng-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                  >
                    Reply
                  </button>
                  <button
                    onClick={handleTogglePin}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "8px 12px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "var(--font-body)",
                      fontSize: 12,
                      color: "var(--ng-text)",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--ng-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                  >
                    {isPinned ? "Unpin" : "Pin"}
                  </button>
                  <button
                    onClick={handleDeleteForMe}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "8px 12px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "var(--font-body)",
                      fontSize: 12,
                      color: "var(--ng-terracotta)",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--ng-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                  >
                    Delete for me
                  </button>
                </div>
              )}
            </div>
          )}

          {/* REACTION CHIPS (overlapping bottom edge of bubble) */}
          {Object.keys(reactionGroups).length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 4,
                marginTop: -6,
                zIndex: 2,
                justifyContent: isMine ? "flex-end" : "flex-start",
                padding: "0 6px",
              }}
            >
              {Object.entries(reactionGroups).map(([emoji, data]) => (
                <button
                  key={emoji}
                  onClick={() => handleReact(emoji)}
                  aria-label={`${data.count} reactions with ${emoji}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 3,
                    background: data.hasReacted ? "var(--ng-hover)" : "var(--ng-panel)",
                    border: data.hasReacted ? "1px solid var(--ng-accent)" : "1px solid var(--ng-border)",
                    borderRadius: 99,
                    padding: "2px 7px",
                    fontSize: 11,
                    fontFamily: "var(--font-body)",
                    color: "var(--ng-text)",
                    cursor: "pointer",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                    transition: "transform 0.12s, border-color 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                >
                  <span>{emoji}</span>
                  <span style={{ fontWeight: 600, fontSize: 10, color: data.hasReacted ? "var(--ng-accent)" : "var(--ng-muted)" }}>
                    {data.count}
                  </span>
                </button>
              ))}
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
                  {message.isRead && getSettings().readReceipts !== false ? (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="15"
                        height="13"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="var(--ng-online)"
                        strokeWidth={2.2}
                        style={{ flexShrink: 0 }}
                        aria-label="Read"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2 13l4 4L16 7m5 0l-8 8-2-2"
                        />
                      </svg>
                      <span style={{ color: "var(--ng-muted)", fontSize: 11 }}>
                        Seen {readTimeStr || createdTimeStr}
                      </span>
                    </>
                  ) : message.isDelivered ? (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="15"
                        height="13"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="var(--ng-muted)"
                        strokeWidth={2.2}
                        style={{ flexShrink: 0 }}
                        aria-label="Delivered"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2 13l4 4L16 7m5 0l-8 8-2-2"
                        />
                      </svg>
                      <span style={{ color: "var(--ng-muted)", fontSize: 11 }}>
                        Delivered {deliveredTimeStr || createdTimeStr}
                      </span>
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="13"
                        height="13"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="var(--ng-muted)"
                        strokeWidth={2.2}
                        style={{ flexShrink: 0 }}
                        aria-label="Sent"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span style={{ color: "var(--ng-muted)", fontSize: 11 }}>
                        Sent {createdTimeStr}
                      </span>
                    </>
                  )}
                </>
              ) : (
                <span style={{ color: "var(--ng-muted)", opacity: 0.6 }}>
                  {createdTimeStr}
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