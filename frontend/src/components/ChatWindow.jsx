

// import { useEffect, useRef } from "react";
// import useGetMessages from "../hooks/useGetMessages";
// import useSendMessage from "../hooks/useSendMessage";
// import { useSocket } from "../context/SocketContext";
// import useChatStore from "../store/useChatStore";
// import Message from "./Message";
// import MessageInput from "./MessageInput";

// const ChatWindow = () => {
//   const { socket } = useSocket();
//   const { selectedUser, messages, setMessages, onlineUsers } = useChatStore();
//   const { loading } = useGetMessages(selectedUser?._id);
//   const { sendMessage, sending } = useSendMessage(selectedUser?._id);
//   const bottomRef = useRef(null);

//   // only handles appending messages to active chat
//   useEffect(() => {
//     socket?.on("newMessage", (newMessage) => {
//       const senderId = newMessage.senderId?.toString();
//       const selectedId = selectedUser?._id?.toString();

//       if (senderId === selectedId) {
//         setMessages([...messages, newMessage]);
//       }
//     });

//     return () => socket?.off("newMessage");
//   }, [socket, messages, setMessages, selectedUser]);

//   useEffect(() => {
//     setTimeout(() => {
//       bottomRef.current?.scrollIntoView({ behavior: "smooth" });
//     }, 100);
//   }, [messages]);

//   if (!selectedUser) {
//     return (
//       <div className="flex-1 flex flex-col items-center justify-center bg-base-100 text-base-content/30 gap-4">
//         <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
//         </svg>
//         <div className="text-center">
//           <p className="font-semibold text-base-content/40 text-lg">No conversation selected</p>
//           <p className="text-sm text-base-content/30 mt-1">Pick someone from the sidebar to start chatting</p>
//         </div>
//       </div>
//     );
//   }

//   const isOnline = onlineUsers?.includes(selectedUser._id);

//   return (
//     <div className="flex-1 flex flex-col h-full bg-base-100">
//       <div className="flex items-center gap-3 px-5 py-3.5 border-b border-base-300 bg-base-200">
//         <div className="relative">
//           <div className="w-10 h-10 rounded-full overflow-hidden bg-primary flex items-center justify-center text-primary-content font-bold">
//             <img
//               src={selectedUser.profilepic}
//               alt={selectedUser.fullname}
//               className="w-full h-full object-cover"
//               onError={(e) => {
//                 e.target.style.display = "none";
//                 e.target.parentElement.innerText = selectedUser.fullname?.charAt(0).toUpperCase();
//               }}
//             />
//           </div>
//           {isOnline && (
//             <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success rounded-full border-2 border-base-200" />
//           )}
//         </div>
//         <div>
//           <p className="font-semibold text-base-content text-sm">{selectedUser.fullname}</p>
//           <p className={`text-xs ${isOnline ? "text-success" : "text-base-content/40"}`}>
//             {isOnline ? "Online" : "Offline"}
//           </p>
//         </div>
//       </div>

//       <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
//         {loading ? (
//           <div className="flex justify-center py-10">
//             <span className="loading loading-dots loading-md text-primary" />
//           </div>
//         ) : messages.length === 0 ? (
//           <p className="text-center text-xs text-base-content/30 py-10">
//             No messages yet — say hello! 👋
//           </p>
//         ) : (
//           messages.map((msg) => (
//             <Message key={msg._id} message={msg} />
//           ))
//         )}
//         <div ref={bottomRef} />
//       </div>

//       <MessageInput onSend={sendMessage} sending={sending} />
//     </div>
//   );
// };

// export default ChatWindow;


import { useEffect, useRef } from "react";
import useGetMessages from "../hooks/useGetMessages";
import useSendMessage from "../hooks/useSendMessage";
import { useSocket } from "../context/SocketContext";
import useChatStore from "../store/useChatStore";
import Message from "./Message";
import MessageInput from "./MessageInput";

const ChatWindow = () => {
  const { socket } = useSocket();
  const { selectedUser, messages, setMessages, onlineUsers } = useChatStore();
  const { loading } = useGetMessages(selectedUser?._id);
  const { sendMessage, sending } = useSendMessage(selectedUser?._id);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMessage) => {
      // ✅ always read fresh state — no stale closure
      const { selectedUser: currentSelected, messages: currentMessages, setMessages: currentSetMessages } = useChatStore.getState();
      const senderId = newMessage.senderId?.toString();
      const selectedId = currentSelected?._id?.toString();

      if (senderId === selectedId) {
        currentSetMessages([...currentMessages, newMessage]);
      }
    };

    socket.on("newMessage", handleNewMessage);
    return () => socket.off("newMessage", handleNewMessage);
  }, [socket]); // ✅ only depends on socket — never re-registers unnecessarily

  useEffect(() => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, [messages]);

  if (!selectedUser) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-base-100 gap-4">
        <div className="w-20 h-20 rounded-full bg-base-300 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-base-content/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <div className="text-center">
          <p className="font-semibold text-base-content/40 text-lg">No conversation selected</p>
          <p className="text-sm text-base-content/30 mt-1">Pick someone from the sidebar to start chatting</p>
        </div>
      </div>
    );
  }

  const isOnline = onlineUsers?.includes(selectedUser._id);
  const initial = selectedUser.fullname?.charAt(0).toUpperCase() || "?";

  return (
    <div className="flex-1 flex flex-col h-full bg-base-100">
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-base-300 bg-base-200">
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-content font-bold">
            {initial}
          </div>
          {isOnline && (
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success rounded-full border-2 border-base-200" />
          )}
        </div>
        <div>
          <p className="font-semibold text-base-content text-sm">{selectedUser.fullname}</p>
          <p className={`text-xs ${isOnline ? "text-success" : "text-base-content/40"}`}>
            {isOnline ? "Online" : "Offline"}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {loading ? (
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

      <MessageInput onSend={sendMessage} sending={sending} />
    </div>
  );
};

export default ChatWindow;
