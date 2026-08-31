import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  Clock3,
  FileCheck2,
  FileText,
  Search,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";
import { getEmployeeProgress } from "../services/api";

const workflowStages = [
  {
    key: "DocumentCollection",
    title: "Document Collection",
    description: "ID proof, degree certificate and offer letter",
    icon: FileCheck2,
  },
  {
    key: "ITProvisioning",
    title: "IT Provisioning",
    description: "Company account and equipment preparation",
    icon: ShieldCheck,
  },
  {
    key: "PolicySignOff",
    title: "Policy Sign-off",
    description: "Review and acknowledge company policies",
    icon: FileText,
  },
  {
    key: "ManagerIntro",
    title: "Manager Introduction",
    description: "Manager connection and Day 1 readiness",
    icon: UserRoundCheck,
  },
];

const requiredDocuments = [
  {
    key: "ID_PROOF",
    title: "Identity Proof",
  },
  {
    key: "DEGREE",
    title: "Degree Certificate",
  },
  {
    key: "OFFER_LETTER",
    title: "Signed Offer Letter",
  },
];

function normalizeStatus(status) {
  return String(status || "PENDING").toUpperCase();
}

function getStatusDetails(status) {
  const normalizedStatus = normalizeStatus(status);

  if (normalizedStatus === "COMPLETE") {
    return {
      label: "Complete",
      className: "complete",
      Icon: CheckCircle2,
    };
  }

  if (normalizedStatus === "IN_PROGRESS") {
    return {
      label: "In Progress",
      className: "in-progress",
      Icon: Clock3,
    };
  }

  return {
    label: "Pending",
    className: "pending",
    Icon: Circle,
  };
}

function EmployeeProgressPage() {
  const [employeeId, setEmployeeId] = useState(
  () => localStorage.getItem("employee_id") || ""
);
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadProgress = async (event) => {
    event.preventDefault();

    if (!employeeId.trim()) {
      setError("Please enter a valid Employee ID.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await getEmployeeProgress(employeeId.trim());
      setProgressData(response);
    } catch (requestError) {
      setProgressData(null);
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const completedStages = workflowStages.filter((stage) => {
    const stageData = progressData?.stages?.[stage.key];
    return normalizeStatus(stageData?.status) === "COMPLETE";
  }).length;

  const completionPercentage = Math.round(
    (completedStages / workflowStages.length) * 100
  );

  return (
    <main className="progress-page">
      <header className="progress-header">
        <p className="eyebrow">Employee workspace</p>
        <h1>Track your onboarding</h1>
        <p>
          Enter the Employee ID generated during registration to view the
          current onboarding stages and document status.
        </p>

        <form className="progress-search" onSubmit={loadProgress}>
          <Search size={19} />

          <input
            type="text"
            value={employeeId}
            onChange={(event) => setEmployeeId(event.target.value)}
            placeholder="Enter Employee ID"
          />

          <button
            className="primary-button"
            type="submit"
            disabled={loading}
          >
            {loading ? "Loading..." : "View progress"}
          </button>
        </form>

        {error && (
          <div className="progress-error">
            <AlertCircle size={19} />
            <span>{error}</span>
          </div>
        )}
      </header>

      {!progressData ? (
        <section className="progress-empty">
          <div className="progress-empty-icon">
            <Clock3 size={34} />
          </div>

          <h2>Your onboarding journey will appear here</h2>
          <p>
            Submit the New Hire form first and use the generated Employee ID
            to track each onboarding stage.
          </p>
        </section>
      ) : (
        <div className="progress-content">
          <section className="employee-summary">
            <div className="employee-summary-main">
              <div className="large-avatar">
                {progressData.profile?.full_name
                  ?.split(" ")
                  .map((name) => name[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase() || "NH"}
              </div>

              <div>
                <p className="eyebrow">Employee profile</p>
                <h2>{progressData.profile?.full_name}</h2>
                <span>{progressData.profile?.email}</span>
              </div>
            </div>

            <div className="employee-summary-details">
              <div>
                <span>Department</span>
                <strong>
                  {progressData.profile?.department || "Not assigned"}
                </strong>
              </div>

              <div>
                <span>Role</span>
                <strong>{progressData.profile?.role || "Not assigned"}</strong>
              </div>

              <div>
                <span>Overall progress</span>
                <strong>{completionPercentage}%</strong>
              </div>
            </div>
          </section>

          <section className="overall-progress-card">
            <div className="overall-progress-heading">
              <div>
                <h2>Onboarding progress</h2>
                <p>
                  {completedStages} of {workflowStages.length} stages completed
                </p>
              </div>

              <strong>{completionPercentage}%</strong>
            </div>

            <div className="progress-track">
              <span style={{ width: `${completionPercentage}%` }} />
            </div>
          </section>

          <div className="progress-grid">
            <section className="workflow-panel">
              <div className="section-title">
                <h2>Onboarding stages</h2>
                <p>Complete each stage to become Day 1 ready.</p>
              </div>

              <div className="stage-list">
                {workflowStages.map((stage, index) => {
                  const stageData = progressData.stages?.[stage.key];
                  const status = getStatusDetails(stageData?.status);
                  const StageIcon = stage.icon;

                  return (
                    <article
                      className={`stage-card ${status.className}`}
                      key={stage.key}
                    >
                      <div className="stage-number">{index + 1}</div>

                      <div className="stage-main-icon">
                        <StageIcon size={20} />
                      </div>

                      <div className="stage-copy">
                        <h3>{stage.title}</h3>
                        <p>{stage.description}</p>
                      </div>

                      <div className={`stage-status ${status.className}`}>
                        <status.Icon size={15} />
                        {status.label}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="document-panel">
              <div className="section-title">
                <h2>Required documents</h2>
                <p>Documents submitted during onboarding.</p>
              </div>

              <div className="document-list">
                {requiredDocuments.map((document) => {
                  const documentData =
                    progressData.documents?.[document.key];

                  const isUploaded = Boolean(documentData);
                  const isVerified =
                    documentData?.verified === true ||
                    normalizeStatus(documentData?.status) === "COMPLETE";

                  return (
                    <article className="document-status-card" key={document.key}>
                      <div className="document-icon">
                        <FileText size={20} />
                      </div>

                      <div>
                        <h3>{document.title}</h3>
                        <p>
                          {isVerified
                            ? "Uploaded and verified"
                            : isUploaded
                              ? "Uploaded, verification pending"
                              : "Not uploaded"}
                        </p>
                      </div>

                      {isVerified ? (
                        <CheckCircle2
                          className="document-complete"
                          size={20}
                        />
                      ) : (
                        <Circle size={20} />
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      )}
    </main>
  );
}

export default EmployeeProgressPage;