import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { appointmentAPI, journalAPI } from "../services/api";

export default function Dashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [moodLogs, setMoodLogs] = useState([]);

  useEffect(() => {
    appointmentAPI.list({ status: "confirmed" }).then((res) => setAppointments(res.data.appointments.slice(0, 5)));
    journalAPI.getMoodLogs({ days: 7 }).then((res) => setMoodLogs(res.data.logs));
  }, []);

  const avgMood = moodLogs.length
    ? (moodLogs.reduce((s, l) => s + l.mood_score, 0) / moodLogs.length).toFixed(1)
    : null;

  return (
    <div className="dashboard">
      <h1>Welcome{user?.first_name ? `, ${user.first_name}` : ""}</h1>

      <div className="stats-row">
        <div className="stat-card">
          <h3>{appointments.length}</h3>
          <p>Upcoming Sessions</p>
        </div>
        {avgMood && (
          <div className="stat-card">
            <h3>{avgMood}/10</h3>
            <p>Avg Mood (7 days)</p>
          </div>
        )}
      </div>

      <div className="quick-links">
        <Link to="/counsellors" className="btn btn-primary">Find a Counsellor</Link>
        <Link to="/appointments" className="btn btn-outline">My Appointments</Link>
        <Link to="/journal" className="btn btn-outline">Journal</Link>
        {user?.role === "counsellor" && (
          <Link to="/profile" className="btn btn-outline">Manage Profile</Link>
        )}
      </div>

      {appointments.length > 0 && (
        <div className="section">
          <h2>Upcoming Sessions</h2>
          <div className="appointment-list">
            {appointments.map((a) => (
              <div key={a.id} className="appointment-card">
                <p>{new Date(a.start_time).toLocaleDateString()} at {new Date(a.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                <span className={`status-badge ${a.status}`}>{a.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
