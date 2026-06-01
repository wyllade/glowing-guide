import { useEffect, useState } from "react";
import { journalAPI } from "../services/api";

export default function Journal() {
  const [entries, setEntries] = useState([]);
  const [moodLogs, setMoodLogs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showMood, setShowMood] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", mood_score: 5, tags: "", is_private: true });
  const [mood, setMood] = useState({ mood_score: 5, note: "" });
  const [editing, setEditing] = useState(null);

  const fetchEntries = () => journalAPI.list().then((res) => setEntries(res.data.entries));
  const fetchMoodLogs = () => journalAPI.getMoodLogs({ days: 30 }).then((res) => setMoodLogs(res.data.logs));

  useEffect(() => { fetchEntries(); fetchMoodLogs(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editing) {
      await journalAPI.update(editing, form);
    } else {
      await journalAPI.create(form);
    }
    setShowForm(false);
    setEditing(null);
    setForm({ title: "", content: "", mood_score: 5, tags: "", is_private: true });
    fetchEntries();
  };

  const handleEdit = (entry) => {
    setForm({ title: entry.title || "", content: entry.content, mood_score: entry.mood_score || 5, tags: entry.tags?.join(",") || "", is_private: entry.is_private });
    setEditing(entry.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Delete this entry?")) {
      await journalAPI.delete(id);
      fetchEntries();
    }
  };

  const handleMoodSubmit = async (e) => {
    e.preventDefault();
    await journalAPI.logMood(mood);
    setShowMood(false);
    setMood({ mood_score: 5, note: "" });
    fetchMoodLogs();
  };

  return (
    <div className="journal-page">
      <div className="journal-header">
        <h1>Journal</h1>
        <div className="journal-actions">
          <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditing(null); setForm({ title: "", content: "", mood_score: 5, tags: "", is_private: true }); }}>New Entry</button>
          <button className="btn btn-outline" onClick={() => setShowMood(!showMood)}>Log Mood</button>
        </div>
      </div>

      {showMood && (
        <form className="mood-form" onSubmit={handleMoodSubmit}>
          <label>Mood: {mood.mood_score}/10</label>
          <input type="range" min="1" max="10" value={mood.mood_score} onChange={(e) => setMood({ ...mood, mood_score: parseInt(e.target.value) })} />
          <input type="text" placeholder="How are you feeling?" value={mood.note} onChange={(e) => setMood({ ...mood, note: e.target.value })} />
          <button type="submit" className="btn btn-primary btn-sm">Log</button>
        </form>
      )}

      {moodLogs.length > 0 && (
        <div className="mood-chart">
          <h3>Mood (Last 30 Days)</h3>
          <div className="mood-bars">
            {moodLogs.map((log, i) => (
              <div key={log.id || i} className="mood-bar" style={{ height: `${log.mood_score * 10}%` }} title={`${new Date(log.created_at).toLocaleDateString()}: ${log.mood_score}/10`} />
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <form className="entry-form" onSubmit={handleSubmit}>
          <input type="text" placeholder="Title (optional)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <textarea rows="8" placeholder="Write your thoughts..." value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required />
          <div className="form-row">
            <div className="form-group">
              <label>Mood: {form.mood_score}/10</label>
              <input type="range" min="1" max="10" value={form.mood_score} onChange={(e) => setForm({ ...form, mood_score: parseInt(e.target.value) })} />
            </div>
            <div className="form-group">
              <label>Tags (comma separated)</label>
              <input type="text" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="gratitude, anxiety, goals" />
            </div>
          </div>
          <label className="checkbox-label">
            <input type="checkbox" checked={form.is_private} onChange={(e) => setForm({ ...form, is_private: e.target.checked })} />
            Private
          </label>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">{editing ? "Update" : "Save"}</button>
            <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      <div className="entries-list">
        {entries.map((e) => (
          <div key={e.id} className="entry-card">
            <div className="entry-header">
              <h3>{e.title || "Untitled"}</h3>
              <span className="entry-date">{new Date(e.created_at).toLocaleDateString()}</span>
            </div>
            <p className="entry-preview">{e.content.substring(0, 200)}{e.content.length > 200 ? "..." : ""}</p>
            {e.mood_score && <span className="entry-mood">Mood: {e.mood_score}/10</span>}
            <div className="entry-tags">{e.tags?.map((t) => <span key={t} className="tag">{t}</span>)}</div>
            <div className="entry-actions">
              <button className="btn btn-sm" onClick={() => handleEdit(e)}>Edit</button>
              <button className="btn btn-sm btn-danger" onClick={() => handleDelete(e.id)}>Delete</button>
            </div>
          </div>
        ))}
        {entries.length === 0 && <p className="no-results">No journal entries yet.</p>}
      </div>
    </div>
  );
}
