import { useState } from "react";
import toast from "react-hot-toast";
import axiosInstance from "../utils/axios";
import useChatStore from "../store/useChatStore";

const useSendMessage = (selectedUserId) => {
  const [sending, setSending] = useState(false);

  const { addChatter, selectedUser } = useChatStore();

  const sendMessage = async (messageText) => {
    if (!messageText.trim() || !selectedUserId) return false;

    setSending(true);

    try {
      const { data } = await axiosInstance.post(
        `/message/send/${selectedUserId}`,
        {
          messages: messageText,
        }
      );

      const currentMessages = useChatStore.getState().messages;
      const alreadyPresent = currentMessages.some((m) => m._id === data._id);
      if (!alreadyPresent) {
        useChatStore.getState().setMessages([...currentMessages, data]);
      }

      // Immediately add this user to Recent Chats with their updated message
      if (selectedUser) {
        addChatter({
          ...selectedUser,
          lastMessage: data.message,
          lastMessageTime: data.createdAt,
        });
      }

      return true;

    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to send message."
      );
      return false;
    } finally {
      setSending(false);
    }
  };

  return { sendMessage, sending };
};

export default useSendMessage;