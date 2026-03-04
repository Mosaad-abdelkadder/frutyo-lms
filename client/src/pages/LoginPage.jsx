import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "student1@lms.com", password: "Student@123" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(form);
      navigate("/app");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="card auth-card">
      <h1>Login</h1>
      <p>Use seeded accounts to test Admin, Tutor, Student experiences.</p>

      <form onSubmit={handleSubmit} className="stack-form">
        <label>
          Email
          <input name="email" type="email" value={form.email} onChange={handleChange} required />
        </label>

        <label>
          Password
          <input name="password" type="password" value={form.password} onChange={handleChange} required />
        </label>

        {error && <p className="error-text">{error}</p>}
        <button disabled={submitting}>{submitting ? "Please wait..." : "Login"}</button>
      </form>

      <p>
        New user? <Link to="/register">Create account</Link>
      </p>

      <div className="sample-accounts">
        <p>Samples</p>
        <code>admin@lms.com / Admin@123</code>
        <code>tutor1@lms.com / Tutor@123</code>
        <code>student1@lms.com / Student@123</code>
      </div>
    </section>
  );
}
