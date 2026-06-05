import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { authAPI, counsellorAPI, paymentAPI } from "../services/api";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ first_name: "", last_name: "", phone: "" });
  const [counsellorForm, setCounsellorForm] = useState({
    bio: "", specialties: "", hourly_rate: "", education: "", languages: "", city: "", state: "", country: "US",
  });
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [availabilitySlots, setAvailabilitySlots] = useState([]);
  const [newSlot, setNewSlot] = useState({ day_of_week: 0, start_time: "09:00", end_time: "17:00" });

  useEffect(() => {
    if (user) {
      setForm({ first_name: user.first_name || "", last_name: user.last_name || "", phone: user.phone || "" });
      if (user.role === "counsellor") {
        counsellorAPI.getProfile().then((res) => {
          if (res.data.counsellor) {
            const c = res.data.counsellor;
            setProfile(c);
            setCounsellorForm({
              bio: c.bio || "",
              specialties: c.specialties?.join(", ") || "",
              hourly_rate: c.hourly_rate || "",
              education: c.education || "",
              languages: c.languages?.join(", ") || "",
              city: c.city || "",
              state: c.state || "",
              country: c.country || "US",
            });
          }
        });
        counsellorAPI.getAvailability().then((res) => setAvailabilitySlots(res.data.availability));
      }
      paymentAPI.history().then((res) => setPaymentHistory(res.data.payments));
    }
  }, [user]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    const res = await authAPI.updateMe(form);
    updateUser(res.data.user);
  };

  const handleCounsellorUpdate = async (e) => {
    e.preventDefault();
    const data = {
      ...counsellorForm,
      specialties: counsellorForm.specialties.split(",").map((s) => s.trim()).join(","),
      languages: counsellorForm.languages.split(",").map((s) => s.trim()).join(","),
      hourly_rate: parseFloat(counsellorForm.hourly_rate),
    };
    const res = await counsellorAPI.upsertProfile(data, !!profile);
    setProfile(res.data.counsellor);
  };

  const addSlot = async () => {
    await counsellorAPI.setAvailability({ slots: [newSlot] });
    const res = await counsellorAPI.getAvailability();
    setAvailabilitySlots(res.data.availability);
  };

  const deleteSlot = async (slotId) => {
    await counsellorAPI.deleteAvailability(slotId);
    setAvailabilitySlots((prev) => prev.filter((s) => s.id !== slotId));
  };

  return (
    <div className="profile-page">
      <h1>Profile</h1>

      <form className="profile-form" onSubmit={handleProfileUpdate}>
        <h2>Account Info</h2>
        <div className="form-row">
          <div className="form-group"><label>First Name</label><input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></div>
          <div className="form-group"><label>Last Name</label><input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></div>
        </div>
        <div className="form-group"><label>Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
        <button type="submit" className="btn btn-primary">Save</button>
      </form>

      {user?.role === "counsellor" && (
        <>
          <form className="profile-form" onSubmit={handleCounsellorUpdate}>
            <h2>Counsellor Profile</h2>
            <div className="form-group"><label>Bio</label><textarea rows="4" value={counsellorForm.bio} onChange={(e) => setCounsellorForm({ ...counsellorForm, bio: e.target.value })} /></div>
            <div className="form-row">
              <div className="form-group"><label>Specialties (comma-separated)</label><input value={counsellorForm.specialties} onChange={(e) => setCounsellorForm({ ...counsellorForm, specialties: e.target.value })} /></div>
              <div className="form-group"><label>Hourly Rate ($)</label><input type="number" value={counsellorForm.hourly_rate} onChange={(e) => setCounsellorForm({ ...counsellorForm, hourly_rate: e.target.value })} /></div>
            </div>
            <div className="form-group"><label>Education</label><input value={counsellorForm.education} onChange={(e) => setCounsellorForm({ ...counsellorForm, education: e.target.value })} /></div>
            <div className="form-group"><label>Languages</label><input value={counsellorForm.languages} onChange={(e) => setCounsellorForm({ ...counsellorForm, languages: e.target.value })} /></div>
            <div className="form-row">
              <div className="form-group"><label>City</label><input value={counsellorForm.city} onChange={(e) => setCounsellorForm({ ...counsellorForm, city: e.target.value })} /></div>
              <div className="form-group"><label>State</label><input value={counsellorForm.state} onChange={(e) => setCounsellorForm({ ...counsellorForm, state: e.target.value })} /></div>
            </div>
            <button type="submit" className="btn btn-primary">{profile ? "Update Profile" : "Create Profile"}</button>
          </form>

          <div className="availability-section">
            <h2>Availability</h2>
            <div className="add-slot">
              <select value={newSlot.day_of_week} onChange={(e) => setNewSlot({ ...newSlot, day_of_week: parseInt(e.target.value) })}>
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => (<option key={i} value={i}>{d}</option>))}
              </select>
              <input type="time" value={newSlot.start_time} onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })} />
              <input type="time" value={newSlot.end_time} onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })} />
              <button className="btn btn-sm btn-primary" onClick={addSlot}>Add</button>
            </div>
            <div className="slot-list">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => {
                const daySlots = availabilitySlots.filter((s) => s.day_of_week === i);
                return daySlots.length > 0 ? (
                  <div key={i} className="day-slots">
                    <strong>{d}:</strong>
                    {daySlots.map((s) => (
                      <span key={s.id} className="slot-item">
                        {s.start_time}-{s.end_time}
                        <button className="btn btn-sm btn-danger slot-delete" onClick={() => deleteSlot(s.id)}>&times;</button>
                      </span>
                    ))}
                  </div>
                ) : null;
              })}
            </div>
          </div>
        </>
      )}

      <div className="payment-history">
        <h2>Payment History</h2>
        <div className="payment-list">
          {paymentHistory.map((p) => (
            <div key={p.id} className="payment-card">
              <span>${p.amount} {p.currency}</span>
              <span className={`status-badge ${p.status}`}>{p.status}</span>
              <span>{new Date(p.created_at).toLocaleDateString()}</span>
            </div>
          ))}
          {paymentHistory.length === 0 && <p>No payments yet.</p>}
          </div>
        </div>
      </div>
    );
  }
