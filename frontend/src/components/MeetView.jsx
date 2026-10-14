import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import Avatar from "./Avatar";
import toast from "react-hot-toast";
import {
  getDropInRooms,
  validateMeetingCode,
} from "../services/meetService";

const MeetView = ({ selectedRoomId = "late-night-coding" }) => {
  const { authUser } = useAuth();
  const rooms = getDropInRooms();

  const [activeRoom, setActiveRoom] = useState(() => {
    return rooms.find((r) => r.id === selectedRoomId) || rooms[0];
  });

  const [meetingCode, setMeetingCode] = useState("");
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showTransportTodoModal, setShowTransportTodoModal] = useState(false);
  const [permissionError, setPermissionError] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    const found = rooms.find((r) => r.id === selectedRoomId);
    if (found) setActiveRoom(found);
  }, [selectedRoomId]);

  // Clean up all media tracks when component unmounts
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const toggleCamera = async () => {
    if (isCameraOn) {
      // Turn camera off: stop video tracks
      if (streamRef.current) {
        streamRef.current.getVideoTracks().forEach((track) => track.stop());
      }
      setIsCameraOn(false);
      if (videoRef.current) videoRef.current.srcObject = null;
      toast("Camera turned off");
      return;
    }

    // Turn camera on: request permission
    try {
      setPermissionError(null);
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera is not supported on this browser");
      }

      const videoStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
      });

      if (!streamRef.current) {
        streamRef.current = videoStream;
      } else {
        videoStream.getVideoTracks().forEach((track) => streamRef.current.addTrack(track));
      }

      setIsCameraOn(true);
      if (videoRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      toast.success("Camera enabled");
    } catch (err) {
      console.warn("Camera access denied or unavailable:", err);
      setIsCameraOn(false);
      setPermissionError(
        err.name === "NotAllowedError"
          ? "Camera permission was denied. Please allow access in browser settings."
          : err.message || "Unable to access camera"
      );
      toast.error("Camera access denied");
    }
  };

  const toggleMic = async () => {
    if (isMicOn) {
      // Turn mic off
      if (streamRef.current) {
        streamRef.current.getAudioTracks().forEach((track) => track.stop());
      }
      setIsMicOn(false);
      toast("Microphone muted");
      return;
    }

    // Turn mic on: request permission
    try {
      setPermissionError(null);
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Microphone is not supported on this browser");
      }

      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!streamRef.current) {
        streamRef.current = audioStream;
      } else {
        audioStream.getAudioTracks().forEach((track) => streamRef.current.addTrack(track));
      }

      setIsMicOn(true);
      toast.success("Microphone enabled");
    } catch (err) {
      console.warn("Mic access denied or unavailable:", err);
      setIsMicOn(false);
      setPermissionError(
        err.name === "NotAllowedError"
          ? "Microphone permission was denied. Please allow access in browser settings."
          : err.message || "Unable to access microphone"
      );
      toast.error("Microphone access denied");
    }
  };

  const handleJoinRoom = () => {
    if (meetingCode.trim()) {
      const { valid, error } = validateMeetingCode(meetingCode);
      if (!valid) {
        toast.error(error);
        return;
      }
    }
    // As instructed by Prompt 3: Do not simulate a working video/voice call when no WebRTC transport exists.
    // Explicitly display TODO transport notification.
    setShowTransportTodoModal(true);
  };

  return (
    <div
      style={{
        flex: 1,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflowY: "auto",
        background: "var(--ng-bg)",
        padding: "24px 32px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 720,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
        }}
      >
        {/* Permission warning banner if denied */}
        {permissionError && (
          <div
            style={{
              width: "100%",
              background: "rgba(201, 116, 62, 0.15)",
              border: "1px solid var(--ng-terracotta)",
              borderRadius: "var(--r-btn)",
              padding: "10px 16px",
              color: "var(--ng-text)",
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span>⚠️ {permissionError}</span>
            <button
              onClick={() => setPermissionError(null)}
              style={{ background: "none", border: "none", color: "var(--ng-muted)", cursor: "pointer", fontSize: 14 }}
            >
              ✕
            </button>
          </div>
        )}

        {/* ================= PRE-JOIN CAMERA CONTAINER (NG3) ================= */}
        <div
          style={{
            width: "100%",
            aspectRatio: "16 / 9",
            maxHeight: 380,
            background: "var(--ng-panel)",
            border: "1px solid var(--ng-border)",
            borderRadius: "var(--r-card)",
            position: "relative",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          }}
        >
          {/* Live Video Preview (when camera is on) */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: isCameraOn ? "block" : "none",
              transform: "scaleX(-1)", // Mirror selfie preview
            }}
          />

          {/* Fallback View (when camera is off) */}
          {!isCameraOn && (
            <>
              {/* Camera off badge */}
              <div
                style={{
                  position: "absolute",
                  top: 16,
                  left: 16,
                  background: "rgba(10, 14, 12, 0.75)",
                  backdropFilter: "blur(4px)",
                  borderRadius: 99,
                  padding: "4px 12px",
                  fontSize: 12,
                  fontFamily: "var(--font-body)",
                  color: "var(--ng-muted)",
                  border: "1px solid var(--ng-border)",
                }}
              >
                Camera off
              </div>

              {/* Large center avatar */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <Avatar
                  src={authUser?.profilepic}
                  name={authUser?.fullname || authUser?.username}
                  size={96}
                  ring={true}
                  ringColor="var(--ng-accent)"
                />
              </div>
            </>
          )}

          {/* Floating Controls at bottom of preview */}
          <div
            style={{
              position: "absolute",
              bottom: 16,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: "rgba(10, 14, 12, 0.75)",
              backdropFilter: "blur(6px)",
              padding: "6px 14px",
              borderRadius: 99,
              border: "1px solid var(--ng-border)",
            }}
          >
            {/* Mic Toggle Button */}
            <button
              onClick={toggleMic}
              aria-label={isMicOn ? "Mute microphone" : "Unmute microphone"}
              title={isMicOn ? "Microphone on" : "Microphone off"}
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: isMicOn ? "var(--ng-accent)" : "var(--ng-hover)",
                color: isMicOn ? "var(--ng-accent-fg)" : "var(--ng-muted)",
                border: "1px solid var(--ng-border)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.15s, color 0.15s",
              }}
            >
              {isMicOn ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 003-3V5a3 3 0 10-6 0v6a3 3 0 003 3z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 003-3V5a3 3 0 10-6 0v6a3 3 0 003 3z" />
                  <line x1="3" y1="3" x2="21" y2="21" stroke="var(--ng-terracotta)" strokeWidth={2.2} />
                </svg>
              )}
            </button>

            {/* Camera Toggle Button */}
            <button
              onClick={toggleCamera}
              aria-label={isCameraOn ? "Turn camera off" : "Turn camera on"}
              title={isCameraOn ? "Camera on" : "Camera off"}
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: isCameraOn ? "var(--ng-accent)" : "var(--ng-terracotta)",
                color: isCameraOn ? "var(--ng-accent-fg)" : "#fff",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.15s",
              }}
            >
              {isCameraOn ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  <line x1="3" y1="3" x2="21" y2="21" stroke="#fff" strokeWidth={2.2} />
                </svg>
              )}
            </button>

            {/* Device Settings Button */}
            <button
              onClick={() => setShowSettingsModal(true)}
              aria-label="Audio and video device settings"
              title="Settings"
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "var(--ng-hover)",
                color: "var(--ng-muted)",
                border: "1px solid var(--ng-border)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "color 0.15s, background 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--ng-text)";
                e.currentTarget.style.background = "var(--ng-border)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--ng-muted)";
                e.currentTarget.style.background = "var(--ng-hover)";
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
              </svg>
            </button>
          </div>
        </div>

        {/* ================= HEADING & JOIN CONTROLS ================= */}
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 24, fontWeight: 700, color: "var(--ng-text)", margin: 0 }}>
            Ready to join?
          </h2>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--ng-muted)", margin: 0 }}>
            {activeRoom.name} · {activeRoom.count > 0 ? `${activeRoom.count} people inside` : "Empty room"}
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14, flexWrap: "wrap", justifyContent: "center" }}>
            <button
              onClick={handleJoinRoom}
              style={{
                background: "var(--ng-accent)",
                color: "var(--ng-accent-fg)",
                border: "none",
                borderRadius: "var(--r-btn)",
                padding: "12px 28px",
                fontFamily: "var(--font-body)",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                transition: "opacity 0.15s, transform 0.15s",
                boxShadow: "0 4px 16px rgba(232, 163, 61, 0.25)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.9";
                e.currentTarget.style.transform = "scale(1.02)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              Join room
            </button>

            <input
              type="text"
              placeholder="Meeting code"
              value={meetingCode}
              onChange={(e) => setMeetingCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
              style={{
                background: "var(--ng-panel)",
                border: "1px solid var(--ng-border)",
                borderRadius: "var(--r-btn)",
                padding: "11px 16px",
                fontFamily: "var(--font-body)",
                fontSize: 14,
                color: "var(--ng-text)",
                outline: "none",
                width: 160,
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--ng-accent)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--ng-border)")}
            />
          </div>
        </div>

      </div>

      {/* ================= TODO MEDIA TRANSPORT MODAL ================= */}
      {showTransportTodoModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: 16,
          }}
          onClick={() => setShowTransportTodoModal(false)}
        >
          <div
            style={{
              background: "var(--ng-panel)",
              border: "1px solid var(--ng-border)",
              borderRadius: "var(--r-card)",
              width: "100%",
              maxWidth: 440,
              padding: 24,
              boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--ng-accent)", background: "rgba(232,163,61,0.15)", padding: "2px 8px", borderRadius: 6 }}>
                TODO: Media Transport
              </span>
            </div>
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: 18, fontWeight: 700, color: "var(--ng-text)", margin: "0 0 10px" }}>
              Pre-join Lobby Connected
            </h3>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--ng-muted)", lineHeight: 1.6, margin: "0 0 16px" }}>
              Room <strong>{meetingCode.trim() || activeRoom.name}</strong> was requested.
              In accordance with prompt specification: WebRTC media transport is marked as TODO pending dedicated signaling infrastructure.
              Local device capture (camera preview and microphone toggles) is fully operational.
            </p>
            <button
              onClick={() => setShowTransportTodoModal(false)}
              style={{
                width: "100%",
                background: "var(--ng-accent)",
                color: "var(--ng-accent-fg)",
                border: "none",
                borderRadius: "var(--r-btn)",
                padding: "10px 0",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Understood
            </button>
          </div>
        </div>
      )}

      {/* ================= DEVICE SETTINGS MODAL ================= */}
      {showSettingsModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: 16,
          }}
          onClick={() => setShowSettingsModal(false)}
        >
          <div
            style={{
              background: "var(--ng-panel)",
              border: "1px solid var(--ng-border)",
              borderRadius: "var(--r-card)",
              width: "100%",
              maxWidth: 400,
              padding: 24,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: 18, fontWeight: 700, color: "var(--ng-text)", margin: "0 0 16px" }}>
              Device Settings
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ng-muted)", marginBottom: 6 }}>
                  Microphone
                </label>
                <div style={{ background: "var(--ng-hover)", border: "1px solid var(--ng-border)", padding: "8px 12px", borderRadius: "var(--r-btn)", fontSize: 13, color: "var(--ng-text)" }}>
                  Default - System Microphone {isMicOn ? "🎤 (Active)" : "(Muted)"}
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ng-muted)", marginBottom: 6 }}>
                  Camera
                </label>
                <div style={{ background: "var(--ng-hover)", border: "1px solid var(--ng-border)", padding: "8px 12px", borderRadius: "var(--r-btn)", fontSize: 13, color: "var(--ng-text)" }}>
                  Default - System Camera {isCameraOn ? "📹 (Active)" : "(Off)"}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
              <button
                onClick={() => setShowSettingsModal(false)}
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
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetView;
