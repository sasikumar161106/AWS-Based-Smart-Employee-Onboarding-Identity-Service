import { useState } from "react";
import { ArrowRight, KeyRound, Lock, LogIn, Mail, ShieldCheck, UserCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { signInCognito } from "../services/auth";

function LoginPage({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [clientId, setClientId] = useState(
    import.meta.env.VITE_COGNITO_CLIENT_ID || ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showConfig, setShowConfig] = useState(!import.meta.env.VITE_COGNITO_CLIENT_ID);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signInCognito(email, password, clientId);
      
      if (onLoginSuccess) {
        onLoginSuccess(result.user);
      }

      // Role-based routing
      if (result.user.role === "HRAdmin" || result.user.groups.includes("HRAdmins")) {
        navigate("/admin");
      } else {
        navigate("/progress");
      }
    } catch (err) {
      setError(err.message || "Failed to authenticate with Amazon Cognito");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="onboarding-page">
      <section className="onboarding-intro">
        <div className="brand-mark">EO</div>

        <div>
          <p className="eyebrow">Cognito Identity Provider</p>
          <h1>Secure Employee Portal</h1>
          <p className="intro-text">
            Log in with your company-provisioned credentials to access your onboarding checklist, upload documents, or view HR administration features.
          </p>
        </div>

        <div className="journey-card">
          <p>Role-based Access</p>
          
          <div className="journey-step active">
            <span><UserCheck size={18} /></span>
            <div>
              <strong>Employees Group</strong>
              <small>View progress bar, upload ID & degree certificates</small>
            </div>
          </div>

          <div className="journey-step">
            <span><ShieldCheck size={18} /></span>
            <div>
              <strong>HR Admins Group</strong>
              <small>View company-wide pipeline, approve documents & status</small>
            </div>
          </div>
        </div>
      </section>

      <section className="form-section">
        <div className="form-heading">
          <p className="eyebrow">Authentication</p>
          <h2>Sign In with Cognito</h2>
          <p>Enter your account credentials sent to your registered email.</p>
        </div>

        <form className="employee-form" onSubmit={handleLogin}>
          <label className="form-field full-width">
            <span>Work Email Address *</span>
            <div className="input-wrapper">
              <Mail size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
              />
            </div>
          </label>

          <label className="form-field full-width">
            <span>Cognito Password *</span>
            <div className="input-wrapper">
              <Lock size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
            </div>
          </label>

          {showConfig && (
            <label className="form-field full-width">
              <span>Cognito App Client ID (Optional Config)</span>
              <div className="input-wrapper">
                <KeyRound size={18} />
                <input
                  type="text"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="e.g. 7a8b9c0d1e2f..."
                />
              </div>
              <small style={{ marginTop: "4px", color: "var(--muted)", fontSize: "0.8rem" }}>
                Leave empty if set in VITE_COGNITO_CLIENT_ID in your .env file
              </small>
            </label>
          )}

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions full-width" style={{ marginTop: "16px" }}>
            <p>
              First time here?{" "}
              <a href="#/" style={{ color: "var(--primary)", fontWeight: "600" }}>
                Register as New Hire
              </a>
            </p>

            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? "Authenticating..." : "Sign In"}
              {!loading && <LogIn size={18} />}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

export default LoginPage;
