import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import useChatStore from "../store/useChatStore";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { authUser } = useAuth();

  const {
    setOnlineUsers,
    addMessage,
    markMessagesAsRead,
    addGroupMessage,
    setUserTyping,
  } = useChatStore();

  const SERVER_URL = import.meta.env.VITE_SERVER_URL || "";

  useEffect(() => {
    if (authUser) {
      const newSocket = io(SERVER_URL || "/", {
        query: { userId: authUser._id },
      });

      const typingTimeouts = {};

      newSocket.on("getOnlineUsers", (users) => {
        setOnlineUsers(users);
      });

      // 1-to-1 messages
      newSocket.on("newMessage", (newMessage) => {
        addMessage(newMessage, authUser._id);
      });

      // Read receipts with real timestamp
      newSocket.on("messagesRead", ({ userId, readAt }) => {
        markMessagesAsRead(userId, readAt);
      });

      // Typing indicators with auto-cleanup timeout
      newSocket.on("userTyping", ({ senderId }) => {
        if (!senderId || senderId === authUser._id) return;
        setUserTyping(senderId, true);
        if (typingTimeouts[senderId]) clearTimeout(typingTimeouts[senderId]);
        typingTimeouts[senderId] = setTimeout(() => {
          setUserTyping(senderId, false);
          delete typingTimeouts[senderId];
        }, 3500);
      });

      newSocket.on("userStoppedTyping", ({ senderId }) => {
        if (!senderId || senderId === authUser._id) return;
        if (typingTimeouts[senderId]) {
          clearTimeout(typingTimeouts[senderId]);
          delete typingTimeouts[senderId];
        }
        setUserTyping(senderId, false);
      });

      // Group messages
      newSocket.on("groupMessage", (newMessage) => {
        addGroupMessage(newMessage, authUser._id);
      });

      setSocket(newSocket);

      return () => {
        Object.values(typingTimeouts).forEach(clearTimeout);
        newSocket.off("getOnlineUsers");
        newSocket.off("newMessage");
        newSocket.off("messagesRead");
        newSocket.off("userTyping");
        newSocket.off("userStoppedTyping");
        newSocket.off("groupMessage");
        newSocket.close();
      };
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
      }
    }
  }, [authUser]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
