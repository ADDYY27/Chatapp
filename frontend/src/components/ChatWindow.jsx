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
import { useAuth } from "../context/AuthContext";
import Avatar from "./Avatar";
import toast from "react-hot-toast";

/* ============================================================
   Group Info Modal (inline in chat header)
   ============================================================ */
const GroupInfoModal = ({ group, authUser, onClose, onGroupUpdated }) => {
  const ALLOWED_TYPES = ["image/jpeg","image/jpg","image/png","image/webp","image/gif"];
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
      style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        style={{ background: "var(--ng-panel)", borderRadius: "var(--r-card)", border: "1px solid var(--ng-border)", width: 320, maxHeight: "85vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 20px 12px", borderBottom: "1px solid var(--ng-border)" }}>
          <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 16, color: "var(--ng-text)", margin: 0 }}>Group Info</p>
          <button onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ng-muted)", fontSize: 18, padding: 4, borderRadius: 8 }}>✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 20px 12px" }}>
          <div style={{ position: "relative", cursor: isAdmin ? "pointer" : "default" }} onClick={() => isAdmin && !uploading && fileRef.current?.click()}>
            <Avatar src={group.groupPic} name={group.groupName} size={80} />
            {isAdmin && (
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.2s" }}
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
          {group.createdAt && (
            <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--ng-muted)", margin: "2px 0 0", opacity: 0.6 }}>
              Created {new Date(group.createdAt).toLocaleDateString()}
            </p>
          )}
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
   ChatWindow
   ============================================================ */
const ChatWindow = () => {
  const { socket } = useSocket();
  const { authUser } = useAuth();
  const [showGroupInfo, setShowGroupInfo] = useState(false);

  const { selectedUser, selectedGroup, messages, onlineUsers, setSelectedGroup } = useChatStore();

  const { loading: userMessagesLoading } = useGetMessages(selectedUser?._id);
  const { sendMessage, sending: userSending } = useSendMessage(selectedUser?._id);
  const { loading: groupMessagesLoading } = useGetGroupMessages(selectedGroup?._id);
  const { sendGroupMessage, sending: groupSending } = useSendGroupMessage(selectedGroup?._id);
  const bottomRef = useRef(null);

  const { setActiveSection } = useChatStore();

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
  }, [selectedUser?._id]);

  useEffect(() => {
    if (!socket) return;
    socket.on("groupUpdated", (updatedGroup) => {
      if (selectedGroup?._id === updatedGroup._id) {
        setSelectedGroup(updatedGroup);
        if (showGroupInfo) setShowGroupInfo(false);
      }
    });
    return () => socket.off("groupUpdated");
  }, [socket, selectedGroup?._id]);

  /* ---- Empty state ---- */
  if (!selectedUser && !selectedGroup) {
    return (
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "var(--ng-bg)", gap: 20, padding: 24,
      }}>
        {/* Icon tile */}
        <div style={{
          width: 72, height: 72, borderRadius: "var(--r-tile)",
          background: "var(--ng-panel)", border: "1px solid var(--ng-border)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ color: "var(--ng-muted)" }}>
            <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>

        <div style={{ textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 20, color: "var(--ng-text)", margin: "0 0 8px" }}>
            No conversation selected
          </p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--ng-muted)", margin: "0 0 20px" }}>
            Pick someone from the sidebar to start chatting
          </p>
          <button
            onClick={() => setActiveSection("people")}
            style={{
              background: "var(--ng-accent)", color: "var(--ng-accent-fg)",
              border: "none", cursor: "pointer",
              fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 14,
              padding: "10px 24px", borderRadius: "var(--r-btn)",
              transition: "opacity 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          >
            Find people
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", background: "var(--ng-bg)", overflow: "hidden" }}>

      {/* ========== HEADER ========== */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "12px 20px", borderBottom: "1px solid var(--ng-border)",
        background: "var(--ng-panel)", flexShrink: 0,
      }}>
        {selectedGroup ? (
          <>
            <div style={{ cursor: "pointer" }} onClick={() => setShowGroupInfo(true)}>
              <Avatar src={selectedGroup.groupPic} name={selectedGroup.groupName} size={40} />
            </div>
            <div style={{ cursor: "pointer" }} onClick={() => setShowGroupInfo(true)}>
              <p style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 15, color: "var(--ng-text)", margin: 0 }}>
                {selectedGroup.groupName}
              </p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--ng-muted)", margin: 0 }}>
                {selectedGroup.participants?.length || 0} members · tap for info
              </p>
            </div>
          </>
        ) : (
          <>
            <div style={{ position: "relative" }}>
              <Avatar
                src={selectedUser?.profilepic}
                name={selectedUser?.fullname || selectedUser?.username}
                size={40}
                online={onlineUsers?.includes(selectedUser?._id)}
                borderColor="var(--ng-panel)"
              />
            </div>
            <div>
              <p style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 15, color: "var(--ng-text)", margin: 0 }}>
                {selectedUser?.fullname}
              </p>
              <p style={{
                fontFamily: "var(--font-body)", fontSize: 12, margin: 0,
                color: onlineUsers?.includes(selectedUser?._id) ? "var(--ng-online)" : "var(--ng-muted)",
              }}>
                {onlineUsers?.includes(selectedUser?._id) ? "Online" : "Offline"}
              </p>
            </div>
          </>
        )}
      </div>

      {/* ========== MESSAGES ========== */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 4 }}>
        {selectedGroup ? (
          groupMessagesLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
              <span className="loading loading-dots loading-md" style={{ color: "var(--ng-accent)" }} />
            </div>
          ) : messages.length === 0 ? (
            <p style={{ textAlign: "center", fontFamily: "var(--font-body)", fontSize: 13, color: "var(--ng-muted)", padding: "40px 0" }}>
              No messages yet — start the conversation! 👋
            </p>
          ) : (
            messages.map((msg) => <Message key={msg._id} message={msg} />)
          )
        ) : userMessagesLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
            <span className="loading loading-dots loading-md" style={{ color: "var(--ng-accent)" }} />
          </div>
        ) : messages.length === 0 ? (
          <p style={{ textAlign: "center", fontFamily: "var(--font-body)", fontSize: 13, color: "var(--ng-muted)", padding: "40px 0" }}>
            No messages yet — say hello! 👋
          </p>
        ) : (
          messages.map((msg) => <Message key={msg._id} message={msg} />)
        )}
        <div ref={bottomRef} />
      </div>

      {/* ========== INPUT ========== */}
      <MessageInput
        onSend={selectedGroup ? sendGroupMessage : sendMessage}
        sending={selectedGroup ? groupSending : userSending}
      />

      {/* Group Info Modal */}
      {showGroupInfo && selectedGroup && (
        <GroupInfoModal
          group={selectedGroup}
          authUser={authUser}
          onClose={() => setShowGroupInfo(false)}
          onGroupUpdated={(updatedGroup) => { setSelectedGroup(updatedGroup); setShowGroupInfo(false); }}
        />
      )}
    </div>
  );
};

export default ChatWindow;