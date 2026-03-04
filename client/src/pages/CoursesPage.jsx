import { useEffect, useState } from "react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export default function CoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loadingId, setLoadingId] = useState("");
  const [message, setMessage] = useState("");
  const [paymentConfig, setPaymentConfig] = useState(null);

  const fetchCourses = async () => {
    const { data } = await api.get("/courses");
    setCourses(data);
  };

  useEffect(() => {
    Promise.all([fetchCourses(), api.get("/payments/config")])
      .then(([, paymentRes]) => setPaymentConfig(paymentRes.data))
      .catch(() => setMessage("Unable to load courses"));
  }, []);

  const enroll = async (courseId) => {
    setLoadingId(courseId);
    try {
      const { data } = await api.post("/payments/create-order", { courseId });

      if (data.freeEnrollment) {
        setMessage("You are enrolled in this free course.");
        return;
      }

      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setMessage("Razorpay SDK failed to load");
        return;
      }

      if (data.mockMode) {
        await api.post("/payments/verify", {
          courseId,
          razorpay_order_id: data.order.id,
          razorpay_payment_id: `mock_pay_${Date.now()}`,
          razorpay_signature: "mock_signature",
          mockMode: true
        });
        setMessage("Enrollment successful in mock payment mode.");
        return;
      }

      const options = {
        key: data.key,
        amount: data.order.amount,
        currency: data.order.currency,
        name: "LMS Frutyo",
        description: "Course Enrollment",
        order_id: data.order.id,
        handler: async (response) => {
          await api.post("/payments/verify", {
            courseId,
            ...response
          });
          setMessage("Payment successful and enrollment completed.");
        },
        prefill: {
          name: user.name,
          email: user.email
        },
        theme: {
          color: "#0c3b2e"
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      setMessage(error.response?.data?.message || "Enrollment failed");
    } finally {
      setLoadingId("");
    }
  };

  return (
    <div className="stack-page">
      <h1>Courses</h1>
      {paymentConfig && (
        <p className="info-text">
          Razorpay Mode: <strong>{paymentConfig.mode}</strong>{" "}
          {!paymentConfig.enabled && "(mock enrollment is enabled until test/live keys are configured)."}
        </p>
      )}
      {message && <p className="info-text">{message}</p>}
      <section className="course-grid">
        {courses.map((course) => (
          <article key={course._id} className="card course-card">
            <h3>{course.title}</h3>
            <p>{course.description}</p>
            <p>
              <strong>Category:</strong> {course.category}
            </p>
            <p>
              <strong>Tutor:</strong> {course.tutor?.name}
            </p>
            <p>
              <strong>Price:</strong> {course.price === 0 ? "Free" : `INR ${course.price}`}
            </p>
            <p>
              <strong>Chapters:</strong> {course.chaptersCount} | <strong>Enrollments:</strong>{" "}
              {course.enrollmentCount}
            </p>

            {user.role === "student" && (
              <button onClick={() => enroll(course._id)} disabled={loadingId === course._id}>
                {loadingId === course._id ? "Processing..." : "Enroll with Razorpay"}
              </button>
            )}
          </article>
        ))}
      </section>
    </div>
  );
}
