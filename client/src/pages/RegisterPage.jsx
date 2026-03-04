import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "student" });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await register(form);
      navigate("/app");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <section className="card auth-card">
      <h1>Register</h1>
      <form onSubmit={handleSubmit} className="stack-form">
        <label>
          Name
          <input name="name" value={form.name} onChange={handleChange} required />
        </label>

        <label>
          Email
          <input name="email" type="email" value={form.email} onChange={handleChange} required />
        </label>

        <label>
          Password
          <input name="password" type="password" value={form.password} onChange={handleChange} required />
        </label>

        <label>
          Role
          <select name="role" value={form.role} onChange={handleChange}>
            <option value="student">Student</option>
            <option value="tutor">Tutor</option>
          </select>
        </label>

        {error && <p className="error-text">{error}</p>}
        <button type="submit">Create account</button>
      </form>

      <p>
        Already registered? <Link to="/login">Login</Link>
      </p>
    </section>
  );
}
