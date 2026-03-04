import { useEffect, useState } from "react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

function Stat({ label, value }) {
  return (
    <article className="card stat-card">
      <h3>{label}</h3>
      <p>{value}</p>
    </article>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [adminStats, setAdminStats] = useState(null);
  const [studentStats, setStudentStats] = useState({ enrolled: 0, avgProgress: 0, points: 0 });
  const [tutorStats, setTutorStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    const load = async () => {
      if (user.role === "admin") {
        const { data } = await api.get("/admin/stats");
        setAdminStats(data);
      }

      if (user.role === "student") {
        const [enrollRes, boardRes] = await Promise.all([
          api.get("/enrollments/my"),
          api.get("/enrollments/leaderboard/global")
        ]);

        const enrollments = enrollRes.data;
        const points = enrollments.reduce((sum, item) => sum + item.points, 0);
        const avgProgress =
          enrollments.length > 0
            ? Math.round(enrollments.reduce((sum, item) => sum + item.progressPercent, 0) / enrollments.length)
            : 0;

        setStudentStats({ enrolled: enrollments.length, avgProgress, points });
        setLeaderboard(boardRes.data);
      }

      if (user.role === "tutor") {
        const [overviewRes, boardRes] = await Promise.all([
          api.get("/enrollments/tutor/overview"),
          api.get("/enrollments/leaderboard/global")
        ]);
        setTutorStats(overviewRes.data);
        setLeaderboard(boardRes.data);
      }
    };

    load().catch(() => null);
  }, [user.role]);

  return (
    <div className="stack-page">
      <h1>Dashboard</h1>

      {user.role === "admin" && adminStats && (
        <section className="grid-4">
          <Stat label="Users" value={adminStats.users} />
          <Stat label="Courses" value={adminStats.courses} />
          <Stat label="Enrollments" value={adminStats.enrollments} />
          <Stat label="Revenue (INR)" value={adminStats.revenue} />
        </section>
      )}

      {user.role === "student" && (
        <section className="grid-3">
          <Stat label="My Enrollments" value={studentStats.enrolled} />
          <Stat label="Average Progress" value={`${studentStats.avgProgress}%`} />
          <Stat label="Total Points" value={studentStats.points} />
        </section>
      )}

      {user.role === "tutor" && tutorStats && (
        <section className="grid-4">
          <Stat label="Courses" value={tutorStats.courseCount} />
          <Stat label="Enrollments" value={tutorStats.enrollmentCount} />
          <Stat label="Revenue (INR)" value={tutorStats.revenue} />
          <Stat label="Avg Progress" value={`${tutorStats.avgProgress}%`} />
        </section>
      )}

      {(user.role === "student" || user.role === "tutor") && (
        <section className="card">
          <h2>Leaderboard</h2>
          <div className="table-like">
            <div className="table-head">
              <span>Rank</span>
              <span>Name</span>
              <span>Points</span>
              <span>Progress</span>
            </div>
            {leaderboard.map((item, idx) => (
              <div key={item.studentId} className="table-row">
                <span>#{idx + 1}</span>
                <span>{item.name}</span>
                <span>{item.totalPoints}</span>
                <span>{item.avgProgress}%</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
