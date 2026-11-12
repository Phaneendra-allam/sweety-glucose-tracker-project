
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";

import { ArrowLeft, CalendarDays, Activity } from "lucide-react";

import api from "../api";
import "../Doctor.css";
import "../DoctorPatientReport.css";

function getToday() {
  const now = new Date();

  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

function DoctorPatientReport({ onLogout }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [reportType, setReportType] = useState("daily");
  const [date, setDate] = useState(getToday());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const fetchReport = async () => {
      setLoading(true);
      setError("");

      const endpoints = {
        daily: "daily",
        "month-to-date": "month-to-date",
        monthly: "monthly"
      };

      try {
        const response = await api.get(
          `/doctor/patients/${id}/reports/${endpoints[reportType]}`,
          { params: { date } }
        );

        if (active) {
          setReport(response.data);
        }
      } catch (err) {
        if (active) {
          setReport(null);
          setError(
            err.response?.data?.message ||
            "Unable to load this patient's report."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchReport();

    return () => {
      active = false;
    };
  }, [id, reportType, date]);

  const readings = report?.readings || [];
  const summary = report?.summary || {};

  const chartData = readings.map((reading) => ({
    label:
      reportType === "daily"
        ? reading.time_slot
        : reading.reading_date,
    glucose: Number(reading.glucose_value)
  }));

  const patient = report?.patient;

  return (
    <div className="dashboard doctor-dashboard">
      <aside className="dashboard-sidebar">
        <div>
          <h2>Sweety</h2>
          <p>Doctor workspace</p>

          <div className="dashboard-nav">
            <button onClick={() => navigate("/doctor")}>
              My Patients
            </button>
          </div>
        </div>

        <button className="logout-btn" onClick={onLogout}>
          Logout
        </button>
      </aside>

      <main className="dashboard-main doctor-report-main">
        <button
          className="doctor-back-btn"
          onClick={() => navigate("/doctor")}
        >
          <ArrowLeft size={17} />
          Back to patients
        </button>

        <header className="doctor-report-header">
          <div>
            <p className="dashboard-eyebrow">
              PATIENT HEALTH REPORT
            </p>

            <h1>
              {patient ? patient.name : "Patient Report"}
            </h1>

            {patient && (
              <p className="dashboard-subtitle">
                {patient.email}
              </p>
            )}
          </div>

          <div className="doctor-report-date">
            <CalendarDays size={18} />
            <input
              type="date"
              value={date}
              max={getToday()}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </header>

        <section className="doctor-report-tabs">
          <button
            className={reportType === "daily" ? "active" : ""}
            onClick={() => setReportType("daily")}
          >
            Daily
          </button>

          <button
            className={
              reportType === "month-to-date" ? "active" : ""
            }
            onClick={() => setReportType("month-to-date")}
          >
            Month-to-Date
          </button>

          <button
            className={reportType === "monthly" ? "active" : ""}
            onClick={() => setReportType("monthly")}
          >
            Previous Month
          </button>
        </section>

        {loading ? (
          <div className="doctor-report-empty">
            Loading patient report...
          </div>
        ) : error ? (
          <div className="doctor-report-empty">
            <p>{error}</p>

            <button
              className="doctor-primary-btn"
              onClick={() => setDate(date)}
            >
              Retry
            </button>
          </div>
        ) : report ? (
          <>
            <div className="doctor-report-period">
              <span>{report.report_type}</span>
              <span>
                {report.start_date} to {report.end_date}
              </span>
            </div>

            <section className="doctor-report-stats">
              <div className="doctor-report-stat">
                <p>Highest reading</p>
                <h2>{summary.highest ?? "--"}</h2>
                <span>mg/dl</span>
              </div>

              <div className="doctor-report-stat">
                <p>Lowest reading</p>
                <h2>{summary.lowest ?? "--"}</h2>
                <span>mg/dl</span>
              </div>

              <div className="doctor-report-stat">
                <p>Average reading</p>
                <h2>{summary.average ?? "--"}</h2>
                <span>mg/dl</span>
              </div>

              <div className="doctor-report-stat">
                <p>Total readings</p>
                <h2>{summary.total_readings ?? 0}</h2>
                <span>Readings</span>
              </div>
            </section>

            <section className="doctor-report-card">
              <div className="doctor-report-card-heading">
                <div>
                  <h2>Glucose trend</h2>
                  <p>Recorded glucose values in mg/dl</p>
                </div>

                <Activity size={21} />
              </div>

              {chartData.length === 0 ? (
                <div className="doctor-report-empty">
                  No readings available for this period.
                </div>
              ) : (
                <div className="doctor-patient-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{
                        top: 15,
                        right: 20,
                        left: 0,
                        bottom: 40
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#e3e9e3"
                      />

                      <XAxis
                        dataKey="label"
                        angle={-20}
                        textAnchor="end"
                        interval={0}
                        tick={{
                          fill: "#777777",
                          fontSize: 11
                        }}
                      />

                      <YAxis
                        domain={["auto", "auto"]}
                        tick={{
                          fill: "#777777",
                          fontSize: 11
                        }}
                      />

                      <Tooltip />

                      <Line
                        type="monotone"
                        dataKey="glucose"
                        name="Glucose"
                        stroke="#214326"
                        strokeWidth={3}
                        dot={{
                          r: 5,
                          fill: "#9BC9A5"
                        }}
                        activeDot={{ r: 7 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>

            <section className="doctor-report-card">
              <h2>Patient readings</h2>

              {readings.length === 0 ? (
                <div className="doctor-report-empty">
                  No readings found for this period.
                </div>
              ) : (
                <div className="doctor-report-table-wrapper">
                  <table className="doctor-report-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Time slot</th>
                        <th>Glucose value</th>
                      </tr>
                    </thead>

                    <tbody>
                      {readings.map((reading) => (
                        <tr key={reading.id}>
                          <td>{reading.reading_date}</td>
                          <td>{reading.time_slot}</td>
                          <td>
                            <strong>
                              {reading.glucose_value} mg/dl
                            </strong>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        ) : (
          <div className="doctor-report-empty">
            No report available.
          </div>
        )}
      </main>
    </div>
  );
}

export default DoctorPatientReport;
