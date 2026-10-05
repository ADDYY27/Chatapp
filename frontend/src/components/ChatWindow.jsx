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
import toast from "react-hot-toast";

// Group info modal (inline in chat header)
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-base-100 rounded-2xl shadow-xl w-80 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-base-300">
          <p className="font-bold text-base">Group Info</p>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        <div className="flex flex-col items-center py-5 px-5">
          <div className={`relative ${isAdmin ? "group cursor-pointer" : ""}`} onClick={() => isAdmin && !uploading && fileRef.current?.click()}>
            <div className="w-20 h-20 rounded-full overflow-hidden bg-primary flex items-center justify-center text-primary-content text-2xl ring-2 ring-primary/30">
              {group.groupPic ? (
                <img src={group.groupPic} alt={group.groupName} className="w-full h-full object-cover" />
              ) : "👥"}
            </div>
            {isAdmin && (
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {uploading ? <span className="loading loading-spinner loading-xs text-white" /> : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </div>
            )}
            {isAdmin && <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePicChange} />}
          </div>

          <div className="mt-3 flex items-center gap-2">
            {editingName ? (
              <>
                <input className="input input-sm input-bordered" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleNameSave()} autoFocus />
                <button className="btn btn-sm btn-primary" onClick={handleNameSave}>Save</button>
                <button className="btn btn-sm btn-ghost" onClick={() => { setEditingName(false); setNewName(group.groupName); }}>✕</button>
              </>
            ) : (
              <>
                <p className="font-bold text-lg">{group.groupName}</p>
                {isAdmin && (
                  <button className="btn btn-ghost btn-xs" onClick={() => setEditingName(true)}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                )}
              </>
            )}
          </div>
          <p className="text-xs text-base-content/40 mt-1">{group.participants?.length || 0} Members</p>
          {group.createdAt && (
            <p className="text-xs text-base-content/30 mt-1">Created {new Date(group.createdAt).toLocaleDateString()}</p>
          )}
        </div>

        <div className="px-5 pb-5">
          <p className="text-xs font-semibold text-base-content/40 uppercase tracking-wide mb-3">Members</p>
          <div className="flex flex-col gap-2">
            {group.participants?.map((member) => {
              const memberId = (member._id || member)?.toString();
              const isGroupAdmin = memberId === adminId;
              return (
                <div key={memberId} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-primary flex items-center justify-center text-primary-content font-bold flex-shrink-0">
                    {member.profilepic ? (
                      <img src={member.profilepic} alt={member.fullname} className="w-full h-full object-cover" />
                    ) : (member.fullname?.charAt(0).toUpperCase() || "?")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {member.fullname}
                      {isGroupAdmin && <span className="ml-1.5 text-warning">👑</span>}
                    </p>
                    <p className="text-xs text-base-content/40">@{member.username}</p>
                  </div>
                  {isGroupAdmin && <span className="badge badge-warning badge-sm">Admin</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const ChatWindow = () => {
  const { socket } = useSocket();
  const { authUser } = useAuth();
  const [showGroupInfo, setShowGroupInfo] = useState(false);

  const {
    selectedUser,
    selectedGroup,
    messages,
    onlineUsers,
    setSelectedGroup,
  } = useChatStore();

  const { loading: userMessagesLoading } = useGetMessages(selectedUser?._id);
  const { sendMessage, sending: userSending } = useSendMessage(selectedUser?._id);
  const { loading: groupMessagesLoading } = useGetGroupMessages(selectedGroup?._id);
  const { sendGroupMessage, sending: groupSending } = useSendGroupMessage(selectedGroup?._id);
  const bottomRef = useRef(null);

  useEffect(() => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, [messages]);

  useEffect(() => {
    if (!socket || !selectedGroup?._id) return;
    socket.emit("joinGroup", selectedGroup._id);
    return () => { socket.emit("leaveGroup", selectedGroup._id); };
  }, [socket, selectedGroup?._id]);

  useEffect(() => {
    if (!selectedUser?._id) return;
    const markAsRead = async () => {
      try {
        await axiosInstance.put(`/message/read/${selectedUser._id}`);
      } catch (error) {
        console.log("Error marking messages as read:", error);
      }
    };
    markAsRead();
  }, [selectedUser?._id]);

  // Socket: update selectedGroup when groupUpdated fires
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

  if (!selectedUser && !selectedGroup) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-base-100 gap-4">

        <div className="w-20 h-20 rounded-full bg-base-300 flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-10 h-10 text-base-content/20"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>

        <div className="text-center">
          <p className="font-semibold text-base-content/40 text-lg">
            No conversation selected
          </p>

          <p className="text-sm text-base-content/30 mt-1">
            Pick someone from the sidebar to start chatting
          </p>
        </div>

      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-base-100">

      {/* ================= HEADER ================= */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-base-300 bg-base-200">

        {selectedGroup ? (
          <>
            {/* Group Avatar - clickable for info */}
            <div
              className="w-10 h-10 rounded-full overflow-hidden bg-primary flex items-center justify-center text-primary-content text-lg cursor-pointer"
              onClick={() => setShowGroupInfo(true)}
            >
              {selectedGroup.groupPic ? (
                <img src={selectedGroup.groupPic} alt={selectedGroup.groupName} className="w-full h-full object-cover" />
              ) : "👥"}
            </div>

            {/* Group Info - clickable */}
            <div className="cursor-pointer" onClick={() => setShowGroupInfo(true)}>
              <p className="font-semibold text-base-content text-sm">
                {selectedGroup.groupName}
              </p>

              <p className="text-xs text-base-content/40">
                {selectedGroup.participants?.length || 0} members · tap for info
              </p>
            </div>
          </>
        ) : (
          <>
            {/* User Avatar */}
            <div className="relative">

              <div className="w-10 h-10 rounded-full overflow-hidden bg-primary flex items-center justify-center text-primary-content font-bold">
                {selectedUser?.profilepic ? (
                  <img src={selectedUser.profilepic} alt={selectedUser.fullname} className="w-full h-full object-cover" />
                ) : (
                  selectedUser?.fullname?.charAt(0).toUpperCase() || "?"
                )}
              </div>

              {onlineUsers?.includes(selectedUser?._id) && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success rounded-full border-2 border-base-200" />
              )}

            </div>

            {/* User Info */}
            <div>
              <p className="font-semibold text-base-content text-sm">
                {selectedUser?.fullname}
              </p>

              <p
                className={`text-xs ${
                  onlineUsers?.includes(selectedUser?._id)
                    ? "text-success"
                    : "text-base-content/40"
                }`}
              >
                {onlineUsers?.includes(selectedUser?._id) ? "Online" : "Offline"}
              </p>
            </div>
          </>
        )}

      </div>

      {/* ================= MESSAGES ================= */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">

        {selectedGroup ? (
  groupMessagesLoading ? (
    <div className="flex justify-center py-10">
      <span className="loading loading-dots loading-md text-primary" />
    </div>
  ) : messages.length === 0 ? (
    <p className="text-center text-xs text-base-content/30 py-10">
      No messages yet — start the conversation! 👋
    </p>
  ) : (
    messages.map((msg) => (
      <Message key={msg._id} message={msg} />
    ))
  )
) : userMessagesLoading ? (
  <div className="flex justify-center py-10">
    <span className="loading loading-dots loading-md text-primary" />
  </div>
) : messages.length === 0 ? (
  <p className="text-center text-xs text-base-content/30 py-10">
    No messages yet — say hello! 👋
  </p>
) : (
  messages.map((msg) => (
    <Message key={msg._id} message={msg} />
  ))
)}

        <div ref={bottomRef} />

      </div>

      {/* ================= MESSAGE INPUT ================= */}
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
          onGroupUpdated={(updatedGroup) => {
            setSelectedGroup(updatedGroup);
            setShowGroupInfo(false);
          }}
        />
      )}

    </div>
  );
};

export default ChatWindow;