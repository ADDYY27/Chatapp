

import axios from "axios";

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? "";

const axiosInstance = axios.create({
  baseURL: SERVER_URL ? `${SERVER_URL}/api` : "/api",
  withCredentials: true,
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      const url = error.config?.url || "";
      if (!url.includes("/auth/login") && !url.includes("/auth/register")) {
        const storedUser = localStorage.getItem("chatapp-user");
        if (storedUser) {
          localStorage.removeItem("chatapp-user");
          window.dispatchEvent(new Event("auth-session-expired"));
        }
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;