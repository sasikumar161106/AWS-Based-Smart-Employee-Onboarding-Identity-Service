import { HashRouter, NavLink, Route, Routes } from "react-router-dom";
import {
  Clock3,
  Files,
  LayoutDashboard,
  UserPlus,
} from "lucide-react";
import OnboardingPage from "./pages/OnboardingPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import EmployeeProgressPage from "./pages/EmployeeProgressPage";
import DocumentUploadPage from "./pages/DocumentUploadPage";
import "./App.css";

function Navigation() {
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
      </div>
    </nav>
  );
}

function App() {
  return (
    <HashRouter>
      <Navigation />

      <Routes>
        <Route path="/" element={<OnboardingPage />} />
        <Route path="/documents" element={<DocumentUploadPage />} />
        <Route path="/progress" element={<EmployeeProgressPage />} />
        <Route path="/admin" element={<AdminDashboardPage />} />
      </Routes>
    </HashRouter>
  );
}

export default App;