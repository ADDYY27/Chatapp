import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import axiosInstance from "../utils/axios";
import useChatStore from "../store/useChatStore";

const useGetMessages = (selectedUserId) => {
  const [loading, setLoading] = useState(false);
  const { setMessages } = useChatStore();

  useEffect(() => {
    if (!selectedUserId) return;

    let isCurrent = true;

    const fetchMessages = async () => {
      setLoading(true);
      try {
        const { data } = await axiosInstance.get(`/message/${selectedUserId}`);
        if (isCurrent) {
          setMessages(data);
        }
      } catch (err) {
        if (isCurrent) {
          toast.error(err?.response?.data?.message || "Failed to load messages.");
        }
      } finally {
        if (isCurrent) {
          setLoading(false);
        }
      }
    };

    fetchMessages();

    return () => {
      isCurrent = false;
    };
  }, [selectedUserId, setMessages]);

  return { loading };
};

export default useGetMessages;