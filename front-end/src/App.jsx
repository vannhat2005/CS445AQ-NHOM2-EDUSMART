
import React from "react";
import { Toaster } from "react-hot-toast";

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useParams,
  useNavigate,
  useLocation,
} from "react-router-dom";

// ==========================================
// AUTH CONTEXT
// ==========================================

import { AuthProvider, useAuth } from "./context/AuthContext";

// ==========================================
// AUTH PAGES
// ==========================================

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";

// ==========================================
// LAYOUTS
// ==========================================

import InstructorLayout from "./layouts/InstructorLayout";
import AdminLayout from "./layouts/AdminLayout";
import StudentLayout from "./layouts/StudentLayout";

// ==========================================
// INSTRUCTOR PAGES
// ==========================================

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

// ==========================================
// STUDENT PAGES
// ==========================================

import HomeContent from "./pages/student/HomeContent";
import SearchResults from "./pages/student/SearchResults";
import CourseCatalog from "./pages/student/CourseCatalog";
import CourseDetailPage from "./pages/student/CourseDetailPage";
import MyCourses from "./pages/student/MyCourses";

// TRANG THANH TOÁN MOMO / ZALOPAY
import CheckoutPage from "./pages/student/CheckoutPage";

// TRANG HỌC BÀI
import LessonLearningPage from "./pages/student/LessonLearningPage";

// TRANG THI TRẮC NGHIỆM QUIZ
import QuizExamPage from "./pages/student/QuizExamPage";

// ==========================================
// ADMIN PAGES
// ==========================================

import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageAccounts from "./pages/admin/ManageAccounts";
import ManageRoles from "./pages/admin/ManageRoles";
import ManageCategories from "./pages/admin/ManageCategories";
import ManageCourses from "./pages/admin/ManageCourses";
import ManagePayments from "./pages/admin/ManagePayments";
import AdminReports from "./pages/admin/AdminReports";

// ==========================================
// PROTECTED ROUTE
// ==========================================

import ProtectedRoute from "./components/auth/ProtectedRoute";

// ==========================================
// STUDENT COURSE DETAIL ROUTE
// ==========================================

function StudentCourseDetailRoute() {
  const { courseId } = useParams();

  return (
    <CourseDetailPage
      courseId={courseId}
    />
  );
}

// ==========================================
// STUDENT CHECKOUT ROUTE
// ==========================================

function StudentCheckoutRoute() {
  const { courseId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const id = Number(courseId);

  if (!Number.isInteger(id) || id <= 0) {
    return <Navigate to="/student/courses" replace />;
  }

  return (
    <CheckoutPage
      courseId={id}
      course={location.state?.course}
      onBack={() => navigate(`/student/courses/${id}`)}
      onPaid={() =>
        navigate("/student/my-courses", { replace: true })
      }
    />
  );
}

// ==========================================
// ĐIỀU HƯỚNG TỰ ĐỘNG THEO ROLE TẠI TRANG CHỦ / VÀ 404
// ==========================================

function RoleBasedRedirect() {
  const { isAuthenticated, loading, isInstructor, isAdmin } = useAuth();

  if (loading) {
    return null;
  }

  if (isAuthenticated) {
    if (isAdmin) {
      return <Navigate to="/admin" replace />;
    }
    if (isInstructor) {
      return <Navigate to="/instructor" replace />;
    }
    return <Navigate to="/student" replace />;
  }

  return <Navigate to="/student" replace />;
}

// ==========================================
// APP ROUTES
// ==========================================

function AppRoutes() {
  return (
    <Routes>

      {/* =====================================
          AUTH
      ===================================== */}

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

      {/* =====================================
          INSTRUCTOR
      ===================================== */}

      <Route
        element={
          <ProtectedRoute
            allowedRoles={["INSTRUCTOR"]}
          />
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

      {/* =====================================
          ADMIN
      ===================================== */}

      <Route
        element={
          <ProtectedRoute
            allowedRoles={["ADMIN"]}
          />
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

      {/* =====================================
          STUDENT LAYOUT
      ===================================== */}

      <Route
        path="/student"
        element={<StudentLayout />}
      >

        {/* =================================
            PUBLIC STUDENT PAGES
        ================================= */}

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

        {/* =================================
            STUDENT PROTECTED PAGES
        ================================= */}

        <Route
          element={
            <ProtectedRoute
              allowedRoles={["Student"]}
            />
          }
        >

          {/* =================================
              TRANG THANH TOÁN

              URL:
              /student/courses/:courseId/checkout

              Sau khi xác nhận thanh toán, backend tạo
              đăng ký Pending và trả registrationId.

              MOMO:
              POST /api/student/checkout/
              {registrationId}/pay/momo

              ZALOPAY:
              POST /api/student/checkout/
              {registrationId}/pay/zalopay
          ================================= */}

          <Route
            path="courses/:courseId/checkout"
            element={<StudentCheckoutRoute />}
          />

          {/* =================================
              KHÓA HỌC CỦA TÔI
          ================================= */}

          <Route
            path="my-courses"
            element={<MyCourses />}
          />

          {/* =================================
              TRANG HỌC BÀI

              GET:
              /api/student/courses/
              {courseId}/lessons/{lessonId}
          ================================= */}

          <Route
            path="courses/:courseId/lessons/:lessonId"
            element={<LessonLearningPage />}
          />

          {/* =================================
              TRANG LÀM BÀI TRẮC NGHIỆM QUIZ
              GET: /api/student/quizzes/{quizId}
          ================================= */}
          <Route
            path="courses/:courseId/lessons/:lessonId/quiz/:quizId"
            element={<QuizExamPage />}
          />
          <Route
            path="courses/:courseId/quiz/:quizId"
            element={<QuizExamPage />}
          />
          <Route
            path="quiz/:quizId"
            element={<QuizExamPage />}
          />

        </Route>
      </Route>

      {/* =====================================
          DEFAULT ROUTES
      ===================================== */}

      <Route
        path="/"
        element={<RoleBasedRedirect />}
      />

      <Route
        path="*"
        element={<RoleBasedRedirect />}
      />

    </Routes>
  );
}

// ==========================================
// MAIN APP
// ==========================================

export default function App() {
  return (
    <Router>
      <AuthProvider>

        {/* =================================
            TOAST NOTIFICATIONS
        ================================= */}

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

        {/* =================================
            ROUTES
        ================================= */}

        <AppRoutes />

      </AuthProvider>
    </Router>
  );
}
