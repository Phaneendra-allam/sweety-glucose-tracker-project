
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  UsersRound,
  Activity,
  CalendarDays,
  ChevronRight,
  RefreshCw
} from "lucide-react";

import api from "../api";
import "../Dashboard.css";
import "../Doctor.css";

function formatDate(value) {
  if (!value) return "No readings yet";

  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function DoctorDashboard({ onLogout }) {
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const doctor = JSON.parse(localStorage.getItem("user") || "{}");

  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/doctor/patients");

      setPatients(response.data.patients || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to load your assigned patients."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  fetchPatients();

  const refreshInterval = setInterval(() => {
    fetchPatients();
  }, 10000);

  return () => {
    clearInterval(refreshInterval);
  };
}, []);

  const filteredPatients = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return patients;

    return patients.filter((patient) =>
      patient.name.toLowerCase().includes(query) ||
      patient.email.toLowerCase().includes(query)
    );
  }, [patients, search]);

  const totalReadings = patients.reduce(
    (sum, patient) => sum + Number(patient.total_readings || 0),
    0
  );

  return (
    <div className="dashboard doctor-dashboard">
      <aside className="dashboard-sidebar">
        <div>
          <h2>Sweety</h2>
          <p>Doctor workspace</p>

          <div className="dashboard-nav">
            <button
              className="dashboard-nav-active"
              onClick={() => navigate("/doctor")}
            >
              Overview
            </button>
          </div>
        </div>

        <button className="logout-btn" onClick={onLogout}>
          Logout
        </button>
      </aside>

      <main className="dashboard-main doctor-main">
        <header className="doctor-header">
          <div>
            <p className="dashboard-eyebrow">
              DOCTOR WORKSPACE
            </p>

            <h1>Welcome, {doctor.name || "Doctor"}</h1>

            <p className="dashboard-subtitle">
              Monitor patient glucose levels
            </p>
          </div>

          <div className="doctor-profile">
            <div className="doctor-avatar">
              {doctor.name?.charAt(0)?.toUpperCase() || "D"}
            </div>

            <div>
              <strong>{doctor.name || "Doctor"}</strong>
              <span>Doctor account</span>
            </div>
          </div>
        </header>

        <section className="doctor-stats">
          <div className="doctor-stat-card">
            <div className="doctor-stat-icon">
              <UsersRound size={21} />
            </div>

            <div>
              <p>Assigned patients</p>
              <h2>{patients.length}</h2>
            </div>
          </div>

          <div className="doctor-stat-card">
            <div className="doctor-stat-icon">
              <Activity size={21} />
            </div>

            <div>
              <p>Total recorded readings</p>
              <h2>{totalReadings}</h2>
            </div>
          </div>

          <div className="doctor-stat-card">
            <div className="doctor-stat-icon">
              <CalendarDays size={21} />
            </div>

            <div>
              <p>Patient reports</p>
              <h2>{patients.filter(
                (patient) => Number(patient.total_readings) > 0
              ).length}</h2>
            </div>
          </div>
        </section>

        <section className="doctor-patients-card">
          <div className="doctor-patients-heading">
            <div>
              <h2>My Patients</h2>
              <p>Patients assigned to your account</p>
            </div>

            <button
              className="doctor-refresh-btn"
              onClick={fetchPatients}
              disabled={loading}
            >
              <RefreshCw size={15} />
              Refresh
            </button>
          </div>

          <div className="doctor-search">
            <Search size={18} />

            <input
              type="search"
              placeholder="Search patient name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="doctor-empty">
              Loading assigned patients...
            </div>
          ) : error ? (
            <div className="doctor-empty">
              <p>{error}</p>

              <button
                className="doctor-primary-btn"
                onClick={fetchPatients}
              >
                Try again
              </button>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="doctor-empty">
              <UsersRound size={35} />

              <h3>
                {patients.length === 0
                  ? "No patients assigned yet"
                  : "No matching patients"}
              </h3>

              <p>
                {patients.length === 0
                  ? "Assigned patients will appear here."
                  : "Try searching with another name or email."}
              </p>
            </div>
          ) : (
            <div className="doctor-table-wrapper">
              <table className="doctor-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Latest reading</th>
                    <th>7-day average</th>
                    <th>Total readings</th>
                    <th>Last recorded</th>
                    <th>Report</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredPatients.map((patient) => (
                    <tr key={patient.id}>
                      <td>
                        <div className="doctor-patient-name">
                          <div className="patient-avatar">
                            {patient.name.charAt(0).toUpperCase()}
                          </div>

                          <div>
                            <strong>{patient.name}</strong>
                            <span>{patient.email}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        {patient.latest_glucose === null
                          ? "--"
                          : `${patient.latest_glucose} mg/dl`}
                      </td>

                      <td>
                        {patient.avg_glucose_7_days === null
                          ? "--"
                          : `${patient.avg_glucose_7_days} mg/dl`}
                      </td>

                      <td>{patient.total_readings}</td>

                      <td>
                        {formatDate(patient.latest_reading_date)}
                      </td>

                      <td>
                        <button
                          className="doctor-view-btn"
                          onClick={() =>
                            navigate(`/doctor/patients/${patient.id}`)
                          }
                        >
                          View report
                          <ChevronRight size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default DoctorDashboard;
