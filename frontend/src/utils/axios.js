// import { useState, useEffect } from 'react'
// import axiosInstance from '../utils/axios'  // ← custom instance import karo
// import toast from 'react-hot-toast'

// const useGetUsers = (search = '') => {
//     const [users, setUsers] = useState([])
//     const [loading, setLoading] = useState(false)

//     useEffect(() => {
//         const getUsers = async () => {
//             setLoading(true)
//             try {
//                 const res = await axiosInstance.get(`/user/search?search=${search}`)
//                 setUsers(res.data)
//             } catch (error) {
//                 toast.error(error.response?.data?.message || 'Error fetching users')
//             } finally {
//                 setLoading(false)
//             }
//         }
//         getUsers()
//     }, [search])

//     return { users, loading }
// }

// export default useGetUsers

import axios from "axios";

const axiosInstance = axios.create({
 baseURL: `${import.meta.env.VITE_SERVER_URL}/api`,
  withCredentials: true, // sends httpOnly cookies automatically
});

export default axiosInstance;