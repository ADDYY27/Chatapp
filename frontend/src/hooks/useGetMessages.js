import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import axiosInstance from "../utils/axios";
import useChatStore from "../store/useChatStore";

const useGetMessages = (selectedUserId) => {
  const [loading, setLoading] = useState(false);
  const { setMessages } = useChatStore();

  useEffect(() => {
    if (!selectedUserId) return;

    const fetchMessages = async () => {
      setLoading(true);
      try {
        const { data } = await axiosInstance.get(`/message/${selectedUserId}`);
        setMessages(data);
      } catch (err) {
        toast.error(err?.response?.data?.message || "Failed to load messages.");
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [selectedUserId]);

  return { loading };
};

export default useGetMessages;