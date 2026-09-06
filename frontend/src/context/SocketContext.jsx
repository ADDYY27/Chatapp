

import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import useChatStore from "../store/useChatStore";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { authUser } = useAuth();
const { setOnlineUsers, addMessage } = useChatStore();
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
    addMessage(newMessage, authUser._id);
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
