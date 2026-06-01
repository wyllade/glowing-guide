import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { counsellorAPI } from "../services/api";

export default function Counsellors() {
  const [counsellors, setCounsellors] = useState([]);
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("");

  useEffect(() => {
    counsellorAPI.list({ search, specialty }).then((res) => setCounsellors(res.data.counsellors));
  }, [search, specialty]);

  return (
    <div className="counsellors-page">
      <h1>Find a Counsellor</h1>
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by name or keyword..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input
          type="text"
          placeholder="Specialty (e.g. anxiety, depression)"
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
        />
      </div>

      <div className="counsellor-grid">
        {counsellors.map((c) => (
          <Link to={`/counsellors/${c.id}`} key={c.id} className="counsellor-card">
            <div className="card-avatar">{c.user?.first_name?.[0]}{c.user?.last_name?.[0]}</div>
            <h3>{c.user?.first_name} {c.user?.last_name}</h3>
            <p className="specialties">{c.specialties?.join(", ")}</p>
            <p className="rate">${c.hourly_rate}/hr</p>
            {c.city && <p className="location">{c.city}, {c.state}</p>}
          </Link>
        ))}
        {counsellors.length === 0 && <p className="no-results">No counsellors found.</p>}
      </div>
    </div>
  );
}
