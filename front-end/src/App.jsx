import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

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


function App() {
  return (
    <Router>
      <Routes>
        /* ================= PHÂN HỆ AUTH ================= */
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        /* ================= PHÂN HỆ GIẢNG VIÊN ================= */
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


        /* ================= PHÂN HỆ ADMIN  ================= */
        <Route path="/admin" element={<AdminLayout />}>
          

        </Route>

        /* ================= PHÂN HỆ HỌC VIÊN ================= */
        <Route path="/student" element={<StudentLayout />}>
          
          
        </Route>


        /* Điều hướng mặc định khi truy cập root hoặc trang không tồn tại */
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;