
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

function HistoryPage({ onLogout }) {
  const navigate = useNavigate();

  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReadings = async () => {
    try {
      setLoading(true);
      const response = await api.get("/readings");
      setReadings(response.data.readings || []);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load reading history."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReadings();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this reading?")) {
      return;
    }

    try {
      await api.delete(`/readings/${id}`);
      await fetchReadings();
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to delete reading."
      );
    }
  };

  return (
    <div className="dashboard">
      <aside className="dashboard-sidebar">
        <div>
          <h2>Sweety</h2>
          <p>Your health companion</p>

          <div className="dashboard-nav">
            <button onClick={() => navigate("/dashboard")}>
              Dashboard
            </button>

            <button className="dashboard-nav-active">
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
            <p className="dashboard-eyebrow">YOUR RECORDS</p>
            <h1>Reading History</h1>
            <p className="dashboard-subtitle">
              View all your recorded glucose readings.
            </p>
          </div>

          <button
            className="save-reading-btn"
            onClick={() => navigate("/dashboard")}
          >
            Add new reading
          </button>
        </header>

        <section className="history-card">
          <div className="section-heading">
            <h2>All glucose readings</h2>
            <p>{readings.length} total readings</p>
          </div>

          {loading ? (
            <div className="empty-state">
              <p>Loading your readings...</p>
            </div>
          ) : error ? (
            <div className="empty-state">
              <p>{error}</p>
              <button onClick={fetchReadings}>Try again</button>
            </div>
          ) : readings.length === 0 ? (
            <div className="empty-state">
              <h3>No readings yet</h3>
              <p>Add your first glucose reading to see it here.</p>
            </div>
          ) : (
            <div className="reading-list">
              {readings.map((reading) => (
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
                    <button
                      onClick={() => navigate("/dashboard")}
                    >
                      View
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
        </section>
      </main>
    </div>
  );
}

export default HistoryPage;
