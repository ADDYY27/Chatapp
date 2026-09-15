import { useEffect, useState } from "react";
import axiosInstance from "../utils/axios";
import useChatStore from "../store/useChatStore";

const useGetGroupMessages = (groupId) => {
  const [loading, setLoading] = useState(false);

  const { setMessages } = useChatStore();

  useEffect(() => {
    if (!groupId) return;

    const getGroupMessages = async () => {
      try {
        setLoading(true);

        const response = await axiosInstance.get(
          `/group/${groupId}/messages`
        );

        if (response.data.success) {
          setMessages(response.data.messages);
        }
      } catch (error) {
        console.log(
          "Error fetching group messages:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    getGroupMessages();
  }, [groupId, setMessages]);

  return { loading };
};

export default useGetGroupMessages;