import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../utils/axios";

const useLogout = () => {
  const [loading, setLoading] = useState(false);
  const { setAuthUser } = useAuth();
  const navigate = useNavigate();

  const logout = async () => {
    setLoading(true);
    try {
      await axiosInstance.post("/auth/logout");
      setAuthUser(null);
      toast.success("Logged out successfully.");
      navigate("/login");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Logout failed.");
    } finally {
      setLoading(false);
    }
  };

  return { logout, loading };
};

export default useLogout;
