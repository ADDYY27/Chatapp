import { useEffect, useState } from "react";
import axiosInstance from "../utils/axios";
import toast from "react-hot-toast";
import useChatStore from "../store/useChatStore";

const useGetCurrentChatters = () => {
  const [loading, setLoading] = useState(false);
  const { chatters, setChatters } = useChatStore();

  useEffect(() => {
    const getCurrentChatters = async () => {
      setLoading(true);

      try {
        const res = await axiosInstance.get("/user/currentchatters");
        setChatters(res.data);
      } catch (error) {
        toast.error(
          error.response?.data?.message || "Error fetching conversations"
        );
      } finally {
        setLoading(false);
      }
    };

    getCurrentChatters();
  }, [setChatters]);

  return { chatters, loading };
};

export default useGetCurrentChatters;