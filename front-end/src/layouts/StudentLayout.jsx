import React from "react";
import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import Header from "../components/student/Header.jsx";
import Footer from "../components/student/Footer.jsx";

const StudentLayout = () => {
  const { isAuthenticated, loading, isInstructor, isAdmin } = useAuth();

  // Đang khôi phục phiên đăng nhập thì chờ, không render vội
  if (loading) {
    return null;
  }

  // Phân quyền chặt chẽ: Giảng viên hoặc Quản trị viên tuyệt đối không vào giao diện học sinh
  if (isAuthenticated) {
    if (isInstructor) {
      return <Navigate to="/instructor" replace />;
    }
    if (isAdmin) {
      return <Navigate to="/admin" replace />;
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="flex-1">
        <Outlet />
      </div>

      <Footer />
    </div>
  );
};

export default StudentLayout;
