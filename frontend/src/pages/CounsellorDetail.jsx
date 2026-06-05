import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { counsellorAPI, appointmentAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CounsellorDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [counsellor, setCounsellor] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [notes, setNotes] = useState("");
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    counsellorAPI.get(id).then((res) => {
      setCounsellor(res.data.counsellor);
      setAvailability(res.data.availability);
    });
  }, [id]);

  function nextDayOfWeek(dayOfWeek, timeStr) {
    const now = new Date();
    const [hours, minutes] = timeStr.split(":").map(Number);
    const result = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0));
    const diff = (dayOfWeek - result.getUTCDay() + 7) % 7;
    if (diff === 0 && result <= new Date()) {
      result.setUTCDate(result.getUTCDate() + 7);
    } else if (diff > 0) {
      result.setUTCDate(result.getUTCDate() + diff);
    }
    return result;
  }

  const handleBook = async () => {
    if (!selectedSlot || !user) return navigate("/login");
    setBooking(true);
    setError("");
    try {
      const startDate = selectedSlot.specific_date
        ? new Date(`${selectedSlot.specific_date}T${selectedSlot.start_time}:00`)
        : nextDayOfWeek(selectedSlot.day_of_week, selectedSlot.start_time);

      const endDate = new Date(startDate);
      endDate.setMinutes(endDate.getMinutes() + 50);

      await appointmentAPI.create({
        counsellor_id: counsellor.user_id,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        notes,
        slot_id: selectedSlot.id,
      });
      navigate("/appointments");
    } catch (err) {
      setError(err.response?.data?.error || "Booking failed. Please try again.");
    } finally {
      setBooking(false);
    }
  };

  if (!counsellor) {
    return (
      <div className="loading">
        <div className="spinner" />
        Loading counsellor profile...
      </div>
    );
  }

  return (
    <div className="counsellor-detail">
      <button className="back-btn" onClick={() => navigate("/counsellors")}>
        &larr; Back to counsellors
      </button>

      <div className="detail-header">
        <div className="detail-avatar">
          {counsellor.user?.first_name?.[0]}{counsellor.user?.last_name?.[0]}
        </div>
        <div>
          <h1>{counsellor.user?.first_name} {counsellor.user?.last_name}</h1>
          <div className="detail-meta">
            <span className="rate-lg">${counsellor.hourly_rate}/hr</span>
            {counsellor.is_verified && <span className="verified-badge">Verified</span>}
            {counsellor.years_experience != null && (
              <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                {counsellor.years_experience} years experience
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="detail-body">
        {counsellor.bio && (
          <section>
            <h2>About</h2>
            <p style={{ lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{counsellor.bio}</p>
          </section>
        )}

        {counsellor.specialties?.length > 0 && (
          <section>
            <h2>Specialties</h2>
            <div className="tags">
              {counsellor.specialties.map((s) => (
                <span key={s} className="tag">{s}</span>
              ))}
            </div>
          </section>
        )}

        {counsellor.education && (
          <section>
            <h2>Education</h2>
            <p>{counsellor.education}</p>
          </section>
        )}

        {counsellor.languages?.length > 0 && (
          <section>
            <h2>Languages</h2>
            <p>{counsellor.languages.join(", ")}</p>
          </section>
        )}

        {(counsellor.city || counsellor.state) && (
          <section>
            <h2>Location</h2>
            <p>{[counsellor.city, counsellor.state, counsellor.country].filter(Boolean).join(", ")}</p>
          </section>
        )}
      </div>

      <div className="availability-section">
        <h2>Weekly Availability</h2>
        {availability.length > 0 ? (
          <div className="availability-slots">
            {availability.map((slot) => (
              <button
                key={slot.id}
                className={`slot-btn ${selectedSlot?.id === slot.id ? "selected" : ""}`}
                onClick={() => setSelectedSlot(slot)}
              >
                {DAYS[slot.day_of_week]}: {slot.start_time} &ndash; {slot.end_time}
              </button>
            ))}
          </div>
        ) : (
          <p style={{ color: "var(--text-muted)" }}>No availability listed yet.</p>
        )}
      </div>

      {user && user.role === "client" && (
        <div className="availability-section">
          <h2>Book a Session</h2>
          {error && <p className="error-msg">{error}</p>}

          {selectedSlot ? (
            <div style={{ marginBottom: "1rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Selected: <strong>{DAYS[selectedSlot.day_of_week]}</strong>,{" "}
              {selectedSlot.start_time} &ndash; {selectedSlot.end_time}
            </div>
          ) : (
            <p style={{ color: "var(--text-muted)", marginBottom: "1rem" }}>
              Select an available time slot above to book.
            </p>
          )}

          <div className="form-group">
            <label htmlFor="notes">Notes for the counsellor (optional)</label>
            <textarea
              id="notes"
              rows="3"
              placeholder="Briefly describe what you'd like to discuss..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <button
            className="btn btn-primary btn-lg btn-block"
            onClick={handleBook}
            disabled={!selectedSlot || booking}
          >
            {booking ? "Booking..." : `Book Session ($${counsellor.hourly_rate})`}
          </button>
        </div>
      )}

      {!user && (
        <div className="availability-section" style={{ textAlign: "center" }}>
          <p style={{ color: "var(--text-muted)", marginBottom: "1rem" }}>
            Sign in to book a session with {counsellor.user?.first_name}.
          </p>
          <button className="btn btn-primary" onClick={() => navigate("/login")}>
            Sign In to Book
          </button>
        </div>
      )}
    </div>
  );
}
