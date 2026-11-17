import React from 'react';
import { Toaster } from 'react-hot-toast';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useParams,
} from "react-router-dom";

// 1. Import các trang Auth (Đứng độc lập, không kế thừa Layout)
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassWord'; // Lưu ý tên file tùy bạn đặt trong thư mục auth

// 2. Import Layouts
import InstructorLayout from './layouts/InstructorLayout';
import AdminLayout from './layouts/AdminLayout';
import StudentLayout from './layouts/StudentLayout';

// 3. Import các trang của Giảng viên (Ví dụ tạm thời các trang cơ bản)
// Bạn có thể tạo thêm các file trang khác theo danh sách đã bàn
import InstructorDashboard from './pages/instructor/InstructorDashboard'; // Hoặc trang chủ GV của bạn
import TeacherCourses from './pages/instructor/TeacherCourses';
import CourseDetailInstructor from './pages/instructor/CourseDetailInstructor';
import ManageChapters from './pages/instructor/ManageChapters';
import ManageLessons from './pages/instructor/ManageLessons';
import ManageLessonContent from './pages/instructor/ManageLessonContent';
import QuizEditor from './pages/instructor/QuizEditor';
import DraftManagement from './pages/instructor/DraftManagement';
import StudentList from './pages/instructor/StudentList';
import InstructorReports from './pages/instructor/InstructorReports';

// 4. Import các trang của Học viên (STUDENT) - THÊM MỚI
import HomeContent from './pages/student/HomeContent';
import SearchResults from './pages/student/SearchResults';
import CourseCatalog from "./pages/student/CourseCatalog.jsx";
import CourseDetailPage from "./pages/student/CourseDetailPage";

function StudentCourseDetailRoute() {
  const { courseId } = useParams();

  return <CourseDetailPage courseId={courseId} />;
}

function App() {
  return (
    <Router>
      {/* Cấu hình Toaster cho thông báo toast */}
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          duration: 3000,
          icon: null,
          style: {
            borderRadius: '10px',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
            minWidth: '300px',
          },
          success: {
            icon: null,
            style: {
              background: '#16A34A',
              color: '#FFFFFF',
            },
          },
          error: {
            icon: null,
            style: {
              background: '#DC2626',
              color: '#FFFFFF',
            },
          },
        }}
      />

      {/* Cấu hình các route cho ứng dụng */}
      <Routes>
        {/*  ================= PHÂN HỆ AUTH ================= */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* ================= PHÂN HỆ ADMIN ================= */}
        <Route path="/instructor" element={<InstructorLayout />}>
          <Route index element={<InstructorDashboard />} />
          <Route path="courses" element={<TeacherCourses />} />
          <Route path="courses/:courseId" element={<CourseDetailInstructor />} />
          <Route path="courses/1/chapters" element={<ManageChapters />} />
          <Route path="courses/1/chapters/1" element={<ManageLessons />} />
          <Route path="courses/1/chapters/1/lessons/1" element={<ManageLessonContent />} />
          <Route path="courses/1/chapters/1/lessons/1/quiz" element={<QuizEditor />} />
          <Route path="courses/1/students" element={<StudentList />} />
          <Route path="drafts" element={<DraftManagement />} />
          <Route path="reports" element={<InstructorReports />} />
        </Route>


        {/* ================= PHÂN HỆ GIẢNG VIÊN ================= */}
        <Route path="/admin" element={<AdminLayout />}>


        </Route>

        {/* ================= PHÂN HỆ HỌC VIÊN ================= */}
        <Route path="/student" element={<StudentLayout />}>
          <Route index element={<HomeContent />} />

          <Route path="search" element={<SearchResults />} />

          <Route path="courses" element={<CourseCatalog />} />

          {/* Trang chi tiết khóa học */}
          <Route
            path="courses/:courseId"
            element={<StudentCourseDetailRoute />}
          />
        </Route>

        {/* Điều hướng mặc định */}
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />

      </Routes>
    </Router>
  );
}

export default App;