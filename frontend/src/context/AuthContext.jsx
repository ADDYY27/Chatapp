import { createContext, useContext, useState } from 'react'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
    const [authUser, setAuthUserState] = useState(
        JSON.parse(localStorage.getItem('chatapp-user')) || null
    )

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
