import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

const emptyCourse = {
  title: "",
  description: "",
  category: "",
  price: 0,
  currency: "INR",
  thumbnail: "",
  tutorId: ""
};

const emptyChapter = {
  title: "",
  contentType: "video",
  contentUrl: "",
  durationMinutes: 10,
  order: 1
};

export default function ManageCoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [courseForm, setCourseForm] = useState(emptyCourse);
  const [chapterForm, setChapterForm] = useState(emptyChapter);
  const [editingCourseId, setEditingCourseId] = useState("");
  const [editingChapterId, setEditingChapterId] = useState("");
  const [quickPrice, setQuickPrice] = useState("");
  const [message, setMessage] = useState("");

  const selectedCourse = useMemo(
    () => courses.find((course) => course._id === selectedCourseId),
    [courses, selectedCourseId]
  );

  const loadCourseDetail = useCallback(async (courseId) => {
    const { data } = await api.get(`/courses/${courseId}`);
    setCourses((prev) => prev.map((item) => (item._id === courseId ? data : item)));
  }, []);

  const load = useCallback(async () => {
    const [courseRes, tutorRes] = await Promise.all([
      api.get("/courses/mine"),
      user.role === "admin" ? api.get("/admin/users") : Promise.resolve({ data: [] })
    ]);

    setCourses(courseRes.data);
    setSelectedCourseId((prev) => prev || courseRes.data[0]?._id || "");

    setTutors(tutorRes.data.filter((item) => item.role === "tutor"));
  }, [user.role]);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const [courseRes, tutorRes] = await Promise.all([
          api.get("/courses/mine"),
          user.role === "admin" ? api.get("/admin/users") : Promise.resolve({ data: [] })
        ]);

        if (!active) {
          return;
        }

        setCourses(courseRes.data);
        setSelectedCourseId((prev) => prev || courseRes.data[0]?._id || "");
        setTutors(tutorRes.data.filter((item) => item.role === "tutor"));
      } catch {
        if (active) {
          setMessage("Unable to load course management data");
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [user.role]);

  useEffect(() => {
    let active = true;
    if (!selectedCourseId) return () => {};

    (async () => {
      try {
        const { data } = await api.get(`/courses/${selectedCourseId}`);
        if (active) {
          setCourses((prev) => prev.map((item) => (item._id === selectedCourseId ? data : item)));
          setQuickPrice(data?.price !== undefined ? String(data.price) : "");
        }
      } catch {
        // no-op
      }
    })();

    return () => {
      active = false;
    };
  }, [selectedCourseId]);

  const onCourseField = (e) => {
    setCourseForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const onChapterField = (e) => {
    setChapterForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const submitCourse = async (e) => {
    e.preventDefault();
    try {
      if (editingCourseId) {
        await api.put(`/courses/${editingCourseId}`, {
          ...courseForm,
          price: Number(courseForm.price)
        });
        setMessage("Course updated");
      } else {
        await api.post("/courses", {
          ...courseForm,
          price: Number(courseForm.price)
        });
        setMessage("Course created");
      }

      setCourseForm(emptyCourse);
      setEditingCourseId("");
      await load();
    } catch (error) {
      setMessage(error.response?.data?.message || "Course action failed");
    }
  };

  const editCourse = (course) => {
    setEditingCourseId(course._id);
    setCourseForm({
      title: course.title,
      description: course.description,
      category: course.category,
      price: course.price,
      currency: course.currency,
      thumbnail: course.thumbnail || "",
      tutorId: course.tutor?._id || ""
    });
  };

  const removeCourse = async (courseId) => {
    if (!window.confirm("Delete this course and all related chapters/enrollments?")) {
      return;
    }

    await api.delete(`/courses/${courseId}`);
    setMessage("Course deleted");
    if (selectedCourseId === courseId) {
      setSelectedCourseId("");
    }
    await load();
  };

  const submitChapter = async (e) => {
    e.preventDefault();
    if (!selectedCourseId) {
      return;
    }

    const payload = {
      ...chapterForm,
      durationMinutes: Number(chapterForm.durationMinutes),
      order: Number(chapterForm.order)
    };

    if (editingChapterId) {
      await api.put(`/courses/${selectedCourseId}/chapters/${editingChapterId}`, payload);
      setMessage("Chapter updated");
    } else {
      await api.post(`/courses/${selectedCourseId}/chapters`, payload);
      setMessage("Chapter created");
    }

    setEditingChapterId("");
    setChapterForm(emptyChapter);
    await loadCourseDetail(selectedCourseId);
    await load();
  };

  const editChapter = (chapter) => {
    setEditingChapterId(chapter._id);
    setChapterForm({
      title: chapter.title,
      contentType: chapter.contentType,
      contentUrl: chapter.contentUrl,
      durationMinutes: chapter.durationMinutes,
      order: chapter.order
    });
  };

  const removeChapter = async (chapterId) => {
    if (!selectedCourseId) {
      return;
    }

    await api.delete(`/courses/${selectedCourseId}/chapters/${chapterId}`);
    setMessage("Chapter deleted");
    await loadCourseDetail(selectedCourseId);
    await load();
  };

  const currentChapters = selectedCourse?.chapters || [];

  const updateQuickPrice = async () => {
    if (!selectedCourseId || quickPrice === "") return;
    await api.put(`/courses/${selectedCourseId}`, { price: Number(quickPrice) });
    setMessage("Course price updated");
    await loadCourseDetail(selectedCourseId);
    await load();
  };

  return (
    <div className="stack-page">
      <h1>Course Studio</h1>
      {message && <p className="info-text">{message}</p>}

      <section className="split-grid">
        <article className="card">
          <h2>{editingCourseId ? "Edit Course" : "Create Course"}</h2>
          <form className="stack-form" onSubmit={submitCourse}>
            <input name="title" placeholder="Course Title" value={courseForm.title} onChange={onCourseField} required />
            <input
              name="description"
              placeholder="Course Description"
              value={courseForm.description}
              onChange={onCourseField}
              required
            />
            <input name="category" placeholder="Category" value={courseForm.category} onChange={onCourseField} required />
            <input name="price" type="number" placeholder="Price" value={courseForm.price} onChange={onCourseField} required />
            <input name="currency" placeholder="Currency" value={courseForm.currency} onChange={onCourseField} required />
            <input name="thumbnail" placeholder="Thumbnail URL" value={courseForm.thumbnail} onChange={onCourseField} />

            {user.role === "admin" && (
              <select name="tutorId" value={courseForm.tutorId} onChange={onCourseField}>
                <option value="">Assign Tutor</option>
                {tutors.map((tutor) => (
                  <option key={tutor._id} value={tutor._id}>
                    {tutor.name}
                  </option>
                ))}
              </select>
            )}

            <button>{editingCourseId ? "Update Course" : "Create Course"}</button>
          </form>
        </article>

        <article className="card">
          <h2>Existing Courses</h2>
          <div className="list-grid">
            {courses.map((course) => (
              <div key={course._id} className="list-item">
                <div>
                  <strong>{course.title}</strong>
                  <p>{course.category}</p>
                </div>
                <div className="row-actions">
                  <button onClick={() => setSelectedCourseId(course._id)}>Chapters</button>
                  <button onClick={() => editCourse(course)}>Edit</button>
                  <button className="danger-btn" onClick={() => removeCourse(course._id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="card">
        <h2>Chapter Manager</h2>
        <p>Selected Course: {selectedCourse?.title || "None"}</p>
        {selectedCourseId && (
          <div className="inline-action">
            <input
              type="number"
              value={quickPrice}
              onChange={(e) => setQuickPrice(e.target.value)}
              placeholder="Update course price"
            />
            <button onClick={updateQuickPrice}>Save Price</button>
          </div>
        )}

        {selectedCourseId && (
          <>
            <form className="stack-form" onSubmit={submitChapter}>
              <input name="title" placeholder="Chapter Title" value={chapterForm.title} onChange={onChapterField} required />
              <select name="contentType" value={chapterForm.contentType} onChange={onChapterField}>
                <option value="video">Video</option>
                <option value="article">Article</option>
                <option value="quiz">Quiz</option>
              </select>
              <input name="contentUrl" placeholder="Content URL" value={chapterForm.contentUrl} onChange={onChapterField} />
              <input
                name="durationMinutes"
                type="number"
                placeholder="Duration"
                value={chapterForm.durationMinutes}
                onChange={onChapterField}
              />
              <input name="order" type="number" placeholder="Order" value={chapterForm.order} onChange={onChapterField} />
              <button>{editingChapterId ? "Update Chapter" : "Add Chapter"}</button>
            </form>

            <div className="list-grid">
              {currentChapters.map((chapter) => (
                <div key={chapter._id} className="list-item">
                  <div>
                    <strong>
                      {chapter.order}. {chapter.title}
                    </strong>
                    <p>
                      {chapter.contentType} | {chapter.durationMinutes} min
                    </p>
                  </div>
                  <div className="row-actions">
                    <button onClick={() => editChapter(chapter)}>Edit</button>
                    <button className="danger-btn" onClick={() => removeChapter(chapter._id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
