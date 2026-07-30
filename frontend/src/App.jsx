import './App.css'
import Home from "./pages/Home"
import AuthPage from "./pages/AuthPage"
import { useContext } from "react"
import AuthProvider, { AuthContext } from "./services/AuthContext"

// npm run dev

// @ts-check

// @ts-ignore


function App() {
  // Provider wraps around the consumer
  return (
    <AuthProvider>
        <AppContent />
    </AuthProvider>
  )
}


function AppContent() {
  const { user } = useContext(AuthContext)
  return (
    user ? <Home /> : <AuthPage />
  )
}

// function App() {
//   return (
//     <>
//       <Home />
//     </>
//   )
// }

export default App
