import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [tab, setTab] = useState("overview");
  const [users, setUsers] = useState([]);
  const [counsellors, setCounsellors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    if (user.role !== "admin") {
      navigate("/dashboard");
      return;
    }
    adminAPI.dashboard().then((res) => setStats(res.data)).finally(() => setLoading(false));
  }, [user, navigate]);

  const fetchUsers = () => adminAPI.listUsers().then((res) => setUsers(res.data.users));
  const fetchCounsellors = () => adminAPI.listCounsellors().then((res) => setCounsellors(res.data.counsellors));
  const fetchAppointments = () => adminAPI.listAppointments().then((res) => setAppointments(res.data.appointments));

  useEffect(() => { if (tab === "users") fetchUsers(); }, [tab]);
  useEffect(() => { if (tab === "counsellors") fetchCounsellors(); }, [tab]);
  useEffect(() => { if (tab === "appointments") fetchAppointments(); }, [tab]);

  const handleVerify = async (id, current) => {
    await adminAPI.verifyCounsellor(id, !current);
    fetchCounsellors();
  };

  const handleToggleUser = async (id, field) => {
    await adminAPI.updateUser(id, { [field]: false });
    fetchUsers();
  };

  if (loading) return <div className="loading"><div className="spinner" /> Loading admin panel...</div>;

  return (
    <div className="admin-page">
      <h1>Admin Dashboard</h1>

      {stats && (
        <div className="stats-row">
          <div className="stat-card"><h3>{stats.total_users}</h3><p>Total Users</p></div>
          <div className="stat-card"><h3>{stats.total_counsellors}</h3><p>Counsellors</p></div>
          <div className="stat-card"><h3>{stats.verified_counsellors}</h3><p>Verified</p></div>
          <div className="stat-card"><h3>{stats.total_appointments}</h3><p>Appointments</p></div>
          <div className="stat-card"><h3>{stats.pending_appointments}</h3><p>Pending</p></div>
          <div className="stat-card"><h3>${stats.total_revenue}</h3><p>Revenue</p></div>
        </div>
      )}

      <div className="filter-bar">
        {["overview", "users", "counsellors", "appointments"].map((t) => (
          <button key={t} className={`btn btn-sm ${tab === t ? "btn-primary" : "btn-outline"}`}
            onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "users" && (
        <div className="admin-section">
          <h2>Users</h2>
          <div className="admin-table">
            <div className="admin-table-header">
              <span>Name</span><span>Email</span><span>Role</span><span>Verified</span><span>Active</span><span>Actions</span>
            </div>
            {users.map((u) => (
              <div key={u.id} className="admin-table-row">
                <span>{u.first_name} {u.last_name}</span>
                <span>{u.email}</span>
                <span><span className="status-badge">{u.role}</span></span>
                <span>{u.is_verified ? "Yes" : "No"}</span>
                <span>{u.is_active ? "Yes" : "No"}</span>
                <span>
                  {u.is_active && (
                    <button className="btn btn-sm btn-danger" onClick={() => handleToggleUser(u.id, "is_active")}>
                      Disable
                    </button>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "counsellors" && (
        <div className="admin-section">
          <h2>Counsellor Profiles</h2>
          <div className="admin-table">
            <div className="admin-table-header">
              <span>Name</span><span>Specialties</span><span>Rate</span><span>Verified</span><span>Actions</span>
            </div>
            {counsellors.map((c) => (
              <div key={c.id} className="admin-table-row">
                <span>{c.user?.first_name} {c.user?.last_name}</span>
                <span>{c.specialties?.slice(0, 2).join(", ")}</span>
                <span>${c.hourly_rate}</span>
                <span>
                  <span className={`status-badge ${c.is_verified ? "completed" : "pending"}`}>
                    {c.is_verified ? "Verified" : "Pending"}
                  </span>
                </span>
                <span>
                  <button className="btn btn-sm btn-primary" onClick={() => handleVerify(c.id, c.is_verified)}>
                    {c.is_verified ? "Unverify" : "Verify"}
                  </button>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "appointments" && (
        <div className="admin-section">
          <h2>All Appointments</h2>
          <div className="admin-table">
            <div className="admin-table-header">
              <span>Client</span><span>Counsellor</span><span>Date</span><span>Status</span>
            </div>
            {appointments.map((a) => (
              <div key={a.id} className="admin-table-row">
                <span>{a.client_name}</span>
                <span>{a.counsellor_name}</span>
                <span>{new Date(a.start_time).toLocaleDateString()}</span>
                <span><span className={`status-badge ${a.status}`}>{a.status}</span></span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
