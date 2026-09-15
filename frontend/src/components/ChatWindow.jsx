import { useEffect, useRef } from "react";
import useGetMessages from "../hooks/useGetMessages";
import useSendMessage from "../hooks/useSendMessage";
import useGetGroupMessages from "../hooks/useGetGroupMessages";
import useSendGroupMessage from "../hooks/useSendGroupMessage";
import { useSocket } from "../context/SocketContext";
import axiosInstance from "../utils/axios";
import useChatStore from "../store/useChatStore";
import Message from "./Message";
import MessageInput from "./MessageInput";

const ChatWindow = () => {
  const { socket } = useSocket();

  const {
    selectedUser,
    selectedGroup,
    messages,
    onlineUsers,
  } = useChatStore();

  // 1-to-1 chat hooks
  const { loading: userMessagesLoading } =
  useGetMessages(selectedUser?._id);

const { sendMessage, sending: userSending } =
  useSendMessage(selectedUser?._id);

const { loading: groupMessagesLoading } =
  useGetGroupMessages(selectedGroup?._id);

const {
  sendGroupMessage,
  sending: groupSending,
} = useSendGroupMessage(selectedGroup?._id);
  const bottomRef = useRef(null);

  // Scroll to latest message
  useEffect(() => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    }, 100);
  }, [messages]);

  useEffect(() => {
  if (!socket || !selectedGroup?._id) return;
    console.log("JOINING GROUP:", selectedGroup._id);


  socket.emit("joinGroup", selectedGroup._id);

  return () => {
    socket.emit("leaveGroup", selectedGroup._id);
  };
}, [socket, selectedGroup?._id]);
  

  // Mark 1-to-1 messages as read
  useEffect(() => {
    if (!selectedUser?._id) return;

    const markAsRead = async () => {
      try {
        await axiosInstance.put(
          `/message/read/${selectedUser._id}`
        );
      } catch (error) {
        console.log(
          "Error marking messages as read:",
          error
        );
      }
    };

    markAsRead();
  }, [selectedUser?._id]);

  // Nothing selected
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
            {/* Group Avatar */}
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-content text-lg">
              👥
            </div>

            {/* Group Info */}
            <div>
              <p className="font-semibold text-base-content text-sm">
                {selectedGroup.groupName}
              </p>

              <p className="text-xs text-base-content/40">
                {selectedGroup.participants?.length || 0} members
              </p>
            </div>
          </>
        ) : (
          <>
            {/* User Avatar */}
            <div className="relative">

              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-content font-bold">
                {selectedUser?.fullname
                  ?.charAt(0)
                  .toUpperCase() || "?"}
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
                {onlineUsers?.includes(selectedUser?._id)
                  ? "Online"
                  : "Offline"}
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
      <Message
        key={msg._id}
        message={msg}
      />
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
    <Message
      key={msg._id}
      message={msg}
    />
  ))
)}

        <div ref={bottomRef} />
        

      </div>
      

      {/* ================= MESSAGE INPUT ================= */}
     <MessageInput
  onSend={selectedGroup ? sendGroupMessage : sendMessage}
  sending={selectedGroup ? groupSending : userSending}
/>

    </div>
  );
};

export default ChatWindow;