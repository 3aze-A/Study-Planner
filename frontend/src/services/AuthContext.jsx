import {useState, createContext, useEffect} from "react"
import {loginUser, registerUser} from "./api"


export const AuthContext = createContext()

function AuthProvider({ children }) {
    const [user, setUser] = useState(null) // holds { id, email, token }

    // Restore the login state on page refresh
    useEffect(() => {
        const storedUser = localStorage.getItem("user")
        if (storedUser && storedUser !== "undefined") {
            setUser(JSON.parse(storedUser))
        }
    }, [])

    const login = async (email, password) => {
        const userData = await loginUser(email, password)
        // userData is { id, email, token }
        // any error from loginUser is propagated to what called login() then it is displayed on the UI
        setUser(userData)
        // Save the token to localStorage so on refresh localStorage is checked
        // for a saved token and restore the logged-in state
        localStorage.setItem("user", JSON.stringify(userData))
        return userData
    }

    const logout = () => {
        setUser(null)
        localStorage.removeItem("user")
    }

    const register = async (email, password) => {
        await registerUser(email, password)
        // any error from registerUser is propagated to what called register() then it is displayed on the UI
        // error from login() is handled the same as explained for register().
        await login(email, password)
    }

    
  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, register}}>
        {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider