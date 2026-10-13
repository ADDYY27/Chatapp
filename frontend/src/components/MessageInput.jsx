import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import { useSocket } from "../context/SocketContext";
import useChatStore from "../store/useChatStore";
import axiosInstance from "../utils/axios";

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

  // Disappearing messages: "off" | "1h" | "24h"
  const [disappearMode, setDisappearMode] = useState("off");

  // Schedule send state
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  const [scheduledTime, setScheduledTime] = useState(null);
  const [customScheduleInput, setCustomScheduleInput] = useState("");

  // MediaRecorder Voice Notes
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState(null);
  const [recordedDuration, setRecordedDuration] = useState(0);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioStreamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const previewAudioRef = useRef(null);

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const { socket } = useSocket();
  const { selectedUser, replyingTo, setReplyingTo } = useChatStore();
  const typingTimerRef = useRef(null);
  const isTypingRef = useRef(false);

  // Typing indicator emitter
  const emitTyping = (isTyping) => {
    if (!socket || !selectedUser?._id) return;
    if (isTyping && !isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit("typing", { receiverId: selectedUser._id });
    } else if (!isTyping && isTypingRef.current) {
      isTypingRef.current = false;
      socket.emit("stopTyping", { receiverId: selectedUser._id });
    }
  };

  const handleTextChange = (e) => {
    const val = e.target.value;
    setText(val);

    if (val.trim().length > 0) {
      emitTyping(true);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        emitTyping(false);
      }, 2000);
    } else {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      emitTyping(false);
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      if (isTypingRef.current && socket && selectedUser?._id) {
        socket.emit("stopTyping", { receiverId: selectedUser._id });
      }
      isTypingRef.current = false;
    };
  }, [selectedUser?._id, socket]);

  // Recording timer
  useEffect(() => {
    let timer;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  // Clean up audio tracks on unmount
  useEffect(() => {
    return () => {
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (recordedAudioUrl) {
        URL.revokeObjectURL(recordedAudioUrl);
      }
    };
  }, [recordedAudioUrl]);

  /* Start Voice Recording */
  const handleStartRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error("Audio recording is not supported in this browser.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioBlob(audioBlob);
        setRecordedAudioUrl(url);
        setRecordedDuration(recordingSeconds || 1);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      setRecordedAudioBlob(null);
      setRecordedAudioUrl(null);
    } catch (err) {
      console.error("Recording error:", err);
      toast.error("Microphone access was denied or not found.");
    }
  };

  /* Stop Recording and prepare preview */
  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    setIsRecording(false);
  };

  /* Cancel Recording */
  const handleCancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    setIsRecording(false);
    setRecordingSeconds(0);
    setRecordedAudioBlob(null);
    if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
    setRecordedAudioUrl(null);
    toast("Voice recording cancelled");
  };

  /* Send Recorded Audio */
  const handleSendRecordedAudio = async () => {
    if (!recordedAudioBlob) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Audio = reader.result;
      const duration = recordedDuration || 1;

      if (onSendAudio) {
        await onSendAudio(base64Audio, duration);
      } else {
        await onSend("", { audioUrl: base64Audio, audioDuration: duration, replyTo: replyingTo?._id });
      }

      setRecordedAudioBlob(null);
      if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
      setRecordedAudioUrl(null);
      setReplyingTo(null);
      toast.success("Voice note sent!");
    };
    reader.readAsDataURL(recordedAudioBlob);
  };

  /* Disappearing messages toggle */
  const handleDisappearToggle = async () => {
    const next = disappearMode === "off" ? "1h" : disappearMode === "1h" ? "24h" : "off";
    setDisappearMode(next);
    if (selectedUser?._id) {
      try {
        await axiosInstance.put(`/message/conversation/${selectedUser._id}/disappearing`, { duration: next });
        toast.success(`Disappearing messages set to: ${next === "off" ? "Off" : next}`);
      } catch {
        toast.error("Failed to update disappearing setting");
      }
    }
  };

  /* Schedule Send handlers */
  const handleSelectSchedulePreset = (minutes) => {
    const future = new Date(Date.now() + minutes * 60 * 1000);
    setScheduledTime(future);
    setShowSchedulePicker(false);
    toast.success(`Scheduled for ${future.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);
  };

  const handleCustomScheduleSubmit = () => {
    if (!customScheduleInput) return;
    const future = new Date(customScheduleInput);
    if (isNaN(future.getTime()) || future <= new Date()) {
      toast.error("Please pick a time in the future.");
      return;
    }
    setScheduledTime(future);
    setShowSchedulePicker(false);
    toast.success(`Scheduled for ${future.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);
  };

  const handleClearSchedule = () => {
    setScheduledTime(null);
    setShowSchedulePicker(false);
    toast("Scheduled time cleared");
  };

  /* Submit message */
  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    emitTyping(false);

    try {
      const options = {
        replyTo: replyingTo?._id || null,
        scheduledFor: scheduledTime ? scheduledTime.toISOString() : null,
      };

      const result = await onSend(trimmed, options);
      if (result !== false) {
        setText("");
        setShowEmojis(false);
        setShowAttachMenu(false);
        setReplyingTo(null);
        setScheduledTime(null);
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
        }
      }
    } catch {
      // Keep drafted text on error
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

      {/* REPLY BAR (if currently replying to a message) */}
      {replyingTo && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--ng-panel)",
            border: "1px solid var(--ng-border)",
            borderLeft: `4px solid ${activeColor}`,
            borderRadius: "var(--r-btn)",
            padding: "6px 12px",
            marginBottom: 8,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--ng-accent)" }}>
              Replying to {replyingTo.senderName}
            </span>
            <span
              style={{
                fontSize: 12,
                color: "var(--ng-muted)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: 400,
              }}
            >
              {replyingTo.text}
            </span>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            aria-label="Cancel reply"
            style={{
              background: "none",
              border: "none",
              color: "var(--ng-muted)",
              cursor: "pointer",
              fontSize: 16,
              padding: "2px 6px",
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* QUICK ACTION CHIPS ROW (Disappear, Schedule, Nudge) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
          flexWrap: "wrap",
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
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowSchedulePicker((prev) => !prev)}
            aria-label="Schedule send message"
            style={{
              background: scheduledTime ? "rgba(232, 163, 61, 0.15)" : "var(--ng-hover)",
              border: scheduledTime ? `1px solid ${activeColor}` : "1px solid var(--ng-border)",
              color: scheduledTime ? "var(--ng-accent)" : "var(--ng-muted)",
              fontFamily: "var(--font-body)",
              fontSize: 12,
              fontWeight: 500,
              padding: "5px 12px",
              borderRadius: 99,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5,
              transition: "all 0.15s",
            }}
          >
            {scheduledTime ? (
              <>
                <span>⏰ {scheduledTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearSchedule();
                  }}
                  style={{ marginLeft: 4, cursor: "pointer", fontWeight: 700 }}
                >
                  ✕
                </span>
              </>
            ) : (
              "Schedule send"
            )}
          </button>

          {/* Schedule Picker Popup */}
          {showSchedulePicker && (
            <div
              style={{
                position: "absolute",
                bottom: 36,
                left: 0,
                zIndex: 40,
                background: "var(--ng-panel)",
                border: "1px solid var(--ng-border)",
                borderRadius: "var(--r-card)",
                padding: "12px",
                width: 240,
                boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
              }}
            >
              <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: "var(--ng-text)" }}>
                Schedule message
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <button
                  onClick={() => handleSelectSchedulePreset(5)}
                  style={{
                    textAlign: "left",
                    padding: "6px 10px",
                    background: "var(--ng-hover)",
                    border: "none",
                    borderRadius: 6,
                    color: "var(--ng-text)",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  In 5 minutes
                </button>
                <button
                  onClick={() => handleSelectSchedulePreset(30)}
                  style={{
                    textAlign: "left",
                    padding: "6px 10px",
                    background: "var(--ng-hover)",
                    border: "none",
                    borderRadius: 6,
                    color: "var(--ng-text)",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  In 30 minutes
                </button>
                <button
                  onClick={() => handleSelectSchedulePreset(60)}
                  style={{
                    textAlign: "left",
                    padding: "6px 10px",
                    background: "var(--ng-hover)",
                    border: "none",
                    borderRadius: 6,
                    color: "var(--ng-text)",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  In 1 hour
                </button>
              </div>

              <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px solid var(--ng-border)" }}>
                <p style={{ margin: "0 0 4px", fontSize: 11, color: "var(--ng-muted)" }}>Custom time:</p>
                <input
                  type="datetime-local"
                  value={customScheduleInput}
                  onChange={(e) => setCustomScheduleInput(e.target.value)}
                  style={{
                    width: "100%",
                    fontSize: 11,
                    background: "var(--ng-bg)",
                    border: "1px solid var(--ng-border)",
                    borderRadius: 4,
                    color: "var(--ng-text)",
                    padding: "4px 6px",
                    boxSizing: "border-box",
                  }}
                />
                <button
                  onClick={handleCustomScheduleSubmit}
                  style={{
                    width: "100%",
                    marginTop: 6,
                    padding: "6px 0",
                    background: activeColor,
                    color: activeColorFg,
                    border: "none",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Set Custom Time
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Nudge chip */}
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
          /* ACTIVE RECORDING VIEW */
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              padding: "4px 12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  backgroundColor: "var(--ng-terracotta)",
                  boxShadow: "0 0 8px var(--ng-terracotta)",
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
                Recording... {recordingSeconds}s
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
                onClick={handleStopRecording}
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
                Done
              </button>
            </div>
          </div>
        ) : recordedAudioBlob ? (
          /* RECORDED AUDIO PREVIEW VIEW */
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              padding: "4px 12px",
            }}
          >
            <audio
              ref={previewAudioRef}
              src={recordedAudioUrl}
              onEnded={() => setIsPlayingPreview(false)}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                onClick={() => {
                  if (previewAudioRef.current) {
                    if (isPlayingPreview) {
                      previewAudioRef.current.pause();
                      setIsPlayingPreview(false);
                    } else {
                      previewAudioRef.current.play();
                      setIsPlayingPreview(true);
                    }
                  }
                }}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: activeColor,
                  color: activeColorFg,
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isPlayingPreview ? "⏸" : "▶"}
              </button>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ng-text)" }}>
                Voice Note ({recordedDuration}s)
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                onClick={handleCancelRecording}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--ng-muted)",
                  fontSize: 13,
                  cursor: "pointer",
                  padding: "6px 10px",
                }}
              >
                Discard
              </button>
              <button
                onClick={handleSendRecordedAudio}
                style={{
                  background: activeColor,
                  color: activeColorFg,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  padding: "6px 16px",
                  borderRadius: 99,
                }}
              >
                Send Voice Note
              </button>
            </div>
          </div>
        ) : (
          /* STANDARD INPUT VIEW */
          <>
            {/* '+' Attachment button */}
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
              onChange={handleTextChange}
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

            {/* Emoji button */}
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

            {/* Microphone button */}
            <button
              type="button"
              onClick={handleStartRecording}
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

            {/* Saffron Send button */}
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
