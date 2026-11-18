
import React, { useEffect } from "react";
import { createPortal } from "react-dom";

import {
  LogOut,
  X,
  LoaderCircle,
} from "lucide-react";

const LogoutModal = ({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !loading) {
        onClose();
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="
        fixed inset-0 z-[9999]
        flex items-center justify-center
        bg-black/50
        p-4 backdrop-blur-sm
      "
    >
      {/* OVERLAY */}
      <div
        className="absolute inset-0"
        onClick={() => {
          if (!loading) onClose();
        }}
      />

      {/* MODAL */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-title"
        className="
          relative z-10
          w-full max-w-md
          rounded-2xl
          border border-gray-100
          bg-white p-6
          shadow-2xl
        "
      >
        {/* HEADER */}
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
            <LogOut size={24} />
          </div>

          <div className="flex-1">
            <h3
              id="logout-title"
              className="text-xl font-bold text-gray-900"
            >
              Xác nhận đăng xuất
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Tài khoản EduSmart
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Đóng"
            className="
              rounded-lg p-1
              text-gray-400
              transition hover:bg-gray-100
              hover:text-gray-700
              disabled:opacity-50
            "
          >
            <X size={20} />
          </button>
        </div>

        {/* CONTENT */}
        <p className="mt-5 text-sm leading-6 text-gray-600">
          Bạn có chắc chắn muốn đăng xuất khỏi
          tài khoản EduSmart của mình không?
        </p>

        {/* ACTIONS */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-100 pt-5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="
              rounded-lg border border-gray-200
              px-5 py-2.5
              text-sm font-semibold text-gray-700
              transition hover:bg-gray-50
              disabled:opacity-50
            "
          >
            Hủy
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="
              flex items-center justify-center
              gap-2 rounded-lg
              bg-red-600 px-5 py-2.5
              text-sm font-semibold text-white
              transition hover:bg-red-700
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            {loading ? (
              <LoaderCircle
                size={18}
                className="animate-spin"
              />
            ) : (
              <LogOut size={18} />
            )}

            {loading
              ? "Đang đăng xuất..."
              : "Đăng xuất"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default LogoutModal;
