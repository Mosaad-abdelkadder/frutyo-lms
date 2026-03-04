import { useEffect, useState } from "react";
import api from "../api/client";

export default function MyLearningPage() {
  const [enrollments, setEnrollments] = useState([]);
  const [courseDetail, setCourseDetail] = useState({});

  const fetchAll = async () => {
    const { data } = await api.get("/enrollments/my");
    setEnrollments(data);

    const details = {};
    await Promise.all(
      data.map(async (enrollment) => {
        const response = await api.get(`/courses/${enrollment.course._id}`);
        details[enrollment.course._id] = response.data;
      })
    );

    setCourseDetail(details);
  };

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const { data } = await api.get("/enrollments/my");
        if (!active) {
          return;
        }
        setEnrollments(data);

        const entries = await Promise.all(
          data.map(async (enrollment) => {
            const response = await api.get(`/courses/${enrollment.course._id}`);
            return [enrollment.course._id, response.data];
          })
        );

        if (active) {
          setCourseDetail(Object.fromEntries(entries));
        }
      } catch {
        // no-op
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const completeChapter = async (courseId, chapterId) => {
    await api.post(`/enrollments/${courseId}/progress`, { chapterId });
    await fetchAll();
  };

  return (
    <div className="stack-page">
      <h1>My Learning</h1>

      {enrollments.map((item) => {
        const detail = courseDetail[item.course._id];
        return (
          <article className="card" key={item._id}>
            <h2>{item.course.title}</h2>
            <p>
              Progress: <strong>{item.progressPercent}%</strong> | Points: <strong>{item.points}</strong>
            </p>
            <p>
              Payment: <strong>{item.paymentStatus}</strong> ({item.paidAmount})
            </p>

            <div className="chapter-list">
              {detail?.chapters?.map((chapter) => {
                const done = item.completedChapters.some((id) => String(id) === String(chapter._id));
                return (
                  <div key={chapter._id} className="chapter-row">
                    <span>
                      {chapter.order}. {chapter.title}
                    </span>
                    <button disabled={done} onClick={() => completeChapter(item.course._id, chapter._id)}>
                      {done ? "Completed" : "Mark Complete"}
                    </button>
                  </div>
                );
              })}
            </div>
          </article>
        );
      })}
    </div>
  );
}
