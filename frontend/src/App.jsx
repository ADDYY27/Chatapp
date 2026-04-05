import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import { useAuth } from './context/AuthContext'

function App() {
  const { authUser } = useAuth()

  return (
    <Routes>
      <Route path='/' element={authUser ? <Home /> : <Navigate to='/login' />} />
      <Route path='/login' element={!authUser ? <Login /> : <Navigate to='/' />} />
      <Route path='/register' element={!authUser ? <Register /> : <Navigate to='/' />} />
    </Routes>
  )
}

export default App