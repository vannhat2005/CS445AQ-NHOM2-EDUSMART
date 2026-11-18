
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { toast } from "react-hot-toast";

import { useAuth } from "../../context/AuthContext";
import LogoutModal from "../common/LogoutModal";
export default function LogoutButton({
  className = "",
  children,
}) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (loading) return;

    setLoading(true);

    try {
      await logout();

      setIsOpen(false);

      toast.success("Đăng xuất thành công!");

      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      console.error("Lỗi đăng xuất:", error);

      toast.error(
        "Không thể đăng xuất. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={
          className ||
          "flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
        }
      >
        {children ?? (
          <>
            <LogOut size={18} />
            <span>Đăng xuất</span>
          </>
        )}
      </button>

      <LogoutModal
        isOpen={isOpen}
        onClose={() => {
          if (!loading) setIsOpen(false);
        }}
        onConfirm={handleConfirm}
        loading={loading}
      />
    </>
  );
}
