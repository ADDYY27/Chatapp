// import { StrictMode } from 'react'
// import { createRoot } from 'react-dom/client'
// import { BrowserRouter } from 'react-router-dom'
// import { AuthProvider } from './context/AuthContext'
// import { Toaster } from 'react-hot-toast'
// import './index.css'
// import App from './App'

// createRoot(document.getElementById('root')).render(
//   <StrictMode>
//     <BrowserRouter>
//       <AuthProvider>
//         <App />
//         <Toaster />
//       </AuthProvider>
//     </BrowserRouter>
//   </StrictMode>
// )
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <App />
          <Toaster />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)
