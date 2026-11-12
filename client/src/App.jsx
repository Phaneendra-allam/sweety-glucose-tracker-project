
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
import DoctorDashboard from "./pages/DoctorDashboard";
import DoctorPatientReport from "./pages/DoctorPatientReport";

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function getHomePath(user) {
  return user?.role === "doctor" ? "/doctor" : "/dashboard";
}

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

      onLogin(response.data.user);
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
          <p className="tagline">Smart Health Tracker</p>

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
          <span>Track better</span>
          <span>Wellness Balance Healthful</span>
        </div>
      </aside>

      <main className="main">
        <div className="auth-card">

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

function ProtectedRoute({
  authenticated,
  user,
  requiredRole,
  children
}) {
  if (!authenticated) {
    return <Navigate to="/" replace />;
  }

  const actualRole = user?.role || "patient";

  if (actualRole !== requiredRole) {
    return <Navigate to={getHomePath(user)} replace />;
  }

  return children;
}

function AppRoutes() {
  const [authenticated, setAuthenticated] = useState(
    Boolean(localStorage.getItem("token"))
  );

  const [user, setUser] = useState(getStoredUser);

  const navigate = useNavigate();

  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);
    setAuthenticated(true);

    navigate(getHomePath(loggedInUser), {
      replace: true
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
    setAuthenticated(false);

    navigate("/", { replace: true });
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          authenticated
            ? <Navigate to={getHomePath(user)} replace />
            : <LoginPage onLogin={handleLogin} />
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute
            authenticated={authenticated}
            user={user}
            requiredRole="patient"
          >
            <Dashboard onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/history"
        element={
          <ProtectedRoute
            authenticated={authenticated}
            user={user}
            requiredRole="patient"
          >
            <HistoryPage onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/reports"
        element={
          <ProtectedRoute
            authenticated={authenticated}
            user={user}
            requiredRole="patient"
          >
            <ReportsPage onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/doctor"
        element={
          <ProtectedRoute
            authenticated={authenticated}
            user={user}
            requiredRole="doctor"
          >
            <DoctorDashboard onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/doctor/patients/:id"
        element={
          <ProtectedRoute
            authenticated={authenticated}
            user={user}
            requiredRole="doctor"
          >
            <DoctorPatientReport onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />

      <Route
        path="*"
        element={
          <Navigate
            to={authenticated ? getHomePath(user) : "/"}
            replace
          />
        }
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
