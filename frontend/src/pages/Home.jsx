import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user } = useAuth();
  return (
    <div className="home-page">
      <section className="hero">
        <h1>Your Journey to Wellness Starts Here</h1>
        <p>Connect with licensed professional counsellors from the comfort of your home.</p>
        <div className="hero-actions">
          {user ? (
            <Link to="/counsellors" className="btn btn-primary">Find a Counsellor</Link>
          ) : (
            <>
              <Link to="/signup" className="btn btn-primary">Get Started</Link>
              <Link to="/counsellors" className="btn btn-outline">Browse Counsellors</Link>
            </>
          )}
        </div>
      </section>
      <section className="features">
        <div className="feature-card">
          <h3>Find Your Match</h3>
          <p>Browse verified counsellors by specialty, rate, and location.</p>
        </div>
        <div className="feature-card">
          <h3>Book Sessions</h3>
          <p>Schedule appointments that fit your calendar.</p>
        </div>
        <div className="feature-card">
          <h3>Track Progress</h3>
          <p>Journal your thoughts and track your mood over time.</p>
        </div>
      </section>
    </div>
  );
}
