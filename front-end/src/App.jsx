
import React from "react";
import { Toaster } from "react-hot-toast";

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useParams,
} from "react-router-dom";

// Auth Context
import { AuthProvider } from "./context/AuthContext";

// Auth Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";

// Layouts
import InstructorLayout from "./layouts/InstructorLayout";
import AdminLayout from "./layouts/AdminLayout";
import StudentLayout from "./layouts/StudentLayout";

// Instructor Pages
import InstructorDashboard from "./pages/instructor/InstructorDashboard";
import TeacherCourses from "./pages/instructor/TeacherCourses";
import CourseDetailInstructor from "./pages/instructor/CourseDetailInstructor";
import ManageChapters from "./pages/instructor/ManageChapters";
import ManageLessons from "./pages/instructor/ManageLessons";
import ManageLessonContent from "./pages/instructor/ManageLessonContent";
import QuizEditor from "./pages/instructor/QuizEditor";
import DraftManagement from "./pages/instructor/DraftManagement";
import StudentList from "./pages/instructor/StudentList";
import InstructorReports from "./pages/instructor/InstructorReports";

// Student Pages
import HomeContent from "./pages/student/HomeContent";
import SearchResults from "./pages/student/SearchResults";
import CourseCatalog from "./pages/student/CourseCatalog";
import CourseDetailPage from "./pages/student/CourseDetailPage";
import MyCourses from "./pages/student/MyCourses";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageAccounts from "./pages/admin/ManageAccounts";
import ManageRoles from "./pages/admin/ManageRoles";
import ManageCategories from "./pages/admin/ManageCategories";
import ManageCourses from "./pages/admin/ManageCourses";
import ManagePayments from "./pages/admin/ManagePayments";
import AdminReports from "./pages/admin/AdminReports";

// Route bảo vệ
import ProtectedRoute from "./components/auth/ProtectedRoute";
// ================= COURSE DETAIL =================

function StudentCourseDetailRoute() {
  const { courseId } = useParams();

  return <CourseDetailPage courseId={courseId} />;
}

// ================= APP ROUTES =================

function AppRoutes() {
  return (
    <Routes>
      {/* ============== AUTH ============== */}

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />

      <Route
        path="/forgot-password"
        element={<ForgotPassword />}
      />

      {/* ============== INSTRUCTOR ============== */}

      <Route
        element={
          <ProtectedRoute allowedRoles={["INSTRUCTOR"]} />
        }
      >
        <Route
          path="/instructor"
          element={<InstructorLayout />}
        >
          <Route
            index
            element={<InstructorDashboard />}
          />

          <Route
            path="courses"
            element={<TeacherCourses />}
          />

          <Route
            path="courses/:courseId"
            element={<CourseDetailInstructor />}
          />

          <Route
            path="courses/:courseId/chapters"
            element={<ManageChapters />}
          />

          <Route
            path="courses/:courseId/chapters/:chapterId"
            element={<ManageLessons />}
          />

          <Route
            path="courses/:courseId/chapters/:chapterId/lessons/:lessonId"
            element={<ManageLessonContent />}
          />

          <Route
            path="courses/:courseId/chapters/:chapterId/lessons/:lessonId/quiz"
            element={<QuizEditor />}
          />

          <Route
            path="courses/:courseId/students"
            element={<StudentList />}
          />

          <Route
            path="drafts"
            element={<DraftManagement />}
          />

          <Route
            path="reports"
            element={<InstructorReports />}
          />
        </Route>
      </Route>

      {/* ============== ADMIN ============== */}

      <Route
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]} />
        }
      >
        <Route
          path="/admin"
          element={<AdminLayout />}
        >
          <Route
            index
            element={<AdminDashboard />}
          />

          <Route
            path="accounts"
            element={<ManageAccounts />}
          />

          <Route
            path="roles"
            element={<ManageRoles />}
          />

          <Route
            path="categories"
            element={<ManageCategories />}
          />

          <Route
            path="courses"
            element={<ManageCourses />}
          />

          <Route
            path="payments"
            element={<ManagePayments />}
          />

          <Route
            path="reports"
            element={<AdminReports />}
          />
        </Route>
      </Route>

      {/* ============== STUDENT PUBLIC ============== */}

      <Route
        path="/student"
        element={<StudentLayout />}
      >
        <Route
          index
          element={<HomeContent />}
        />

        <Route
          path="search"
          element={<SearchResults />}
        />

        <Route
          path="courses"
          element={<CourseCatalog />}
        />

        <Route
          path="courses/:courseId"
          element={<StudentCourseDetailRoute />}
        />
        {/* Khóa học của tôi - yêu cầu đăng nhập STUDENT */}
        <Route element={<ProtectedRoute allowedRoles={["Student"]} />}>
          <Route
            path="my-courses"
            element={<MyCourses />}
          />
        </Route>
      </Route>

      {/* ============== DEFAULT ============== */}

      <Route
        path="/"
        element={<Navigate to="/student" replace />}
      />

      <Route
        path="*"
        element={<Navigate to="/student" replace />}
      />
    </Routes>
  );
}

// ================= MAIN APP =================

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster
          position="top-right"
          reverseOrder={false}
          toastOptions={{
            duration: 3000,
            icon: null,
            style: {
              borderRadius: "10px",
              padding: "12px 16px",
              fontSize: "14px",
              fontWeight: "500",
              boxShadow:
                "0 4px 12px rgba(0,0,0,0.12)",
              minWidth: "300px",
            },
            success: {
              style: {
                background: "#16A34A",
                color: "#FFFFFF",
              },
            },
            error: {
              style: {
                background: "#DC2626",
                color: "#FFFFFF",
              },
            },
          }}
        />

        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}
