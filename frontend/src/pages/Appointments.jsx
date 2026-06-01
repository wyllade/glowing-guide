import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { appointmentAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Appointments() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState("");

  const fetchAppointments = () => {
    appointmentAPI.list({ status: filter || undefined }).then((res) =>
      setAppointments(res.data.appointments)
    );
  };

  useEffect(() => { fetchAppointments(); }, [filter]);

  const handleStatus = async (id, status, reason = "") => {
    await appointmentAPI.updateStatus(id, { status, reason });
    fetchAppointments();
  };

  return (
    <div className="appointments-page">
      <h1>My Appointments</h1>

      <div className="filter-bar">
        {["", "pending", "confirmed", "completed", "cancelled"].map((s) => (
          <button key={s} className={`btn btn-sm ${filter === s ? "btn-primary" : "btn-outline"}`}
            onClick={() => setFilter(s)}>
            {s || "All"}
          </button>
        ))}
      </div>

      <div className="appointment-list">
        {appointments.map((a) => (
          <div key={a.id} className="appointment-card">
            <div className="appt-info">
              <p className="appt-date">{new Date(a.start_time).toLocaleDateString()} at {new Date(a.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
              <span className={`status-badge ${a.status}`}>{a.status}</span>
              {a.notes && <p className="appt-notes">{a.notes}</p>}
              {a.meeting_link && (
                <p className="appt-link">Meeting link available</p>
              )}
            </div>
            <div className="appt-actions">
              {a.status === "confirmed" && a.meeting_link && (
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => navigate(`/video-call/${a.id}`)}
                >
                  Join Call
                </button>
              )}
              {a.status === "pending" && user?.role === "counsellor" && (
                <>
                  <button className="btn btn-sm btn-primary" onClick={() => handleStatus(a.id, "confirmed")}>Confirm</button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleStatus(a.id, "cancelled")}>Cancel</button>
                </>
              )}
              {a.status === "confirmed" && !a.meeting_link && (
                <button className="btn btn-sm btn-primary" onClick={() => handleStatus(a.id, "completed")}>Complete</button>
              )}
              {(a.status === "pending" || a.status === "confirmed") && (
                <button className="btn btn-sm btn-danger" onClick={() => handleStatus(a.id, "cancelled")}>Cancel</button>
              )}
            </div>
          </div>
        ))}
        {appointments.length === 0 && <p className="no-results">No appointments found.</p>}
      </div>
    </div>
  );
}
