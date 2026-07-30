import {useContext, useState} from "react"
import {AuthContext} from "../services/AuthContext"
import "/Users/macblu/Downloads/VS Code Projects/Full-Stack Study Planner/frontend/src/AuthPage.css"

function AuthPage() {
    const { login, register } = useContext(AuthContext)
    const [isLogin, setIsLogin] = useState(true)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState(null)

    const handleSubmit = async (event) => {
        event.preventDefault()
        if (isLogin) {
            try {
                await login(email, password)
            } catch (err) {
                setError(err.message)
            }
        }
        else {
            try{
                await register(email, password)
            } catch (err) {
                setError(err.message)
            }
        }
    }

    return (
        <div className="auth-page">
            <h1 className="auth-title">
                Study Planner
            </h1>
            <form onSubmit={handleSubmit} className="login-form">
                <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="text"
                  value={email}
                  // Updates the state from an input element
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn-submit">{isLogin ? "Log-in" : "Register"}</button>
            </form>

            <button type="button" onClick={() => {setIsLogin(!isLogin)}}>
                {isLogin ? "Dont have an account? Sign-up" : "Log-in?"}
            </button>

            {/* ── Error ── */}
            {error && <div className="error-message">{error}</div>}

        </div>
    )
}

export default AuthPage