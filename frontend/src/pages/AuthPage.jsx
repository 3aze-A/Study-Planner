import {useContext, useState} from "react"
import {AuthContext} from "../services/AuthContext"
import "/Users/macblu/Downloads/VS Code Projects/Full-Stack Study Planner/frontend/src/AuthPage.css"

function AuthPage() {
    const { login, register } = useContext(AuthContext)
    const [isRegisterActive, setIsRegisterActive] = useState(false);
    // const [isLogin, setIsLogin] = useState(true)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState(null)

    const handleSubmit = async (event) => {
        event.preventDefault()
        setError(null)
        try {
            if (isRegisterActive) {
                await register(email, password)
            } else {
                await login(email, password)
            }
        } catch (err) {
            setError(err.message)
        }
    }


    return (

        <div className="auth-page">
      <h1 className="auth-title">Study Planner</h1>

      {/* Main Container for split screen & rotation animation */}
      <div className={`wrapper ${isRegisterActive ? "active" : ""}`}>
        {/* Animated Rotating Background Slices */}
        <span className="bg-animate"></span>
        <span className="bg-animate2"></span>

        {/* ════════════════ LOGIN FORM ════════════════ */}
        <div className="form-box login">
          <h2 className="animation">Login</h2>
          <form onSubmit={handleSubmit}>
            <div className="input-box animation">
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <label>Email</label>
              <i className="bx bxs-envelope"></i>
            </div>

            <div className="input-box animation">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <label>Password</label>
              <i className="bx bxs-lock-alt"></i>
            </div>

            {/* Scenario 1: Login (Button 2 Animation) */}
            <div className="animation">
              <button type="submit" className="btn-submit btn-2-style">
                Login
              </button>
            </div>

            <div className="logreg-link animation">
              <p>
                Don't have an account?{" "}
                <a
                  href="#"
                  className="register-link"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsRegisterActive(true);
                  }}
                >
                  Sign Up
                </a>
              </p>
            </div>
          </form>
        </div>

        {/* ════════════════ LOGIN INFO TEXT ════════════════ */}
        <div className="info-text login">
          <h2 className="animation">WELCOME BACK!</h2>
          <p className="animation">
            Organize your tasks, track your study schedule, and stay on top of your goals.
          </p>
        </div>

        {/* ════════════════ REGISTER FORM ════════════════ */}
        <div className="form-box register">
          <h2 className="animation">Register</h2>
          <form onSubmit={handleSubmit}>
            <div className="input-box animation">
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <label>Email</label>
              <i className="bx bxs-envelope"></i>
            </div>

            <div className="input-box animation">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <label>Password</label>
              <i className="bx bxs-lock-alt"></i>
            </div>

            {/* Scenario 2: Register (Button 1 Animation) */}
            <div className="animation">
              <button type="submit" className="btn-submit btn-1-style">
                <div className="original">Register</div>
                <div className="letters">
                  {"Register".split("").map((char, index) => (
                    <span key={index} style={{ transitionDelay: `${index * 0.05}s` }}>
                      {char}
                    </span>
                  ))}
                </div>
              </button>
            </div>

            <div className="logreg-link animation">
              <p>
                Already have an account?{" "}
                <a
                  href="#"
                  className="login-link"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsRegisterActive(false);
                  }}
                >
                  Sign In
                </a>
              </p>
            </div>
          </form>
        </div>

        {/* ════════════════ REGISTER INFO TEXT ════════════════ */}
        <div className="info-text register">
          <h2 className="animation">WELCOME BACK!</h2>
          <p className="animation">
            Create an account to start managing your daily study workflow efficiently.
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && <div className="error-message">{error}</div>}
    </div>

    )
}

export default AuthPage





{/* <div className="auth-page">
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
*/}
              
        //         {isLogin ? (
        //         /* Scenario 1: Login (Button 2 Animation) */
        //         <button type="submit" className="btn-submit btn-2-style">
        //             Login
        //         </button>
        //         ) : (
        //         /* Scenario 2: Register (Button 1 Animation) */
        //         <button type="submit" className="btn-submit btn-1-style">
        //             <div className="original">Register</div>
        //             <div className="letters">
        //             {"Register".split("").map((char, index) => (
        //                 <span key={index} style={{ transitionDelay: `${index * 0.05}s` }}>
        //                 {char}
        //                 </span>
        //             ))}
        //             </div>
        //         </button>
        //         )}

        //     </form>

        //     <button type="button" onClick={() => {setIsLogin(!isLogin)}}>
        //         {isLogin ? "Dont have an account? Sign-up" : "Log-in?"}
        //     </button>

        //     {/* ── Error ── */}
        //     {error && <div className="error-message">{error}</div>}

        // </div> 

