import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../utils/axios";

const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const { setAuthUser } = useAuth();
  const navigate = useNavigate();

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.post("/auth/login", {
        email,
        password,
      });
      setAuthUser(data);
      toast.success(`Welcome back, ${data.fullname}!`);
      navigate("/");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Login failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return { login, loading };
};

export default useLogin;
