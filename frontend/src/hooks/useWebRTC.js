import { useState, useEffect, useRef, useCallback } from "react";
import { useSocket } from "../context/SocketContext";
import toast from "react-hot-toast";

// Public Google STUN servers (STUN-only for NAT traversal without TURN infrastructure)
const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

/**
 * useWebRTC - Custom hook managing WebRTC audio/video peer connection and Socket.IO signaling
 */
export const useWebRTC = (defaultTargetUserId = null) => {
  const { socket } = useSocket();

  // Call lifecycle state: 'idle' | 'calling' | 'ringing' | 'connecting' | 'connected' | 'ended'
  const [callState, setCallState] = useState("idle");
  const [callType, setCallType] = useState(null); // 'voice' | 'video' | null
  const [activeCallId, setActiveCallId] = useState(null);
  const [callerId, setCallerId] = useState(null);
  const [receiverId, setReceiverId] = useState(null);
  const [isCaller, setIsCaller] = useState(false);
  const [callerProfile, setCallerProfile] = useState(null);
  const [targetProfile, setTargetProfile] = useState(null);

  // Media streams & device state
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [connectionState, setConnectionState] = useState("new");
  const [errorMessage, setErrorMessage] = useState(null);

  // WebRTC & DOM references
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const iceCandidatesQueueRef = useRef([]);
  const callIdRef = useRef(null);
  const isCleaningUpRef = useRef(false);

  // Sync state ref
  useEffect(() => {
    callIdRef.current = activeCallId;
  }, [activeCallId]);

  /* ============================================================
     1. MEDIA ACQUISITION & HARDWARE PERMISSIONS
     ============================================================ */
  const acquireLocalMedia = useCallback(async (type) => {
    const isVideo = type === "video";
    const constraints = {
      audio: true,
      video: isVideo
        ? {
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
            facingMode: "user",
          }
        : false,
    };

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Browser does not support mediaDevices.getUserMedia");
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      setLocalStream(stream);
      setIsMuted(false);
      setIsCameraOff(!isVideo);
      return stream;
    } catch (err) {
      console.error("Failed to acquire local media:", err);
      let friendlyMsg = "Failed to access microphone or camera.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        friendlyMsg = `${isVideo ? "Camera and microphone" : "Microphone"} permission was denied. Please allow device access in your browser settings.`;
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        friendlyMsg = `No ${isVideo ? "camera or microphone" : "microphone"} found on this device.`;
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        friendlyMsg = "Hardware device is already in use by another application.";
      }
      setErrorMessage(friendlyMsg);
      toast.error(friendlyMsg);
      throw new Error(friendlyMsg);
    }
  }, []);

  /* ============================================================
     2. TEARDOWN & CLEANUP
     ============================================================ */
  const cleanup = useCallback(() => {
    if (isCleaningUpRef.current) return;
    isCleaningUpRef.current = true;

    // Stop all local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn("Error stopping local track:", e);
        }
      });
      localStreamRef.current = null;
    }

    // Stop all remote tracks
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn("Error stopping remote track:", e);
        }
      });
      remoteStreamRef.current = null;
    }

    // Close and clear RTCPeerConnection
    if (pcRef.current) {
      pcRef.current.onicecandidate = null;
      pcRef.current.ontrack = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.oniceconnectionstatechange = null;
      try {
        pcRef.current.close();
      } catch (e) {
        console.warn("Error closing RTCPeerConnection:", e);
      }
      pcRef.current = null;
    }

    iceCandidatesQueueRef.current = [];
    callIdRef.current = null;

    setLocalStream(null);
    setRemoteStream(null);
    setCallState("idle");
    setCallType(null);
    setActiveCallId(null);
    setCallerId(null);
    setReceiverId(null);
    setIsCaller(false);
    setIsMuted(false);
    setIsCameraOff(false);
    setConnectionState("closed");
    setCallerProfile(null);
    setTargetProfile(null);

    isCleaningUpRef.current = false;
  }, []);

  /* ============================================================
     3. PEER CONNECTION INITIALIZATION
     ============================================================ */
  const createPeerConnection = useCallback((callId, stream) => {
    // If an existing connection is active, clean it up first
    if (pcRef.current) {
      try {
        pcRef.current.close();
      } catch {
        // Safe ignore
      }
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;
    iceCandidatesQueueRef.current = [];

    // Add local tracks to RTCPeerConnection
    if (stream) {
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });
    }

    // Receive and render remote tracks
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        remoteStreamRef.current = event.streams[0];
        setRemoteStream(event.streams[0]);
      } else {
        let currentRemote = remoteStreamRef.current;
        if (!currentRemote) {
          currentRemote = new MediaStream();
          remoteStreamRef.current = currentRemote;
          setRemoteStream(currentRemote);
        }
        currentRemote.addTrack(event.track);
      }
    };

    // Forward local ICE candidates to counterparty via backend signaling
    pc.onicecandidate = (event) => {
      if (event.candidate && socket && callId) {
        socket.emit("call:ice-candidate", {
          callId,
          candidate: event.candidate,
        });
      }
    };

    // Monitor WebRTC connection states
    pc.onconnectionstatechange = () => {
      setConnectionState(pc.connectionState);
      if (pc.connectionState === "connected") {
        setCallState("connected");
      } else if (pc.connectionState === "failed") {
        toast.error("WebRTC direct connection failed (STUN/NAT unreachable)");
        cleanup();
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "failed") {
        console.warn("ICE connection failed");
      }
    };

    return pc;
  }, [socket, cleanup]);

  /* ============================================================
     4. ICE CANDIDATES QUEUING & PROCESSING
     ============================================================ */
  const handleRemoteIceCandidate = useCallback(async (candidate) => {
    if (!candidate) return;
    const pc = pcRef.current;

    // WebRTC invariant: addIceCandidate fails if remoteDescription is not yet set
    if (pc && pc.remoteDescription && pc.remoteDescription.type) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn("Failed to add remote ICE candidate:", err);
      }
    } else {
      iceCandidatesQueueRef.current.push(candidate);
    }
  }, []);

  const processQueuedIceCandidates = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc) return;

    while (iceCandidatesQueueRef.current.length > 0) {
      const candidate = iceCandidatesQueueRef.current.shift();
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn("Failed to add queued ICE candidate:", err);
      }
    }
  }, []);

  /* ============================================================
     5. CALL CONTROL ACTIONS (START, ACCEPT, REJECT, END)
     ============================================================ */
  const startCall = useCallback(async (type = "voice", targetUserOrIdOverride = null) => {
    const isTargetObject = typeof targetUserOrIdOverride === "object" && targetUserOrIdOverride !== null;
    const targetUserId = isTargetObject ? targetUserOrIdOverride._id : (targetUserOrIdOverride || defaultTargetUserId);

    if (!socket || !targetUserId) {
      toast.error("Unable to start call: socket or target user unavailable");
      return;
    }

    if (isTargetObject) {
      setTargetProfile({
        name: targetUserOrIdOverride.fullname || targetUserOrIdOverride.name || "User",
        pic: targetUserOrIdOverride.profilepic || targetUserOrIdOverride.pic || "",
        username: targetUserOrIdOverride.username || "",
      });
    } else {
      setTargetProfile({ name: "User", pic: "", username: "" });
    }

    try {
      setErrorMessage(null);
      // 1. Acquire microphone / camera
      await acquireLocalMedia(type);

      // 2. Request backend to initiate call
      socket.emit("call:start", { receiverId: targetUserId, callType: type }, (res) => {
        if (!res || !res.success) {
          const reason = res?.reason || "error";
          let message = res?.message || "Failed to initiate call";
          if (reason === "offline") message = "User is currently offline";
          if (reason === "caller_busy") message = "You are already in an active call";
          if (reason === "receiver_busy") message = "User is busy on another call";

          toast.error(message);
          cleanup();
        }
      });

      setCallType(type);
      setReceiverId(targetUserId);
      setIsCaller(true);
      setCallState("calling");
    } catch {
      cleanup();
    }
  }, [socket, defaultTargetUserId, acquireLocalMedia, cleanup]);

  const acceptCall = useCallback(async () => {
    const callId = callIdRef.current;
    if (!socket || !callId) return;

    try {
      setErrorMessage(null);
      // 1. Acquire local media for the call type
      const stream = await acquireLocalMedia(callType || "voice");

      // 2. Create local RTCPeerConnection
      createPeerConnection(callId, stream);

      // 3. Emit accept to backend signaling
      socket.emit("call:accept", { callId }, (res) => {
        if (!res || !res.success) {
          toast.error(res?.message || "Failed to accept call");
          cleanup();
        }
      });

      setCallState("connecting");
    } catch {
      cleanup();
    }
  }, [socket, callType, acquireLocalMedia, createPeerConnection, cleanup]);

  const rejectCall = useCallback((reason = "declined") => {
    const callId = callIdRef.current;
    if (socket && callId) {
      socket.emit("call:reject", { callId, reason });
    }
    cleanup();
  }, [socket, cleanup]);

  const endCall = useCallback(() => {
    const callId = callIdRef.current;
    if (socket && callId) {
      socket.emit("call:end", { callId });
    }
    cleanup();
  }, [socket, cleanup]);

  /* ============================================================
     6. HARDWARE TOGGLES (MIC / CAMERA)
     ============================================================ */
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        const nextState = !audioTracks[0].enabled;
        audioTracks.forEach((t) => (t.enabled = nextState));
        setIsMuted(!nextState);
        toast(nextState ? "Microphone unmuted" : "Microphone muted");
      }
    }
  }, []);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        const nextState = !videoTracks[0].enabled;
        videoTracks.forEach((t) => (t.enabled = nextState));
        setIsCameraOff(!nextState);
        toast(nextState ? "Camera enabled" : "Camera turned off");
      }
    }
  }, []);

  /* ============================================================
     7. SOCKET.IO SIGNALING EVENT LISTENERS
     ============================================================ */
  useEffect(() => {
    if (!socket) return;

    // Caller receives ringing notification from server
    const handleRinging = ({ callId, receiverId: rId, callType: cType }) => {
      setActiveCallId(callId);
      callIdRef.current = callId;
      setReceiverId(rId);
      setCallType(cType);
      setCallState("calling");

      // Initialize peer connection for the caller
      if (localStreamRef.current && !pcRef.current) {
        createPeerConnection(callId, localStreamRef.current);
      }
    };

    // Receiver receives incoming call notification
    const handleIncoming = ({ callId, callerId: cId, callerName, callerPic, callerUsername, callType: cType }) => {
      // If receiver is already in a call, ignore
      if (callIdRef.current && callIdRef.current !== callId) return;

      setActiveCallId(callId);
      callIdRef.current = callId;
      setCallerId(cId);
      setCallerProfile({
        name: callerName || "Incoming Caller",
        pic: callerPic || "",
        username: callerUsername || "",
      });
      setCallType(cType);
      setIsCaller(false);
      setCallState("ringing");
    };

    // Caller notified that receiver accepted the call -> create & send SDP offer
    const handleAccepted = async ({ callId }) => {
      if (callIdRef.current && callIdRef.current !== callId) return;
      setCallState("connecting");

      try {
        let pc = pcRef.current;
        if (!pc) {
          pc = createPeerConnection(callId, localStreamRef.current);
        }

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit("call:offer", {
          callId,
          sdp: offer,
        });
      } catch (err) {
        console.error("Failed to create SDP offer:", err);
        cleanup();
      }
    };

    // If receiver accepted on another browser tab, stop ringing on this tab
    const handleAcceptedElsewhere = ({ callId }) => {
      if (callIdRef.current === callId) {
        cleanup();
      }
    };

    // Caller receives call rejection notification
    const handleRejected = ({ callId, reason }) => {
      if (callIdRef.current && callIdRef.current !== callId) return;
      toast(reason === "busy" ? "User is busy" : "Call declined");
      cleanup();
    };

    // Receiver receives SDP offer from caller -> set remote description, create & send SDP answer
    const handleOffer = async ({ callId, sdp }) => {
      if (callIdRef.current && callIdRef.current !== callId) return;

      try {
        let pc = pcRef.current;
        if (!pc) {
          pc = createPeerConnection(callId, localStreamRef.current);
        }

        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        await processQueuedIceCandidates();

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit("call:answer", {
          callId,
          sdp: answer,
        });
      } catch (err) {
        console.error("Failed to handle SDP offer:", err);
        cleanup();
      }
    };

    // Caller receives SDP answer from receiver -> set remote description
    const handleAnswer = async ({ callId, sdp }) => {
      if (callIdRef.current && callIdRef.current !== callId) return;

      try {
        const pc = pcRef.current;
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
          await processQueuedIceCandidates();
        }
      } catch (err) {
        console.error("Failed to handle SDP answer:", err);
        cleanup();
      }
    };

    // Either party receives remote ICE candidate
    const handleIceCandidate = async ({ callId, candidate }) => {
      if (callIdRef.current && callIdRef.current !== callId) return;
      await handleRemoteIceCandidate(candidate);
    };

    // Call ended by either participant or peer disconnection
    const handleEnded = ({ callId, reason }) => {
      if (callIdRef.current && callIdRef.current !== callId) return;
      if (reason === "disconnected") {
        toast("Call disconnected");
      } else {
        toast("Call ended");
      }
      cleanup();
    };

    // Ringing timeout
    const handleTimeout = ({ callId }) => {
      if (callIdRef.current && callIdRef.current !== callId) return;
      toast("No answer");
      cleanup();
    };

    // General call errors from backend
    const handleCallError = ({ message, reason }) => {
      toast.error(message || "Call error");
      if (reason === "caller_busy" || reason === "receiver_busy" || reason === "offline") {
        cleanup();
      }
    };

    // Register listeners
    socket.on("call:ringing", handleRinging);
    socket.on("call:incoming", handleIncoming);
    socket.on("call:accepted", handleAccepted);
    socket.on("call:accepted_elsewhere", handleAcceptedElsewhere);
    socket.on("call:rejected", handleRejected);
    socket.on("call:offer", handleOffer);
    socket.on("call:answer", handleAnswer);
    socket.on("call:ice-candidate", handleIceCandidate);
    socket.on("call:ended", handleEnded);
    socket.on("call:timeout", handleTimeout);
    socket.on("call:error", handleCallError);

    return () => {
      socket.off("call:ringing", handleRinging);
      socket.off("call:incoming", handleIncoming);
      socket.off("call:accepted", handleAccepted);
      socket.off("call:accepted_elsewhere", handleAcceptedElsewhere);
      socket.off("call:rejected", handleRejected);
      socket.off("call:offer", handleOffer);
      socket.off("call:answer", handleAnswer);
      socket.off("call:ice-candidate", handleIceCandidate);
      socket.off("call:ended", handleEnded);
      socket.off("call:timeout", handleTimeout);
      socket.off("call:error", handleCallError);
    };
  }, [
    socket,
    createPeerConnection,
    handleRemoteIceCandidate,
    processQueuedIceCandidates,
    cleanup,
  ]);

  // Clean up on hook unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    callState, // 'idle' | 'calling' | 'ringing' | 'connecting' | 'connected' | 'ended'
    callType,  // 'voice' | 'video' | null
    activeCallId,
    callerId,
    receiverId,
    isCaller,
    localStream,
    remoteStream,
    isMuted,
    isCameraOff,
    connectionState,
    errorMessage,
    callerProfile,
    targetProfile,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
  };
};

export default useWebRTC;
