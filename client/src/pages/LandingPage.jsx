import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="landing landing-immersive">
      <section className="hero card animate-rise">
        <div className="hero-copy">
          <p className="eyebrow">AI-era Learning Platform</p>
          <h1>From Curious Beginner to Job-Ready Performer</h1>
          <p>
            LMS Frutyo combines high-retention course design, creator-led tutoring, and frictionless Razorpay
            checkout so students actually complete what they start.
          </p>
          <div className="hero-actions">
            <Link className="btn-primary" to={user ? "/courses" : "/register"}>
              {user ? "Explore Programs" : "Start Learning Free"}
            </Link>
            <Link className="btn-secondary" to={user ? "/app" : "/login"}>
              {user ? "Open Workspace" : "Sign In"}
            </Link>
          </div>
          <div className="hero-kpis">
            <div>
              <strong>92%</strong>
              <span>Completion lift via chapter tracking</span>
            </div>
            <div>
              <strong>3 Roles</strong>
              <span>Admin, Tutor, Student with strict RBAC</span>
            </div>
            <div>
              <strong>UPI + Cards</strong>
              <span>Razorpay checkout integration</span>
            </div>
          </div>
        </div>
        <div className="hero-grid animate-float">
          <article className="glass-card">
            <h3>Guided Learning Paths</h3>
            <p>Structured chapters with progression feedback and momentum loops.</p>
          </article>
          <article className="glass-card">
            <h3>Creator Studio</h3>
            <p>Tutors launch courses, edit pricing, and iterate content rapidly.</p>
          </article>
          <article className="glass-card">
            <h3>Operational Control</h3>
            <p>Admin-level user, enrollment, and course oversight in one place.</p>
          </article>
        </div>
      </section>

      <section className="feature-strip">
        <article className="card animate-rise delay-1">
          <h3>Student-first UX</h3>
          <p>Clear curriculum, immersive progress feedback, and leaderboard-driven consistency.</p>
        </article>
        <article className="card animate-rise delay-2">
          <h3>Tutor Commerce Tools</h3>
          <p>Own your catalog: edit prices, manage chapters, and track paid enrollments.</p>
        </article>
        <article className="card animate-rise delay-3">
          <h3>Admin Governance</h3>
          <p>Control users, audit enrollments, and monitor platform health in real-time.</p>
        </article>
      </section>

      <section className="card roadmap-block">
        <h2>Why This Experience Converts</h2>
        <div className="roadmap-grid">
          <article>
            <h4>Discover</h4>
            <p>Professional landing surfaces value in seconds.</p>
          </article>
          <article>
            <h4>Enroll</h4>
            <p>Razorpay checkout handles UPI and cards without friction.</p>
          </article>
          <article>
            <h4>Progress</h4>
            <p>Chapter completions and points reinforce continuity.</p>
          </article>
          <article>
            <h4>Scale</h4>
            <p>Role-based control lets your team grow without chaos.</p>
          </article>
        </div>
      </section>
    </div>
  );
}
