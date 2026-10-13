import { useState } from "react";
import toast from "react-hot-toast";
import axiosInstance from "../utils/axios";
import useChatStore from "../store/useChatStore";

const useSendMessage = (selectedUserId) => {
  const [sending, setSending] = useState(false);

  const { addChatter, selectedUser } = useChatStore();

  const sendMessage = async (messageText, options = {}) => {
    if ((!messageText || !messageText.trim()) && !options.audioUrl) return false;
    if (!selectedUserId) return false;

    setSending(true);

    try {
      const payload = {
        messages: messageText || "",
        audioUrl: options.audioUrl || null,
        audioDuration: options.audioDuration || 0,
        replyTo: options.replyTo || null,
        scheduledFor: options.scheduledFor || null,
      };

      const { data } = await axiosInstance.post(
        `/message/send/${selectedUserId}`,
        payload
      );

      if (!data.isScheduled) {
        const currentMessages = useChatStore.getState().messages;
        const alreadyPresent = currentMessages.some((m) => m._id === data._id);
        if (!alreadyPresent) {
          useChatStore.getState().setMessages([...currentMessages, data]);
        }

        if (selectedUser) {
          addChatter({
            ...selectedUser,
            lastMessage: data.message || (data.audioUrl ? "🎤 Voice message" : ""),
            lastMessageTime: data.createdAt,
          });
        }
      } else {
        toast.success(`Message scheduled for ${new Date(data.scheduledFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
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