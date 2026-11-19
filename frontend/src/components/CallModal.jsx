import { useRef, useEffect } from "react";
import Avatar from "./Avatar";

/**
 * CallModal - Renders active voice & video calls, local preview, remote stream, and controls
 */
const CallModal = ({ webrtc, name, avatarSrc }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);

  const {
    callState,
    callType,
    isCaller,
    localStream,
    remoteStream,
    isMuted,
    isCameraOff,
    toggleMute,
    toggleVideo,
    acceptCall,
    rejectCall,
    endCall,
  } = webrtc;

  const handleLocalVideoRef = (node) => {
    localVideoRef.current = node;
    if (node && localStream) {
      node.srcObject = localStream;
    }
  };

  const handleRemoteVideoRef = (node) => {
    remoteVideoRef.current = node;
    if (node && remoteStream) {
      node.srcObject = remoteStream;
      node.play?.().catch(() => {});
    }
  };

  const handleRemoteAudioRef = (node) => {
    remoteAudioRef.current = node;
    if (node && remoteStream) {
      node.srcObject = remoteStream;
      node.play?.().catch(() => {});
    }
  };

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callState, callType]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play?.().catch(() => {});
    }
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.play?.().catch(() => {});
    }
  }, [remoteStream, callState, callType]);

  const isRingingIncoming = callState === "ringing" && !isCaller;
  const isVideo = callType === "video";

  const getStatusText = () => {
    if (isRingingIncoming) return `Incoming ${isVideo ? "video" : "voice"} call...`;
    if (callState === "calling") return "Calling...";
    if (callState === "connecting") return "Connecting...";
    if (callState === "connected") return `${isVideo ? "Video call" : "Voice call"} connected`;
    return "Call ended";
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 90,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(10, 14, 12, 0.88)",
        backdropFilter: "blur(10px)",
      }}
    >
      <div
        style={{
          background: "var(--ng-panel)",
          border: "1px solid var(--ng-border)",
          borderRadius: "var(--r-card)",
          padding: isVideo && (callState === "connected" || callState === "connecting") ? "20px" : "32px 28px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
          width: isVideo && (callState === "connected" || callState === "connecting") ? 540 : 340,
          maxWidth: "92vw",
          boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
          transition: "all 0.3s ease",
        }}
      >
        {/* Remote audio playback for voice calls */}
        {!isVideo && <audio ref={handleRemoteAudioRef} autoPlay playsInline />}

        {/* Video layout when in video call */}
        {isVideo && (callState === "connected" || callState === "connecting") ? (
          <div
            style={{
              position: "relative",
              width: "100%",
              height: 320,
              background: "#050806",
              borderRadius: "var(--r-btn)",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid var(--ng-border)",
            }}
          >
            {/* Primary Remote Video */}
            <video
              ref={handleRemoteVideoRef}
              autoPlay
              playsInline
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: remoteStream ? "block" : "none",
              }}
            />
            {!remoteStream && (
              <div style={{ textAlign: "center", color: "var(--ng-muted)" }}>
                <Avatar src={avatarSrc} name={name} size={72} ring={true} ringColor="var(--ng-accent)" />
                <p style={{ marginTop: 12, fontSize: 13, fontFamily: "var(--font-body)" }}>Waiting for video feed...</p>
              </div>
            )}

            {/* Picture-in-Picture Local Video Preview */}
            <div
              style={{
                position: "absolute",
                bottom: 12,
                right: 12,
                width: 110,
                height: 80,
                borderRadius: 8,
                overflow: "hidden",
                border: "2px solid var(--ng-accent)",
                background: "#000",
                boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                display: isCameraOff ? "none" : "block",
              }}
            >
              <video
                ref={handleLocalVideoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transform: "scaleX(-1)", // Mirror selfie camera
                }}
              />
            </div>
          </div>
        ) : (
          /* Avatar layout for voice calls or ringing state */
          <div style={{ position: "relative" }}>
            <Avatar src={avatarSrc} name={name} size={92} ring={true} ringColor="var(--ng-accent)" />
            <span
              style={{
                position: "absolute",
                inset: -8,
                borderRadius: "50%",
                border: "2px solid var(--ng-accent)",
                opacity: 0.5,
                animation: "ngPulseSlow 1.5s infinite ease-in-out",
              }}
            />
          </div>
        )}

        {/* User name & call status */}
        <div style={{ textAlign: "center" }}>
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: 20,
              color: "var(--ng-text)",
              margin: "4px 0",
            }}
          >
            {name}
          </h2>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 13,
              color: callState === "connected" ? "var(--ng-online)" : "var(--ng-muted)",
              margin: 0,
            }}
          >
            {getStatusText()}
          </p>
        </div>

        {/* Controls */}
        {isRingingIncoming ? (
          /* Incoming call controls: Accept or Decline */
          <div style={{ display: "flex", alignItems: "center", gap: 24, marginTop: 12 }}>
            {/* Decline */}
            <button
              onClick={() => rejectCall()}
              aria-label="Decline call"
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: "var(--ng-terracotta)",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 16px rgba(201, 116, 62, 0.4)",
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.684A1 1 0 008.279 3H5z" />
              </svg>
            </button>

            {/* Accept */}
            <button
              onClick={() => acceptCall()}
              aria-label="Accept call"
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: "var(--ng-online)",
                color: "#0a0e0c",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 16px rgba(82, 183, 136, 0.4)",
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </button>
          </div>
        ) : (
          /* Active / Outgoing call controls */
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 8 }}>
            {/* Mute mic */}
            <button
              onClick={toggleMute}
              aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
              title={isMuted ? "Unmute" : "Mute"}
              style={{
                width: 46,
                height: 46,
                borderRadius: "50%",
                background: isMuted ? "var(--ng-terracotta)" : "var(--ng-hover)",
                border: "1px solid var(--ng-border)",
                color: isMuted ? "#fff" : "var(--ng-text)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
              }}
            >
              {isMuted ? "🔇" : "🎤"}
            </button>

            {/* Video toggle if video call */}
            {isVideo && (
              <button
                onClick={toggleVideo}
                aria-label={isCameraOff ? "Turn on camera" : "Turn off camera"}
                title={isCameraOff ? "Camera on" : "Camera off"}
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: "50%",
                  background: isCameraOff ? "var(--ng-terracotta)" : "var(--ng-hover)",
                  border: "1px solid var(--ng-border)",
                  color: isCameraOff ? "#fff" : "var(--ng-text)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                }}
              >
                {isCameraOff ? "🚫" : "📹"}
              </button>
            )}

            {/* End Call */}
            <button
              onClick={endCall}
              aria-label="End call"
              title="End call"
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: "var(--ng-terracotta)",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 16px rgba(201, 116, 62, 0.4)",
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.684A1 1 0 008.279 3H5z" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CallModal;
