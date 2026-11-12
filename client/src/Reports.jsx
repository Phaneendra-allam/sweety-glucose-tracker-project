
import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";

import api from "./api";
import "./Reports.css";

function Reports() {
  const [reportType, setReportType] = useState("daily");
  const [date, setDate] = useState(() => {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 10);
  });

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      setError("");

      const endpoints = {
        daily: "/reports/daily",
        "month-to-date": "/reports/month-to-date",
        monthly: "/reports/monthly"
      };

      try {
        const response = await api.get(endpoints[reportType], {
          params: { date }
        });

        setReport(response.data);
      } catch (err) {
        setReport(null);
        setError(
          err.response?.data?.message ||
          "Unable to load the report. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [reportType, date]);

  const readings = report?.readings || [];

  const chartData = readings.map((reading) => ({
    label:
      reportType === "daily"
        ? reading.time_slot
        : String(reading.reading_date).slice(0, 10),
    glucose: Number(reading.glucose_value)
  }));

  const summary = report?.summary || {};

  return (
    <section className="reports-section" id="reports">
      <div className="reports-header">
        <div>
          <p className="reports-eyebrow">ANALYTICS</p>
          <h2>Glucose Reports</h2>
          <p>Understand your glucose reading trends.</p>
        </div>

        <div className="reports-date">
          <label>Report date</label>
          <input
            type="date"
            value={date}
            max={new Date().toLocaleDateString("en-CA")}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>

      <div className="report-tabs">
        <button
          className={reportType === "daily" ? "active" : ""}
          onClick={() => setReportType("daily")}
        >
          Daily
        </button>

        <button
          className={reportType === "month-to-date" ? "active" : ""}
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
      </div>

      {loading ? (
        <div className="report-empty">Loading report...</div>
      ) : error ? (
        <div className="report-empty">{error}</div>
      ) : report ? (
        <>
          <div className="report-period">
            <span>{report.report_type}</span>
            <span>
              {report.start_date} to {report.end_date}
            </span>
          </div>

          <div className="report-summary">
            <div className="report-stat">
              <p>Highest</p>
              <h3>{summary.highest ?? "--"}</h3>
              <span>mg/dl</span>
            </div>

            <div className="report-stat">
              <p>Lowest</p>
              <h3>{summary.lowest ?? "--"}</h3>
              <span>mg/dl</span>
            </div>

            <div className="report-stat">
              <p>Average</p>
              <h3>{summary.average ?? "--"}</h3>
              <span>mg/dl</span>
            </div>

            <div className="report-stat">
              <p>Total readings</p>
              <h3>{summary.total_readings ?? 0}</h3>
              <span>Readings</span>
            </div>
          </div>

          <div className="report-chart-card">
            <div className="report-card-heading">
              <h3>Glucose trend</h3>
              <p>Recorded glucose values in mg/dl</p>
            </div>

            {chartData.length === 0 ? (
              <div className="report-empty">
                No glucose readings found for this period.
              </div>
            ) : (
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{
                      top: 15,
                      right: 20,
                      left: 0,
                      bottom: 45
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e7e7ef" />
                    <XAxis
                      dataKey="label"
                      angle={-25}
                      textAnchor="end"
                      interval={0}
                      tick={{ fill: "#858b9a", fontSize: 11 }}
                    />
                    <YAxis
                      domain={["auto", "auto"]}
                      tick={{ fill: "#858b9a", fontSize: 11 }}
                    />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="glucose"
                      name="Glucose"
                      stroke="#77758f"
                      strokeWidth={3}
                      dot={{ r: 5, fill: "#77758f" }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="report-table-card">
            <h3>Report readings</h3>

            {readings.length === 0 ? (
              <p className="report-empty">
                No glucose readings found for this period.
              </p>
            ) : (
              <div className="report-table-wrapper">
                <table className="report-table">
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
                        <td>
                          {String(reading.reading_date).slice(0, 10)}
                        </td>
                        <td>{reading.time_slot}</td>
                        <td>
                          <strong>{reading.glucose_value} mg/dl</strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="report-empty">
          No report available.
        </div>
      )}
    </section>
  );
}

export default Reports;
