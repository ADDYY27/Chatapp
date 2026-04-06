

import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import useChatStore from "../store/useChatStore";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { authUser } = useAuth();
  const { setOnlineUsers } = useChatStore();

  useEffect(() => {
    if (authUser) {
     const newSocket = io(import.meta.env.VITE_SERVER_URL, {
        query: { userId: authUser._id },
      });

      newSocket.on("getOnlineUsers", (users) => {
        setOnlineUsers(users);
      });

      // always runs, no matter which chat is open
      newSocket.on("newMessage", (newMessage) => {
        const { selectedUser } = useChatStore.getState();
        const senderId = newMessage.senderId?.toString();
        const selectedId = selectedUser?._id?.toString();

       
        if (senderId !== selectedId) {
          useChatStore.setState((s) => ({
            unreadCounts: {
              ...s.unreadCounts,
              [senderId]: (s.unreadCounts[senderId] || 0) + 1,
            },
          }));
        }
      });

      setSocket(newSocket);
      return () => newSocket.close();
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
