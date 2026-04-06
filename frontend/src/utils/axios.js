

import axios from "axios";

const axiosInstance = axios.create({
 baseURL: `${import.meta.env.VITE_SERVER_URL}/api`,
  withCredentials: true, // sends httpOnly cookie
});

export default axiosInstance;