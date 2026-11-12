
import { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate
} from "react-router-dom";

import "./App.css";
import api from "./api";
import Dashboard from "./Dashboard";
import HistoryPage from "./pages/HistoryPage";
import ReportsPage from "./pages/ReportsPage";

function LoginPage({ onLogin }) {
  const [page, setPage] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const endpoint =
        page === "login" ? "/auth/login" : "/auth/register";

      const data =
        page === "login"
          ? { email, password }
          : { name, email, password };

      const response = await api.post(endpoint, data);

      localStorage.setItem("token", response.data.token);
      localStorage.setItem(
        "user",
        JSON.stringify(response.data.user)
      );

      onLogin();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div>
          <h2 className="brand">Sweety</h2>
          <p className="tagline">Your health companion</p>

          <nav className="sidebar-nav">
            <button
              className={page === "login" ? "nav-active" : ""}
              onClick={() => {
                setPage("login");
                setMessage("");
              }}
            >
              Login
            </button>

            <button
              className={page === "register" ? "nav-active" : ""}
              onClick={() => {
                setPage("register");
                setMessage("");
              }}
            >
              Create account
            </button>
          </nav>
        </div>

        <div className="sidebar-bottom">
          <span>Track better.</span>
          <span>Live healthier.</span>
        </div>
      </aside>

      <main className="main">
        <div className="auth-card">
          <div className="brand-mark">S</div>

          {page === "login" ? (
            <>
              <p className="eyebrow">WELCOME BACK</p>
              <h1>Login to Sweety</h1>
              <p className="description">
                Your daily health journey starts here.
              </p>

              <form onSubmit={handleAuth}>
                <div className="form-group">
                  <label>Email address</label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="submit-btn"
                  disabled={loading}
                >
                  {loading ? "Please wait..." : "Login to your account"}
                </button>
              </form>

              <p className="switch">
                Don't have an account?{" "}
                <span onClick={() => {
                  setPage("register");
                  setMessage("");
                }}>
                  Sign up
                </span>
              </p>
            </>
          ) : (
            <>
              <p className="eyebrow">GET STARTED</p>
              <h1>Create your account</h1>
              <p className="description">
                Start keeping track of your glucose levels.
              </p>

              <form onSubmit={handleAuth}>
                <div className="form-group">
                  <label>Full name</label>
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email address</label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    placeholder="Minimum 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={8}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="submit-btn"
                  disabled={loading}
                >
                  {loading ? "Please wait..." : "Create account"}
                </button>
              </form>

              <p className="switch">
                Already have an account?{" "}
                <span onClick={() => {
                  setPage("login");
                  setMessage("");
                }}>
                  Login
                </span>
              </p>
            </>
          )}

          {message && (
            <p className="auth-message">{message}</p>
          )}
        </div>
      </main>
    </div>
  );
}

function ProtectedRoute({ authenticated, children }) {
  if (!authenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AppRoutes() {
  const [authenticated, setAuthenticated] = useState(
    Boolean(localStorage.getItem("token"))
  );

  const navigate = useNavigate();

  const handleLogin = () => {
    setAuthenticated(true);
    navigate("/dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setAuthenticated(false);
    navigate("/", { replace: true });
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          authenticated
            ? <Navigate to="/dashboard" replace />
            : <LoginPage onLogin={handleLogin} />
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute authenticated={authenticated}>
            <Dashboard onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/history"
        element={
          <ProtectedRoute authenticated={authenticated}>
            <HistoryPage onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/reports"
        element={
          <ProtectedRoute authenticated={authenticated}>
            <ReportsPage onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
