import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";

const emptyUser = { name: "", email: "", password: "", role: "student" };

export default function AdminStudioPage() {
  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [coursePriceDraft, setCoursePriceDraft] = useState("");
  const [form, setForm] = useState(emptyUser);
  const [editingUserId, setEditingUserId] = useState("");
  const [message, setMessage] = useState("");

  const selectedCourseEnrollments = useMemo(
    () => enrollments.filter((item) => item.course?._id === selectedCourseId),
    [enrollments, selectedCourseId]
  );

  const load = async () => {
    const [userRes, enrollmentRes, courseRes] = await Promise.all([
      api.get("/admin/users"),
      api.get("/enrollments"),
      api.get("/courses")
    ]);

    setUsers(userRes.data);
    setEnrollments(enrollmentRes.data);
    setCourses(courseRes.data);
    setSelectedCourseId((prev) => prev || courseRes.data[0]?._id || "");
  };

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const [userRes, enrollmentRes, courseRes] = await Promise.all([
          api.get("/admin/users"),
          api.get("/enrollments"),
          api.get("/courses")
        ]);

        if (!active) return;
        setUsers(userRes.data);
        setEnrollments(enrollmentRes.data);
        setCourses(courseRes.data);
        setSelectedCourseId((prev) => prev || courseRes.data[0]?._id || "");
      } catch {
        if (active) setMessage("Failed to load admin data");
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    if (!selectedCourseId) return () => {};

    (async () => {
      try {
        const { data } = await api.get(`/courses/${selectedCourseId}`);
        if (!active) return;
        setSelectedCourse(data);
        setCoursePriceDraft(String(data.price ?? ""));
      } catch {
        if (active) setSelectedCourse(null);
      }
    })();

    return () => {
      active = false;
    };
  }, [selectedCourseId]);

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const submitUser = async (e) => {
    e.preventDefault();
    try {
      if (editingUserId) {
        await api.put(`/admin/users/${editingUserId}`, form);
        setMessage("User updated");
      } else {
        await api.post("/admin/users", form);
        setMessage("User created");
      }
      setForm(emptyUser);
      setEditingUserId("");
      await load();
    } catch (error) {
      setMessage(error.response?.data?.message || "User action failed");
    }
  };

  const editUser = (user) => {
    setEditingUserId(user._id);
    setForm({ name: user.name, email: user.email, password: "", role: user.role });
    setTab("users");
  };

  const removeUser = async (userId) => {
    if (!window.confirm("Delete this user?")) return;
    await api.delete(`/admin/users/${userId}`);
    setMessage("User deleted");
    await load();
  };

  const updateEnrollment = async (enrollmentId, paymentStatus) => {
    await api.patch(`/enrollments/${enrollmentId}`, { paymentStatus });
    setMessage("Enrollment updated");
    await load();
  };

  const removeEnrollment = async (enrollmentId) => {
    await api.delete(`/enrollments/${enrollmentId}`);
    setMessage("Enrollment deleted");
    await load();
  };

  const updateCoursePrice = async () => {
    if (!selectedCourseId || !coursePriceDraft) return;
    await api.put(`/courses/${selectedCourseId}`, { price: Number(coursePriceDraft) });
    setMessage("Course price updated");
    await load();

    const { data } = await api.get(`/courses/${selectedCourseId}`);
    setSelectedCourse(data);
    setCoursePriceDraft(String(data.price));
  };

  return (
    <div className="stack-page">
      <h1>Admin Control Center</h1>
      {message && <p className="info-text">{message}</p>}

      <div className="tab-bar">
        <button className={tab === "users" ? "tab-btn active" : "tab-btn"} onClick={() => setTab("users")}>Users</button>
        <button className={tab === "courses" ? "tab-btn active" : "tab-btn"} onClick={() => setTab("courses")}>Courses</button>
        <button className={tab === "enrollments" ? "tab-btn active" : "tab-btn"} onClick={() => setTab("enrollments")}>Enrollments</button>
      </div>

      {tab === "users" && (
        <section className="split-grid">
          <article className="card">
            <h2>{editingUserId ? "Edit User" : "Create User"}</h2>
            <form className="stack-form" onSubmit={submitUser}>
              <input name="name" value={form.name} onChange={onChange} placeholder="Name" required />
              <input name="email" type="email" value={form.email} onChange={onChange} placeholder="Email" required />
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={onChange}
                placeholder={editingUserId ? "Optional new password" : "Password"}
                required={!editingUserId}
              />
              <select name="role" value={form.role} onChange={onChange}>
                <option value="student">Student</option>
                <option value="tutor">Tutor</option>
                <option value="admin">Admin</option>
              </select>
              <button>{editingUserId ? "Update User" : "Create User"}</button>
            </form>
          </article>

          <article className="card">
            <h2>User Management</h2>
            <div className="list-grid">
              {users.map((user) => (
                <div key={user._id} className="list-item">
                  <div>
                    <strong>{user.name}</strong>
                    <p>
                      {user.email} | {user.role}
                    </p>
                  </div>
                  <div className="row-actions">
                    <button onClick={() => editUser(user)}>Edit</button>
                    <button className="danger-btn" onClick={() => removeUser(user._id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>
      )}

      {tab === "courses" && (
        <section className="split-grid">
          <article className="card">
            <h2>Course Catalog</h2>
            <div className="list-grid">
              {courses.map((course) => (
                <div key={course._id} className="list-item">
                  <div>
                    <strong>{course.title}</strong>
                    <p>
                      {course.category} | INR {course.price}
                    </p>
                  </div>
                  <button onClick={() => setSelectedCourseId(course._id)}>Details</button>
                </div>
              ))}
            </div>
          </article>

          <article className="card">
            <h2>Course Details</h2>
            {!selectedCourse ? (
              <p>Select a course to inspect details.</p>
            ) : (
              <div className="stack-form">
                <p>
                  <strong>{selectedCourse.title}</strong>
                </p>
                <p>{selectedCourse.description}</p>
                <p>
                  Tutor: {selectedCourse.tutor?.name} | Chapters: {selectedCourse.chapters?.length || 0} | Enrollments: {selectedCourse.enrollmentCount}
                </p>
                <label>
                  Price (INR)
                  <input
                    type="number"
                    value={coursePriceDraft}
                    onChange={(e) => setCoursePriceDraft(e.target.value)}
                  />
                </label>
                <button onClick={updateCoursePrice}>Update Price</button>
                <Link className="btn-secondary" to="/manage-courses">
                  Open Course Studio
                </Link>
                <div className="list-grid">
                  {selectedCourse.chapters?.map((chapter) => (
                    <div key={chapter._id} className="list-item">
                      <div>
                        <strong>
                          {chapter.order}. {chapter.title}
                        </strong>
                        <p>
                          {chapter.contentType} | {chapter.durationMinutes} min
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </article>
        </section>
      )}

      {tab === "enrollments" && (
        <section className="card">
          <h2>Enrollment Operations</h2>
          <div className="info-chip-wrap">
            {selectedCourseId && (
              <span className="info-chip">Selected Course Enrollments: {selectedCourseEnrollments.length}</span>
            )}
            <span className="info-chip">Total Enrollments: {enrollments.length}</span>
          </div>
          <div className="list-grid">
            {enrollments.map((item) => (
              <div key={item._id} className="list-item">
                <div>
                  <strong>{item.course?.title}</strong>
                  <p>
                    {item.student?.name} | {item.paymentStatus} | INR {item.paidAmount} | {item.progressPercent}%
                  </p>
                </div>
                <div className="row-actions">
                  <button onClick={() => updateEnrollment(item._id, "paid")}>Mark Paid</button>
                  <button onClick={() => updateEnrollment(item._id, "pending")}>Mark Pending</button>
                  <button className="danger-btn" onClick={() => removeEnrollment(item._id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
