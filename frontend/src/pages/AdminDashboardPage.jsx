/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";
import { getAdminPipeline } from "../services/api";

const statusConfig = {
  PENDING: {
    label: "Pending",
    className: "status-pending",
  },
  IN_PROGRESS: {
    label: "In Progress",
    className: "status-progress",
  },
  COMPLETE: {
    label: "Complete",
    className: "status-complete",
  },
};

function formatDate(dateValue) {
  if (!dateValue) {
    return "Not assigned";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function AdminDashboardPage() {
  const [employees, setEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadEmployees = async () => {
    setLoading(true);
    setError("");

    try {
      const statuses = ["PENDING", "IN_PROGRESS", "COMPLETE"];

      const responses = await Promise.all(
        statuses.map((status) => getAdminPipeline(status))
      );

      const combinedEmployees = responses.flatMap((response) =>
        response.employees.map((employee) => ({
          ...employee,
          record_status:
            employee.record_status || statuses[responses.indexOf(response)],
        }))
      );

      const uniqueEmployees = Array.from(
        new Map(
          combinedEmployees.map((employee) => [
            employee.employee_id,
            employee,
          ])
        ).values()
      );

      setEmployees(uniqueEmployees);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

useEffect(() => {
  loadEmployees();
}, []);

  const filteredEmployees = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return employees.filter((employee) => {
      const matchesStatus =
        statusFilter === "ALL" || employee.record_status === statusFilter;

      const matchesSearch =
        !normalizedQuery ||
        employee.full_name?.toLowerCase().includes(normalizedQuery) ||
        employee.email?.toLowerCase().includes(normalizedQuery) ||
        employee.department?.toLowerCase().includes(normalizedQuery) ||
        employee.role?.toLowerCase().includes(normalizedQuery);

      return matchesStatus && matchesSearch;
    });
  }, [employees, searchQuery, statusFilter]);

  const counts = useMemo(
    () => ({
      total: employees.length,
      pending: employees.filter(
        (employee) => employee.record_status === "PENDING"
      ).length,
      inProgress: employees.filter(
        (employee) => employee.record_status === "IN_PROGRESS"
      ).length,
      complete: employees.filter(
        (employee) => employee.record_status === "COMPLETE"
      ).length,
    }),
    [employees]
  );

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <p className="eyebrow">HR workspace</p>
          <h1>Onboarding pipeline</h1>
          <p>
            Track new hires, joining dates and onboarding progress from one
            dashboard.
          </p>
        </div>

        <button
          className="secondary-button"
          type="button"
          onClick={loadEmployees}
          disabled={loading}
        >
          <RefreshCw size={17} className={loading ? "spin" : ""} />
          Refresh
        </button>
      </header>

      <section className="summary-grid">
        <article className="summary-card">
          <div className="summary-icon blue">
            <Users size={22} />
          </div>
          <div>
            <span>Total new hires</span>
            <strong>{counts.total}</strong>
          </div>
        </article>

        <article className="summary-card">
          <div className="summary-icon amber">
            <Clock3 size={22} />
          </div>
          <div>
            <span>Pending</span>
            <strong>{counts.pending}</strong>
          </div>
        </article>

        <article className="summary-card">
          <div className="summary-icon violet">
            <BriefcaseBusiness size={22} />
          </div>
          <div>
            <span>In progress</span>
            <strong>{counts.inProgress}</strong>
          </div>
        </article>

        <article className="summary-card">
          <div className="summary-icon green">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <span>Completed</span>
            <strong>{counts.complete}</strong>
          </div>
        </article>
      </section>

      <section className="pipeline-panel">
        <div className="pipeline-toolbar">
          <div>
            <h2>New hire pipeline</h2>
            <p>{filteredEmployees.length} employee records</p>
          </div>

          <div className="toolbar-controls">
            <label className="search-box">
              <Search size={17} />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search employees"
              />
            </label>

            <select
              className="status-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter employees by status"
            >
              <option value="ALL">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="COMPLETE">Complete</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="dashboard-error">
            <AlertCircle size={20} />
            <div>
              <strong>Unable to load employee pipeline</strong>
              <p>{error}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="dashboard-state">
            <RefreshCw className="spin" size={28} />
            <p>Loading employee pipeline...</p>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="dashboard-state">
            <Users size={34} />
            <h3>No employees found</h3>
            <p>
              New employee records will appear here after the onboarding form
              is submitted.
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="pipeline-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Role</th>
                  <th>Joining date</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredEmployees.map((employee) => {
                  const status =
                    statusConfig[employee.record_status] ||
                    statusConfig.PENDING;

                  return (
                    <tr key={employee.employee_id}>
                      <td>
                        <div className="employee-cell">
                          <div className="employee-avatar">
                            {employee.full_name
                              ?.split(" ")
                              .map((name) => name[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase() || "NH"}
                          </div>

                          <div>
                            <strong>{employee.full_name}</strong>
                            <span>{employee.email}</span>
                          </div>
                        </div>
                      </td>

                      <td>{employee.department}</td>
                      <td>{employee.role}</td>
                      <td>{formatDate(employee.joining_date)}</td>

                      <td>
                        <span
                          className={`status-badge ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

export default AdminDashboardPage;