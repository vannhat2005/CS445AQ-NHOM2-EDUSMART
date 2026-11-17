
import React from "react";
import { Outlet } from "react-router-dom";

import Header from "../components/student/Header.jsx";
import Footer from "../components/student/Footer.jsx";

const StudentLayout = () => {
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
