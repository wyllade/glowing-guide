import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="nav-inner">
        <Link to="/" className="nav-brand">Upward</Link>
        <div className="nav-links">
          <Link to="/counsellors">Counsellors</Link>
          {user ? (
            <>
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/appointments">Appointments</Link>
              <Link to="/journal">Journal</Link>
              <Link to="/profile">Profile</Link>
              {user.role === "admin" && <Link to="/admin">Admin</Link>}
              <span className="nav-user">{user.first_name || user.email}</span>
              <button onClick={handleLogout} className="btn btn-sm">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/signup" className="btn btn-sm">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
