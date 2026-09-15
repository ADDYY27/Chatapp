import { useState } from "react";
import toast from "react-hot-toast";
import axiosInstance from "../utils/axios";
import useChatStore from "../store/useChatStore";

const useSendMessage = (selectedUserId) => {
  const [sending, setSending] = useState(false);

  const {
    messages,
    setMessages,
    addChatter,
    selectedUser,
  } = useChatStore();

  const sendMessage = async (messageText) => {
    if (!messageText.trim() || !selectedUserId) return;

    setSending(true);

    try {
      const { data } = await axiosInstance.post(
        `/message/send/${selectedUserId}`,
        {
          messages: messageText,
        }
      );

      setMessages([...messages, data]);

      // Immediately add this user to Recent Chats
      if (selectedUser) {
        addChatter(selectedUser);
      }

    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to send message."
      );
    } finally {
      setSending(false);
    }
  };

  return { sendMessage, sending };
};

export default useSendMessage;