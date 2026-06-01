import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { counsellorAPI, appointmentAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function CounsellorDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [counsellor, setCounsellor] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);

  useEffect(() => {
    counsellorAPI.get(id).then((res) => {
      setCounsellor(res.data.counsellor);
      setAvailability(res.data.availability);
    });
  }, [id]);

  const handleBook = async () => {
    if (!selectedSlot || !user) return navigate("/login");
    const startTime = selectedSlot.specific_date
      ? `${selectedSlot.specific_date}T${selectedSlot.start_time}:00`
      : null;
    try {
      await appointmentAPI.create({
        counsellor_id: counsellor.user_id,
        start_time: startTime,
        end_time: startTime,
      });
      navigate("/appointments");
    } catch (err) {
      alert(err.response?.data?.error || "Booking failed");
    }
  };

  if (!counsellor) return <div className="loading">Loading...</div>;

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="counsellor-detail">
      <div className="detail-header">
        <div className="detail-avatar">{counsellor.user?.first_name?.[0]}{counsellor.user?.last_name?.[0]}</div>
        <div>
          <h1>{counsellor.user?.first_name} {counsellor.user?.last_name}</h1>
          <p className="rate">${counsellor.hourly_rate}/hr</p>
          {counsellor.is_verified && <span className="verified-badge">Verified</span>}
        </div>
      </div>

      <div className="detail-body">
        <section>
          <h2>About</h2>
          <p>{counsellor.bio}</p>
        </section>

        <section>
          <h2>Specialties</h2>
          <div className="tags">{counsellor.specialties?.map((s) => <span key={s} className="tag">{s}</span>)}</div>
        </section>

        {counsellor.education && <section><h2>Education</h2><p>{counsellor.education}</p></section>}
        {counsellor.languages?.length > 0 && (
          <section><h2>Languages</h2><p>{counsellor.languages.join(", ")}</p></section>
        )}

        <section>
          <h2>Availability</h2>
          <div className="availability-slots">
            {availability.map((slot) => (
              <button
                key={slot.id}
                className={`slot-btn ${selectedSlot?.id === slot.id ? "selected" : ""}`}
                onClick={() => setSelectedSlot(slot)}
              >
                {days[slot.day_of_week]}: {slot.start_time} - {slot.end_time}
              </button>
            ))}
            {availability.length === 0 && <p>No availability listed.</p>}
          </div>
        </section>

        {user && user.role === "client" && (
          <button className="btn btn-primary" onClick={handleBook} disabled={!selectedSlot}>
            Book Session
          </button>
        )}
      </div>
    </div>
  );
}
