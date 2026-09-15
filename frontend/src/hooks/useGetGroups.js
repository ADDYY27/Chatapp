import { useEffect, useState } from "react";
import axiosInstance from "../utils/axios";

const useGetGroups = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  const getGroups = async () => {
    try {
      setLoading(true);

      const response = await axiosInstance.get("/group/my-groups");

      if (response.data.success) {
        setGroups(response.data.groups);
      }
    } catch (error) {
      console.log("Error fetching groups:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getGroups();
  }, []);

  return {
    groups,
    loading,
    getGroups,
  };
};

export default useGetGroups;