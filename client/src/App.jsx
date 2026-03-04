import { Navigate, Route, Routes } from "react-router-dom";
import Shell from "./components/Shell";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import AdminStudioPage from "./pages/AdminStudioPage";
import CoursesPage from "./pages/CoursesPage";
import DashboardPage from "./pages/DashboardPage";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import ManageCoursesPage from "./pages/ManageCoursesPage";
import MyLearningPage from "./pages/MyLearningPage";
import RegisterPage from "./pages/RegisterPage";

function HomeRedirect() {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/" replace />;
  }
  return <DashboardPage />;
}

export default function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <HomeRedirect />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses"
          element={
            <ProtectedRoute>
              <CoursesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-learning"
          element={
            <ProtectedRoute roles={["student"]}>
              <MyLearningPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manage-courses"
          element={
            <ProtectedRoute roles={["admin", "tutor"]}>
              <ManageCoursesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-studio"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminStudioPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
}
