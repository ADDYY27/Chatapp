import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
    const [authUser, setAuthUserState] = useState(
        JSON.parse(localStorage.getItem('chatapp-user')) || null
    )

    useEffect(() => {
        const handleSessionExpired = () => {
            setAuthUserState(null);
        };
        window.addEventListener("auth-session-expired", handleSessionExpired);
        return () => window.removeEventListener("auth-session-expired", handleSessionExpired);
    }, []);

    const setAuthUser = (user) => {
        if (user) localStorage.setItem('chatapp-user', JSON.stringify(user))
        else localStorage.removeItem('chatapp-user')
        setAuthUserState(user)
    }

    return (
        <AuthContext.Provider value={{ authUser, setAuthUser }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
