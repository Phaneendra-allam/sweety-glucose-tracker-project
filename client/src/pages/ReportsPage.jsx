
import { useNavigate } from "react-router-dom";
import Reports from "../Reports";

function ReportsPage({ onLogout }) {
  const navigate = useNavigate();

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

            <button onClick={() => navigate("/history")}>
              Reading history
            </button>

            <button className="dashboard-nav-active">
              Reports
            </button>
          </div>
        </div>

        <button className="logout-btn" onClick={onLogout}>
          Logout
        </button>
      </aside>

      <main className="dashboard-main">
        <Reports />
      </main>
    </div>
  );
}

export default ReportsPage;
