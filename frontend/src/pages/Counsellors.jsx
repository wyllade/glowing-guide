import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { counsellorAPI } from "../services/api";

export default function Counsellors() {
  const [counsellors, setCounsellors] = useState([]);
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [city, setCity] = useState("");
  const [minRate, setMinRate] = useState("");
  const [maxRate, setMaxRate] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    counsellorAPI
      .list({ search, specialty, city, min_rate: minRate || undefined, max_rate: maxRate || undefined })
      .then((res) => setCounsellors(res.data.counsellors))
      .finally(() => setLoading(false));
  }, [search, specialty, city, minRate, maxRate]);

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
          className="filter-select"
        />
        <input
          type="text"
          placeholder="City"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="filter-select"
        />
        <input
          type="number"
          placeholder="Min $"
          value={minRate}
          onChange={(e) => setMinRate(e.target.value)}
          className="filter-select"
          style={{ minWidth: "90px" }}
        />
        <input
          type="number"
          placeholder="Max $"
          value={maxRate}
          onChange={(e) => setMaxRate(e.target.value)}
          className="filter-select"
          style={{ minWidth: "90px" }}
        />
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /> Searching counsellors...</div>
      ) : (
        <div className="counsellor-grid">
          {counsellors.map((c) => (
            <Link to={`/counsellors/${c.id}`} key={c.id} className="counsellor-card">
              <div className="card-top">
                <div className="card-avatar">
                  {c.user?.first_name?.[0]}{c.user?.last_name?.[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="card-name">{c.user?.first_name} {c.user?.last_name}</div>
                  <div className="rate">${c.hourly_rate}/hr</div>
                </div>
                {c.is_verified && <span className="verified-badge-sm">Verified</span>}
              </div>

              <div className="specialties">
                {c.specialties?.slice(0, 3).map((s) => (
                  <span key={s} className="spec-tag">{s}</span>
                ))}
                {c.specialties?.length > 3 && (
                  <span className="spec-tag">+{c.specialties.length - 3}</span>
                )}
              </div>

              <div className="card-footer">
                {c.city && <span className="location">{c.city}{c.state ? `, ${c.state}` : ""}</span>}
                {c.years_experience != null && (
                  <span className="experience-badge">{c.years_experience}yr exp</span>
                )}
              </div>
            </Link>
          ))}
          {counsellors.length === 0 && (
            <div className="no-results" style={{ gridColumn: "1 / -1" }}>
              No counsellors match your search. Try adjusting your filters.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
