import { useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Mail,
  Phone,
  User,
  Users,
} from "lucide-react";
import { submitEmployee } from "../services/api";

const initialForm = {
  full_name: "",
  email: "",
  phone: "",
  department: "",
  role: "",
  manager_id: "",
  joining_date: "",
  employment_type: "FTE",
};

function OnboardingPage() {
  const [formData, setFormData] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [employeeId, setEmployeeId] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await submitEmployee(formData);
      setEmployeeId(response.employee_id);
      localStorage.setItem("employee_id", response.employee_id);
      setFormData(initialForm);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  if (employeeId) {
    return (
      <main className="success-page">
        <section className="success-card">
          <div className="success-icon">
            <CheckCircle2 size={42} />
          </div>

          <p className="eyebrow">Application submitted</p>
          <h1>Welcome aboard!</h1>

          <p className="success-message">
            Your employee profile has been created successfully. Save your
            Employee ID to track the onboarding journey.
          </p>

          <div className="employee-id-box">
            <span>Employee ID</span>
            <strong>{employeeId}</strong>
          </div>

         <div className="success-actions">
  <button
    className="secondary-button"
    type="button"
    onClick={() => setEmployeeId("")}
  >
    Add another employee
  </button>

  <button
    className="secondary-button"
    type="button"
    onClick={() => {
      window.location.hash = "/documents";
    }}
  >
    Upload documents
  </button>

  <button
    className="primary-button"
    type="button"
    onClick={() => {
      window.location.hash = "/progress";
    }}
  >
    Track progress
  </button>
</div>
        </section>
      </main>
    );
  }

  return (
    <main className="onboarding-page">
      <section className="onboarding-intro">
        <div className="brand-mark">EO</div>

        <div>
          <p className="eyebrow">Employee onboarding</p>
          <h1>Let&apos;s get you ready for Day 1</h1>
          <p className="intro-text">
            Complete your profile to begin the automated onboarding journey.
            Your account, documents and required approvals will be managed from
            one secure portal.
          </p>
        </div>

        <div className="journey-card">
          <p>Your onboarding journey</p>

          <div className="journey-step active">
            <span>1</span>
            <div>
              <strong>Employee profile</strong>
              <small>Personal and employment details</small>
            </div>
          </div>

          <div className="journey-step">
            <span>2</span>
            <div>
              <strong>Document collection</strong>
              <small>ID, degree and offer letter</small>
            </div>
          </div>

          <div className="journey-step">
            <span>3</span>
            <div>
              <strong>Company setup</strong>
              <small>IT, policies and manager intro</small>
            </div>
          </div>
        </div>
      </section>

      <section className="form-section">
        <div className="form-heading">
          <p className="eyebrow">Step 1 of 3</p>
          <h2>Employee information</h2>
          <p>Enter the details exactly as they appear in the offer letter.</p>
        </div>

        <form className="employee-form" onSubmit={handleSubmit}>
          <label className="form-field full-width">
            <span>Full name *</span>
            <div className="input-wrapper">
              <User size={18} />
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Enter employee name"
                required
              />
            </div>
          </label>

          <label className="form-field">
            <span>Email address *</span>
            <div className="input-wrapper">
              <Mail size={18} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="name@company.com"
                required
              />
            </div>
          </label>

          <label className="form-field">
            <span>Phone number</span>
            <div className="input-wrapper">
              <Phone size={18} />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
              />
            </div>
          </label>

          <label className="form-field">
            <span>Department *</span>
            <div className="input-wrapper">
              <Users size={18} />
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
              >
                <option value="">Select department</option>
                <option value="Engineering">Engineering</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Finance">Finance</option>
                <option value="Sales">Sales</option>
                <option value="Operations">Operations</option>
                <option value="Marketing">Marketing</option>
              </select>
            </div>
          </label>

          <label className="form-field">
            <span>Role *</span>
            <div className="input-wrapper">
              <BriefcaseBusiness size={18} />
              <input
                type="text"
                name="role"
                value={formData.role}
                onChange={handleChange}
                placeholder="Example: Cloud Engineer"
                required
              />
            </div>
          </label>

          <label className="form-field">
            <span>Manager ID</span>
            <div className="input-wrapper">
              <User size={18} />
              <input
                type="text"
                name="manager_id"
                value={formData.manager_id}
                onChange={handleChange}
                placeholder="Example: MGR-101"
              />
            </div>
          </label>

          <label className="form-field">
            <span>Joining date</span>
            <div className="input-wrapper">
              <CalendarDays size={18} />
              <input
                type="date"
                name="joining_date"
                value={formData.joining_date}
                onChange={handleChange}
              />
            </div>
          </label>

          <label className="form-field full-width">
            <span>Employment type</span>
            <div className="employment-options">
              {["FTE", "Intern", "Contract"].map((type) => (
                <label
                  className={`employment-option ${
                    formData.employment_type === type ? "selected" : ""
                  }`}
                  key={type}
                >
                  <input
                    type="radio"
                    name="employment_type"
                    value={type}
                    checked={formData.employment_type === type}
                    onChange={handleChange}
                  />
                  <span>{type === "FTE" ? "Full-time" : type}</span>
                </label>
              ))}
            </div>
          </label>

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions full-width">
            <p>
              By continuing, you confirm that the information provided is
              accurate.
            </p>

            <button
              className="primary-button"
              type="submit"
              disabled={loading}
            >
              {loading ? "Creating profile..." : "Continue onboarding"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

export default OnboardingPage;