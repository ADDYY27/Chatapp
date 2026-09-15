import { useState } from "react";
import axiosInstance from "../utils/axios";
import useChatStore from "../store/useChatStore";

const useSendGroupMessage = (groupId) => {
  const [sending, setSending] = useState(false);

  const { addGroupMessage } = useChatStore();

  const sendGroupMessage = async (message) => {
    if (!groupId || !message?.trim()) return;

    try {
      setSending(true);

      const response = await axiosInstance.post(
        `/group/${groupId}/messages`,
        {
          message: message.trim(),
        }
      );

      if (response.data.success) {
        addGroupMessage(response.data.message);
      }

    } catch (error) {
      console.log(
        "Error sending group message:",
        error
      );
    } finally {
      setSending(false);
    }
  };

  return {
    sendGroupMessage,
    sending,
  };
};

export default useSendGroupMessage;