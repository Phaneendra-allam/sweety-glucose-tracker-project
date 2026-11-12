
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";
import "./Dashboard.css";

const slots = [
  "Morning",
  "After breakfast",
  "After lunch",
  "After dinner"
];

function getToday() {
  const date = new Date();
  const offset = date.getTimezoneOffset();

  return new Date(date.getTime() - offset * 60000)
    .toISOString()
    .split("T")[0];
}

function Dashboard({ onLogout }) {
  const navigate = useNavigate();

  const [readings, setReadings] = useState([]);
  const [date, setDate] = useState(getToday());
  const [slot, setSlot] = useState("Morning");
  const [value, setValue] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [report, setReport] = useState({
    highest: null,
    lowest: null,
    average: null,
    total_readings: 0
  });

  const [editingId, setEditingId] = useState(null);

  const fetchReadings = async () => {
    try {
      const response = await api.get("/readings");
      setReadings(response.data.readings || []);
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Unable to load readings."
      );
    }
  };

  const fetchReport = async (selectedDate) => {
    try {
      const response = await api.get("/reports/daily", {
        params: { date: selectedDate }
      });

      setReport(response.data.summary);
    } catch (error) {
      console.error("Report error:", error);
    }
  };

  useEffect(() => {
    fetchReadings();
  }, []);

  useEffect(() => {
    fetchReport(date);
  }, [date]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!value) {
      setMessage("Please enter a glucose value.");
      return;
    }

    setLoading(true);

    try {
      const data = {
        reading_date: date,
        time_slot: slot,
        glucose_value: Number(value)
      };

      if (editingId) {
        await api.put(`/readings/${editingId}`, data);
        setMessage("Reading updated successfully.");
      } else {
        await api.post("/readings", data);
        setMessage("Reading added successfully.");
      }

      setValue("");
      setEditingId(null);

      await fetchReadings();
      await fetchReport(date);
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        "Unable to save reading. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (reading) => {
    const formattedDate = String(reading.reading_date).slice(0, 10);

    setDate(formattedDate);
    setSlot(reading.time_slot);
    setValue(reading.glucose_value);
    setEditingId(reading.id);
    setMessage("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this reading?")) {
      return;
    }

    try {
      await api.delete(`/readings/${id}`);
      setMessage("Reading deleted successfully.");

      await fetchReadings();
      await fetchReport(date);
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Unable to delete reading."
      );
    }
  };

  const selectedReadings = readings.filter(
    (reading) =>
      String(reading.reading_date).slice(0, 10) === date
  );

  return (
    <div className="dashboard">
      <aside className="dashboard-sidebar">
        <div>
          <h2>Sweety</h2>
          <p>Your health companion</p>

          <div className="dashboard-nav">
            <button
              className="dashboard-nav-active"
              onClick={() => navigate("/dashboard")}
            >
              Dashboard
            </button>

            <button onClick={() => navigate("/history")}>
              Reading history
            </button>

            <button onClick={() => navigate("/reports")}>
              Reports
            </button>
          </div>
        </div>

        <button className="logout-btn" onClick={onLogout}>
          Logout
        </button>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-eyebrow">HEALTH OVERVIEW</p>
            <h1>Glucose Dashboard</h1>
            <p className="dashboard-subtitle">
              Monitor and manage your daily glucose readings.
            </p>
          </div>

          <div className="date-control">
            <label>Select date</label>
            <input
              type="date"
              value={date}
              max={getToday()}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </header>

        <section className="summary-grid">
          <div className="summary-card">
            <p>Highest reading</p>
            <h2>{report.highest ?? "--"}</h2>
            <span>mg/dl</span>
          </div>

          <div className="summary-card">
            <p>Lowest reading</p>
            <h2>{report.lowest ?? "--"}</h2>
            <span>mg/dl</span>
          </div>

          <div className="summary-card">
            <p>Average reading</p>
            <h2>{report.average ?? "--"}</h2>
            <span>mg/dl</span>
          </div>

          <div className="summary-card">
            <p>Total readings</p>
            <h2>{report.total_readings}</h2>
            <span>Selected date</span>
          </div>
        </section>

        <section className="dashboard-content">
          <div className="reading-form-card">
            <div className="section-heading">
              <h2>
                {editingId ? "Edit reading" : "Add glucose reading"}
              </h2>
              <p>Record your glucose level for the selected date.</p>
            </div>

            <form onSubmit={handleSubmit}>
              <label>Date</label>
              <input
                type="date"
                value={date}
                max={getToday()}
                onChange={(e) => setDate(e.target.value)}
                required
              />

              <label>Time slot</label>
              <select
                value={slot}
                onChange={(e) => setSlot(e.target.value)}
                required
              >
                {slots.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <label>Glucose value (mg/dl)</label>
              <input
                type="number"
                min="40"
                max="600"
                step="1"
                placeholder="Enter glucose value"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required
              />

              <button
                type="submit"
                className="save-reading-btn"
                disabled={loading}
              >
                {loading
                  ? "Saving..."
                  : editingId
                    ? "Update reading"
                    : "Save reading"}
              </button>

              {editingId && (
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setEditingId(null);
                    setValue("");
                    setMessage("");
                  }}
                >
                  Cancel editing
                </button>
              )}
            </form>

            {message && (
              <p className="dashboard-message">{message}</p>
            )}
          </div>

          <div className="history-card">
            <div className="section-heading">
              <h2>Recent readings</h2>
              <p>Readings for your selected date.</p>
            </div>

            {selectedReadings.length === 0 ? (
              <div className="empty-state">
                <h3>No readings yet</h3>
                <p>Add your first glucose reading to see it here.</p>
              </div>
            ) : (
              <div className="reading-list">
                {selectedReadings.map((reading) => (
                  <div className="reading-item" key={reading.id}>
                    <div>
                      <h3>{reading.time_slot}</h3>
                      <p>
                        {String(reading.reading_date).slice(0, 10)}
                      </p>
                    </div>

                    <div className="reading-value">
                      <strong>{reading.glucose_value}</strong>
                      <span>mg/dl</span>
                    </div>

                    <div className="reading-actions">
                      <button onClick={() => handleEdit(reading)}>
                        Edit
                      </button>

                      <button
                        className="delete-action"
                        onClick={() => handleDelete(reading.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              className="save-reading-btn"
              onClick={() => navigate("/history")}
            >
              View all readings
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
