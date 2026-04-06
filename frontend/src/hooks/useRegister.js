import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../utils/axios";

const useRegister = () => {
  const [loading, setLoading] = useState(false);
  const { setAuthUser } = useAuth();
  const navigate = useNavigate();

  const register = async ({ fullname, username, email, password, confirmPassword, gender }) => {
    setLoading(true);

    if (password !== confirmPassword) {
      setLoading(false);
      toast.error("Passwords do not match.");
      return;
    }

    try {
      const { data } = await axiosInstance.post("/auth/register", {
        fullname,   // lowercase n  matches backend
        username,
        email,      //  backend needs this too
        password,
        gender,
      });
      setAuthUser(data);
      toast.success(`Account created! Welcome, ${data.fullname}!`);
      navigate("/");
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.response?.data?.message || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return { register, loading };
};

export default useRegister;
