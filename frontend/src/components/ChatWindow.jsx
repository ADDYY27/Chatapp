import { useEffect, useRef, useState } from "react";
import useGetMessages from "../hooks/useGetMessages";
import useSendMessage from "../hooks/useSendMessage";
import useGetGroupMessages from "../hooks/useGetGroupMessages";
import useSendGroupMessage from "../hooks/useSendGroupMessage";
import { useSocket } from "../context/SocketContext";
import axiosInstance from "../utils/axios";
import useChatStore from "../store/useChatStore";
import Message from "./Message";
import MessageInput from "./MessageInput";
import ChatDetailsSidebar from "./ChatDetailsSidebar";
import { useAuth } from "../context/AuthContext";
import Avatar from "./Avatar";
import toast from "react-hot-toast";

/* ============================================================
   Group Info Modal (for group chats)
   ============================================================ */
const GroupInfoModal = ({ group, authUser, onClose, onGroupUpdated }) => {
  const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
  const MAX_SIZE = 5 * 1024 * 1024;
  const [uploading, setUploading] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(group.groupName);
  const fileRef = useRef(null);

  const isAdmin = (group.groupAdmin?._id || group.groupAdmin)?.toString() === authUser?._id?.toString();
  const adminId = (group.groupAdmin?._id || group.groupAdmin)?.toString();

  const handlePicChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) { toast.error("Invalid image type"); return; }
    if (file.size > MAX_SIZE) { toast.error("Image too large (max 5MB)"); return; }
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        setUploading(true);
        const { data } = await axiosInstance.put(`/group/${group._id}/pic`, { groupPic: reader.result });
        if (data.success) { toast.success("Group picture updated!"); onGroupUpdated(data.group); }
      } catch (err) {
        toast.error(err?.response?.data?.message || "Failed to update picture");
      } finally { setUploading(false); }
    };
    reader.readAsDataURL(file);
  };

  const handleNameSave = async () => {
    if (!newName.trim() || newName.trim() === group.groupName) { setEditingName(false); return; }
    try {
      const { data } = await axiosInstance.put(`/group/${group._id}/name`, { groupName: newName.trim() });
      if (data.success) { toast.success("Group name updated!"); onGroupUpdated(data.group); setEditingName(false); }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update name");
    }
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 60,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.65)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--ng-panel)", borderRadius: "var(--r-card)",
          border: "1px solid var(--ng-border)", width: 320, maxHeight: "85vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 20px 12px", borderBottom: "1px solid var(--ng-border)" }}>
          <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 16, color: "var(--ng-text)", margin: 0 }}>Group Info</p>
          <button onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ng-muted)", fontSize: 18, padding: 4 }}>✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 20px 12px" }}>
          <div style={{ position: "relative", cursor: isAdmin ? "pointer" : "default" }} onClick={() => isAdmin && !uploading && fileRef.current?.click()}>
            <Avatar src={group.groupPic} name={group.groupName} size={80} ring={true} />
            {isAdmin && (
              <div
                style={{
                  position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(0,0,0,0.5)",
                  display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.2s",
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                onMouseLeave={e => e.currentTarget.style.opacity = "0"}
              >
                {uploading ? <span className="loading loading-spinner loading-xs" style={{ color: "#fff" }} /> : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </div>
            )}
            {isAdmin && <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePicChange} />}
          </div>

          <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
            {editingName ? (
              <>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleNameSave()}
                  autoFocus
                  style={{ background: "var(--ng-hover)", border: "1px solid var(--ng-border)", color: "var(--ng-text)", borderRadius: "var(--r-btn)", padding: "6px 10px", fontFamily: "var(--font-body)", fontSize: 14, outline: "none" }}
                />
                <button onClick={handleNameSave} style={{ background: "var(--ng-accent)", border: "none", cursor: "pointer", color: "var(--ng-accent-fg)", borderRadius: "var(--r-btn)", padding: "6px 12px", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13 }}>Save</button>
                <button onClick={() => { setEditingName(false); setNewName(group.groupName); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ng-muted)", fontSize: 16, padding: 4 }}>✕</button>
              </>
            ) : (
              <>
                <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 18, color: "var(--ng-text)", margin: 0 }}>{group.groupName}</p>
                {isAdmin && (
                  <button aria-label="Edit group name" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ng-muted)", padding: 2, borderRadius: 6 }} onClick={() => setEditingName(true)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                )}
              </>
            )}
          </div>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--ng-muted)", margin: "4px 0 0" }}>{group.participants?.length || 0} Members</p>
        </div>

        <div style={{ padding: "0 20px 20px" }}>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 10, fontWeight: 600, color: "var(--ng-muted)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px" }}>Members</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {group.participants?.map((member) => {
              const memberId = (member._id || member)?.toString();
              const isGroupAdmin = memberId === adminId;
              return (
                <div key={memberId} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Avatar src={member.profilepic} name={member.fullname} size={36} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13, color: "var(--ng-text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {member.fullname}{isGroupAdmin && <span style={{ marginLeft: 6 }}>👑</span>}
                    </p>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--ng-muted)", margin: 0 }}>@{member.username}</p>
                  </div>
                  {isGroupAdmin && (
                    <span style={{ fontFamily: "var(--font-body)", fontSize: 10, fontWeight: 600, color: "var(--ng-accent)", background: "rgba(232,163,61,0.15)", borderRadius: 6, padding: "2px 7px" }}>Admin</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   Call Modal (Voice & Video call simulation)
   ============================================================ */
const CallModal = ({ type, name, avatarSrc, onClose }) => {
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 70,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(10, 14, 12, 0.85)", backdropFilter: "blur(8px)",
      }}
    >
      <div
        style={{
          background: "var(--ng-panel)",
          border: "1px solid var(--ng-border)",
          borderRadius: "var(--r-card)",
          padding: "36px 32px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
          width: 320,
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        }}
      >
        <div style={{ position: "relative" }}>
          <Avatar src={avatarSrc} name={name} size={92} ring={true} ringColor="var(--ng-accent)" />
          <span
            style={{
              position: "absolute", inset: -8, borderRadius: "50%",
              border: "2px solid var(--ng-accent)", opacity: 0.4,
              animation: "ngPulseSlow 1.5s infinite ease-in-out",
            }}
          />
        </div>

        <div style={{ textAlign: "center" }}>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 20, color: "var(--ng-text)", margin: "4px 0" }}>
            {name}
          </h2>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--ng-online)", margin: 0 }}>
            {type === "video" ? "Connecting video call..." : "Ringing..."}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 12 }}>
          <button
            onClick={() => toast("Microphone muted")}
            aria-label="Mute microphone"
            style={{
              width: 48, height: 48, borderRadius: "50%",
              background: "var(--ng-hover)", border: "1px solid var(--ng-border)",
              color: "var(--ng-text)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            🎤
          </button>
          <button
            onClick={onClose}
            aria-label="End call"
            style={{
              width: 54, height: 54, borderRadius: "50%",
              background: "var(--ng-terracotta)", color: "#fff",
              border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 16px rgba(201, 116, 62, 0.4)",
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.684A1 1 0 008.279 3H5z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   ChatWindow Component
   ============================================================ */
const ChatWindow = () => {
  const { socket } = useSocket();
  const { authUser } = useAuth();
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showDetails, setShowDetails] = useState(true);
  const [activeCall, setActiveCall] = useState(null); // 'voice' | 'video' | null
  const [inChatSearch, setInChatSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNudged, setIsNudged] = useState(false);
  const [activeColor, setActiveColor] = useState(() => {
    if (selectedUser?._id) {
      return localStorage.getItem(`chatapp_color_${selectedUser._id}`) || "#E8A33D";
    }
    return "#E8A33D";
  });
  const [activeColorFg, setActiveColorFg] = useState("#16110A");

  const { selectedUser, selectedGroup, messages, onlineUsers, setSelectedGroup, setActiveSection, typingMap } = useChatStore();
  const isRecipientTyping = Boolean(selectedUser?._id && typingMap?.[selectedUser._id]);

  const { loading: userMessagesLoading } = useGetMessages(selectedUser?._id);
  const { sendMessage, sending: userSending } = useSendMessage(selectedUser?._id);
  const { loading: groupMessagesLoading } = useGetGroupMessages(selectedGroup?._id);
  const { sendGroupMessage, sending: groupSending } = useSendGroupMessage(selectedGroup?._id);
  const bottomRef = useRef(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (selectedUser?._id) {
      const saved = localStorage.getItem(`chatapp_color_${selectedUser._id}`);
      setActiveColor(saved || "#E8A33D");
    }
  }, [selectedUser?._id]);

  useEffect(() => {
    setTimeout(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, 100);
  }, [messages]);

  useEffect(() => {
    if (!socket || !selectedGroup?._id) return;
    socket.emit("joinGroup", selectedGroup._id);
    return () => { socket.emit("leaveGroup", selectedGroup._id); };
  }, [socket, selectedGroup?._id]);

  useEffect(() => {
    if (!selectedUser?._id) return;
    const markAsRead = async () => {
      try { await axiosInstance.put(`/message/read/${selectedUser._id}`); }
      catch (error) { console.log("Error marking messages as read:", error); }
    };
    markAsRead();
  }, [selectedUser?._id, messages.length]);

  useEffect(() => {
    if (!socket) return;
    socket.on("groupUpdated", (updatedGroup) => {
      if (selectedGroup?._id === updatedGroup._id) {
        setSelectedGroup(updatedGroup);
        if (showGroupInfo) setShowGroupInfo(false);
      }
    });
    socket.on("nudgeError", ({ message }) => {
      toast.error(message || "Please wait before nudging again.");
    });
    return () => {
      socket.off("groupUpdated");
      socket.off("nudgeError");
    };
  }, [socket, selectedGroup?._id]);

  // Listen for incoming nudge events to trigger shake animation
  useEffect(() => {
    const handleIncomingNudge = (e) => {
      const senderId = e.detail?.senderId;
      if (selectedUser?._id && senderId === selectedUser._id) {
        setIsNudged(true);
        toast(`${selectedUser.fullname} nudged you! 👋`, { icon: "⚡" });
        setTimeout(() => setIsNudged(false), 1200);
      }
    };
    window.addEventListener("chatapp:nudge", handleIncomingNudge);
    return () => window.removeEventListener("chatapp:nudge", handleIncomingNudge);
  }, [selectedUser]);

  const handleNudge = () => {
    if (!socket || !selectedUser?._id) return;
    socket.emit("nudge", { receiverId: selectedUser._id });
    setIsNudged(true);
    toast(`Nudged ${selectedUser?.fullname || "contact"}! 👋`, {
      icon: "⚡",
    });
    setTimeout(() => setIsNudged(false), 700);
  };

  const handleSendAudio = async (base64Audio, duration) => {
    if (selectedUser) {
      await sendMessage("", { audioUrl: base64Audio, audioDuration: duration });
    } else if (selectedGroup) {
      await sendGroupMessage("", { audioUrl: base64Audio, audioDuration: duration });
    }
  };

  const handleColorChange = (hex, fg) => {
    setActiveColor(hex);
    if (fg) setActiveColorFg(fg);
    if (selectedUser?._id) {
      localStorage.setItem(`chatapp_color_${selectedUser._id}`, hex);
    }
    toast.success(`Theme updated: ${hex}`);
  };

  const displayMessages = messages || [];

  const filteredMessages = searchQuery.trim()
    ? displayMessages.filter((m) =>
        m.message?.toLowerCase().includes(searchQuery.toLowerCase().trim())
      )
    : displayMessages;

  /* ---- Empty state (When no conversation is chosen) ---- */
  if (!selectedUser && !selectedGroup) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--ng-bg)",
          gap: 20,
          padding: 24,
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "var(--r-tile)",
            background: "var(--ng-panel)",
            border: "1px solid var(--ng-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={{ color: "var(--ng-muted)" }}
          >
            <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>

        <div style={{ textAlign: "center" }}>
          <p
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 700,
              fontSize: 20,
              color: "var(--ng-text)",
              margin: "0 0 8px",
            }}
          >
            No conversation selected
          </p>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 14,
              color: "var(--ng-muted)",
              margin: "0 0 20px",
            }}
          >
            Pick someone from the sidebar to start chatting
          </p>
          <button
            onClick={() => setActiveSection("people")}
            style={{
              background: "var(--ng-accent)",
              color: "var(--ng-accent-fg)",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font-body)",
              fontWeight: 600,
              fontSize: 14,
              padding: "10px 24px",
              borderRadius: "var(--r-btn)",
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Find people
          </button>
        </div>
      </div>
    );
  }

  const isOnline = onlineUsers?.includes(selectedUser?._id);
  const displayName = selectedGroup ? selectedGroup.groupName : selectedUser?.fullname;
  const avatarSrc = selectedGroup ? selectedGroup.groupPic : selectedUser?.profilepic;

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        height: "100%",
        background: "var(--ng-bg)",
        overflow: "hidden",
      }}
    >
      {/* ========== CENTER / CHAT STREAM COLUMN ========== */}
      <div
        ref={chatContainerRef}
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          background: "var(--ng-bg)",
          overflow: "hidden",
          animation: isNudged ? "ngNudge 0.65s ease-in-out" : "none",
        }}
      >
        {/* ========== CHAT HEADER ========== */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 20px",
            borderBottom: "1px solid var(--ng-border)",
            background: "var(--ng-panel)",
            flexShrink: 0,
            minHeight: 64,
          }}
        >
          {/* Left: User Avatar + Display Name + Status */}
          <div
            style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", minWidth: 0, flex: 1 }}
            onClick={() => {
              if (selectedGroup) setShowGroupInfo(true);
              else setShowDetails(!showDetails);
            }}
          >
            <Avatar
              src={avatarSrc}
              name={displayName}
              size={42}
              online={selectedGroup ? undefined : isOnline}
              borderColor="var(--ng-panel)"
              ring={true}
              ringColor={activeColor}
            />

            <div style={{ minWidth: 0, flex: 1 }}>
              <p
                style={{
                  fontFamily: "var(--font-heading)",
                  fontWeight: 700,
                  fontSize: 16,
                  color: "var(--ng-text)",
                  margin: 0,
                  lineHeight: 1.2,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {displayName}
              </p>

              {selectedGroup ? (
                <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--ng-muted)", margin: "2px 0 0", whiteSpace: "nowrap" }}>
                  {selectedGroup.participants?.length || 0} members · tap for info
                </p>
              ) : (
                <p style={{ fontFamily: "var(--font-body)", fontSize: 12, margin: "2px 0 0", whiteSpace: "nowrap" }}>
                  {isOnline ? (
                    <>
                      <span style={{ color: "var(--ng-online)", fontWeight: 500 }}>Online</span>
                      <span style={{ color: "var(--ng-muted)" }}> · shipping the sidebar</span>
                    </>
                  ) : (
                    <span style={{ color: "var(--ng-muted)" }}>Offline · last seen 2h ago</span>
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Right: 44px min interactive action buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {/* Voice call button */}
            <button
              onClick={() => setActiveCall("voice")}
              aria-label="Start voice call"
              style={{
                width: 44,
                height: 44,
                borderRadius: "var(--r-btn)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--ng-muted)",
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
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </button>

            {/* Video call button */}
            <button
              onClick={() => setActiveCall("video")}
              aria-label="Start video call"
              style={{
                width: 44,
                height: 44,
                borderRadius: "var(--r-btn)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--ng-muted)",
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
              <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>

            {/* In-chat search button */}
            <button
              onClick={() => setInChatSearch(!inChatSearch)}
              aria-label="Search conversation messages"
              style={{
                width: 44,
                height: 44,
                borderRadius: "var(--r-btn)",
                background: inChatSearch ? "var(--ng-hover)" : "none",
                border: "none",
                cursor: "pointer",
                color: inChatSearch ? "var(--ng-accent)" : "var(--ng-muted)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "color 0.15s, background 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--ng-text)";
                if (!inChatSearch) e.currentTarget.style.background = "var(--ng-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = inChatSearch ? "var(--ng-accent)" : "var(--ng-muted)";
                if (!inChatSearch) e.currentTarget.style.background = "none";
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0112 0z" />
              </svg>
            </button>

            {/* Toggle contact details button */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              aria-label="Toggle contact details sidebar"
              style={{
                width: 44,
                height: 44,
                borderRadius: "var(--r-btn)",
                background: showDetails ? "var(--ng-hover)" : "none",
                border: "none",
                cursor: "pointer",
                color: showDetails ? "var(--ng-accent)" : "var(--ng-muted)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "color 0.15s, background 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--ng-text)";
                if (!showDetails) e.currentTarget.style.background = "var(--ng-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = showDetails ? "var(--ng-accent)" : "var(--ng-muted)";
                if (!showDetails) e.currentTarget.style.background = "none";
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* IN-CHAT SEARCH BANNER */}
        {inChatSearch && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 20px",
              background: "var(--ng-hover)",
              borderBottom: "1px solid var(--ng-border)",
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: "var(--ng-muted)" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0112 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search in this chat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                fontFamily: "var(--font-body)",
                fontSize: 13,
                color: "var(--ng-text)",
                caretColor: "var(--ng-accent)",
              }}
            />
            {searchQuery && (
              <span style={{ fontSize: 11, color: "var(--ng-muted)", fontFamily: "var(--font-body)" }}>
                {filteredMessages.length} match{filteredMessages.length === 1 ? "" : "es"}
              </span>
            )}
            <button
              onClick={() => {
                setSearchQuery("");
                setInChatSearch(false);
              }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ng-muted)", fontSize: 14 }}
            >
              ✕
            </button>
          </div>
        )}

        {/* ========== MESSAGE STREAM ========== */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
            animation: isNudged ? "ngNudge 0.6s ease-in-out" : "none",
          }}
        >
          {/* Date pill separator 'Today' */}
          <div style={{ display: "flex", justifyContent: "center", margin: "4px 0 16px" }}>
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 12,
                fontWeight: 500,
                color: "var(--ng-muted)",
                background: "var(--ng-hover)",
                border: "1px solid var(--ng-border)",
                padding: "3px 14px",
                borderRadius: 99,
              }}
            >
              Today
            </span>
          </div>

          {/* Loading indicator */}
          {(userMessagesLoading || groupMessagesLoading) && (
            <div style={{ display: "flex", justifyContent: "center", padding: "20px 0" }}>
              <span className="loading loading-dots loading-md" style={{ color: activeColor }} />
            </div>
          )}

          {/* Empty state when no messages */}
          {filteredMessages.length === 0 && !userMessagesLoading && !groupMessagesLoading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", textAlign: "center", opacity: 0.7 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--ng-text)", margin: 0, fontWeight: 500 }}>
                {searchQuery.trim() ? "No messages found" : "No messages yet"}
              </p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--ng-muted)", margin: "4px 0 0" }}>
                {searchQuery.trim() ? "Try searching for something else" : `Send a message to start the conversation with ${displayName}`}
              </p>
            </div>
          )}

          {/* Render Messages */}
          {filteredMessages.map((msg) => (
            <Message
              key={msg._id}
              message={msg}
              activeColor={activeColor}
              activeColorFg={activeColorFg}
            />
          ))}

          {/* Animated typing indicator bubble - only when other user is typing */}
          {isRecipientTyping && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "10px 14px",
                borderRadius: "18px 18px 18px 4px",
                background: "var(--ng-hover)",
                border: "1px solid rgba(255,255,255,0.04)",
                width: "fit-content",
                marginTop: 4,
              }}
              aria-label="User is typing"
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "var(--ng-muted)",
                  animation: "ngBounce 1.2s infinite ease-in-out",
                  animationDelay: "0ms",
                }}
              />
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "var(--ng-muted)",
                  animation: "ngBounce 1.2s infinite ease-in-out",
                  animationDelay: "200ms",
                }}
              />
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "var(--ng-muted)",
                  animation: "ngBounce 1.2s infinite ease-in-out",
                  animationDelay: "400ms",
                }}
              />
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* ========== MESSAGE INPUT BAR ========== */}
        <MessageInput
          onSend={selectedGroup ? sendGroupMessage : sendMessage}
          sending={selectedGroup ? groupSending : userSending}
          recipientName={displayName}
          onNudge={handleNudge}
          onSendAudio={handleSendAudio}
          activeColor={activeColor}
          activeColorFg={activeColorFg}
        />
      </div>

      {/* ========== RIGHT CONTACT DETAILS SIDEBAR ========== */}
      {showDetails && (
        <ChatDetailsSidebar
          user={selectedUser}
          group={selectedGroup}
          onClose={() => setShowDetails(false)}
          activeColor={activeColor}
          onColorChange={handleColorChange}
          onViewPinned={(pinnedId) => {
            const el = document.getElementById(`msg-${pinnedId}`);
            if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
          }}
        />
      )}

      {/* Group Info Modal */}
      {showGroupInfo && selectedGroup && (
        <GroupInfoModal
          group={selectedGroup}
          authUser={authUser}
          onClose={() => setShowGroupInfo(false)}
          onGroupUpdated={(updatedGroup) => {
            setSelectedGroup(updatedGroup);
            setShowGroupInfo(false);
          }}
        />
      )}

      {/* Active Call Modal */}
      {activeCall && (
        <CallModal
          type={activeCall}
          name={displayName}
          avatarSrc={avatarSrc}
          onClose={() => setActiveCall(null)}
        />
      )}
    </div>
  );
};

export default ChatWindow;