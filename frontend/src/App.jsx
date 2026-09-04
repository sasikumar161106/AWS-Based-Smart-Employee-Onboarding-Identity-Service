import { useState, useEffect } from "react";
import { BrowserRouter, Navigate, NavLink, Route, Routes, useNavigate } from "react-router-dom";
import {
  Clock3,
  Files,
  LayoutDashboard,
  LogIn,
  LogOut,
  UserCheck,
  UserPlus,
} from "lucide-react";
import OnboardingPage from "./pages/OnboardingPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import EmployeeProgressPage from "./pages/EmployeeProgressPage";
import DocumentUploadPage from "./pages/DocumentUploadPage";
import LoginPage from "./pages/LoginPage";
import { getCurrentAuthUser, signOutCognito } from "./services/auth";
import "./App.css";

function Navigation({ user, onSignOut }) {
  return (
    <nav className="app-navigation">
      <NavLink className="navigation-brand" to="/">
        <span>EO</span>

        <div>
          <strong>Employee Onboarding</strong>
          <small>Identity Service</small>
        </div>
      </NavLink>

      <div className="navigation-links">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `navigation-link ${isActive ? "active" : ""}`
          }
          end
        >
          <UserPlus size={17} />
          New Hire Portal
        </NavLink>

        <NavLink
          to="/documents"
          className={({ isActive }) =>
            `navigation-link ${isActive ? "active" : ""}`
          }
        >
          <Files size={17} />
          Documents
        </NavLink>

        <NavLink
          to="/progress"
          className={({ isActive }) =>
            `navigation-link ${isActive ? "active" : ""}`
          }
        >
          <Clock3 size={17} />
          Track Progress
        </NavLink>

        <NavLink
          to="/admin"
          className={({ isActive }) =>
            `navigation-link ${isActive ? "active" : ""}`
          }
        >
          <LayoutDashboard size={17} />
          HR Dashboard
        </NavLink>

        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginLeft: "12px" }}>
            <span
              style={{
                fontSize: "0.82rem",
                fontWeight: "600",
                color: "var(--primary)",
                background: "rgba(37, 99, 235, 0.1)",
                padding: "4px 10px",
                borderRadius: "20px",
                display: "flex",
                alignItems: "center",
                gap: "5px"
              }}
            >
              <UserCheck size={14} />
              {user.name || user.email} ({user.role})
            </span>
            <button
              type="button"
              onClick={onSignOut}
              style={{
                background: "none",
                border: "none",
                color: "var(--muted)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "0.85rem",
                padding: "4px 8px"
              }}
              title="Sign Out of Cognito"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        ) : (
          <NavLink
            to="/login"
            className={({ isActive }) =>
              `navigation-link ${isActive ? "active" : ""}`
            }
            style={{
              marginLeft: "12px",
              background: "var(--primary)",
              color: "white",
              padding: "6px 14px",
              borderRadius: "8px"
            }}
          >
            <LogIn size={16} />
            Sign In
          </NavLink>
        )}
      </div>
    </nav>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setUser(getCurrentAuthUser());
  }, []);

  const handleSignOut = () => {
    signOutCognito();
    setUser(null);
    navigate("/login");
  };

  return (
    <>
      <Navigation user={user} onSignOut={handleSignOut} />

      <Routes>
        <Route path="/" element={<OnboardingPage />} />
        <Route path="/login" element={<LoginPage onLoginSuccess={(u) => setUser(u)} />} />
        <Route path="/documents" element={<DocumentUploadPage />} />
        <Route path="/progress" element={<EmployeeProgressPage />} />
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function AppRouter() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}

export default AppRouter;