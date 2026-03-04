import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const linksByRole = {
  student: [
    { to: "/app", label: "Dashboard" },
    { to: "/courses", label: "Courses" },
    { to: "/my-learning", label: "My Learning" }
  ],
  tutor: [
    { to: "/app", label: "Dashboard" },
    { to: "/courses", label: "Catalog" },
    { to: "/manage-courses", label: "Course Studio" }
  ],
  admin: [
    { to: "/app", label: "Dashboard" },
    { to: "/courses", label: "Catalog" },
    { to: "/manage-courses", label: "Course Studio" },
    { to: "/admin-studio", label: "Admin Studio" }
  ]
};

export default function Shell({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const links = user ? linksByRole[user.role] || [] : [];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand">
          LMS Frutyo
        </Link>
        {user ? (
          <>
            <nav className="nav-links">
              {links.map((link) => (
                <NavLink key={link.to} to={link.to}>
                  {link.label}
                </NavLink>
              ))}
            </nav>
            <div className="user-panel">
              <span>
                {user.name} ({user.role})
              </span>
              <button onClick={handleLogout}>Logout</button>
            </div>
          </>
        ) : (
          <nav className="nav-links">
            <NavLink to="/login">Login</NavLink>
            <NavLink to="/register">Register</NavLink>
          </nav>
        )}
      </header>
      <main className="main-content">{children}</main>
    </div>
  );
}
