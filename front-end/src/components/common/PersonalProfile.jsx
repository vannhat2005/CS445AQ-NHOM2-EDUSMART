import React, { useEffect, useRef, useState } from "react";
import { UserRound, Lock, Mail, Save, Camera, Undo2, CircleHelp, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import { useAuth } from "../../context/AuthContext";
import { getPersonalProfile, updatePersonalProfile } from "../../services/profileService";

// ========================================
// QUẢN LÝ THÔNG TIN CÁ NHÂN
// ========================================

const PersonalProfile = () => {
  const { updateUserProfile } = useAuth();

  // ========================================
  // 1. KHAI BÁO STATE
  // ========================================

  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState("");
  const [fullNameError, setFullNameError] = useState("");

  // Quản lý ảnh đại diện
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [checkingAvatar, setCheckingAvatar] = useState(false);

  // Quản lý trạng thái xử lý
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Tham chiếu input chọn ảnh
  const avatarInputRef = useRef(null);

  // ========================================
  // 2. LẤY THÔNG TIN CÁ NHÂN
  // ========================================

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setLoadError("");

      const response = await getPersonalProfile();

      if (!response.result) {
        throw new Error("Không tìm thấy thông tin tài khoản");
      }

      setProfile(response.result);
      setFullName(response.result.fullName || "");
      setAvatarFile(null);
      setFullNameError("");

    } catch (error) {
      const message = error.response?.data?.message ||
        error.message || "Không thể tải thông tin cá nhân";

      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Lấy thông tin khi truy cập trang
  useEffect(() => {
    fetchProfile();
  }, []);

  // ========================================
  // 3. TẠO ẢNH XEM TRƯỚC
  // ========================================

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview("");
      return;
    }

    // Tạo URL tạm để hiển thị ảnh
    const previewUrl = URL.createObjectURL(avatarFile);
    setAvatarPreview(previewUrl);

    // Giải phóng URL khi đổi ảnh hoặc rời trang
    return () => URL.revokeObjectURL(previewUrl);
  }, [avatarFile]);

  // ========================================
  // 4. MỞ HỘP THOẠI CHỌN ẢNH
  // ========================================

  const handleOpenAvatar = () => {
    if (loading || saving || checkingAvatar || showConfirmModal) return;
    avatarInputRef.current?.click();
  };

  // ========================================
  // 5. KIỂM TRA ẢNH ĐẠI DIỆN
  // ========================================

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];

    // Cho phép chọn lại cùng một ảnh
    event.target.value = "";

    if (!file || saving || checkingAvatar) return;

    // Kiểm tra tệp ảnh rỗng
    if (file.size === 0) {
      toast.error("Tệp ảnh không hợp lệ hoặc không thể đọc được");
      return;
    }

    // Kiểm tra dung lượng ảnh
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Dung lượng tệp vượt quá 2MB. Vui lòng chọn tệp nhỏ hơn");
      return;
    }

    // Kiểm tra định dạng ảnh
    const allowedTypes = ["image/jpeg", "image/png"];
    const allowedExtension = /\.(jpg|jpeg|png)$/i;

    if (!allowedTypes.includes(file.type) || !allowedExtension.test(file.name)) {
      toast.error("Ảnh đại diện phải có định dạng JPG, JPEG hoặc PNG");
      return;
    }

    // Kiểm tra nội dung ảnh
    setCheckingAvatar(true);
    const imageUrl = URL.createObjectURL(file);

    try {
      const image = new Image();
      image.src = imageUrl;

      // Kiểm tra ảnh có thể giải mã được không
      await image.decode();

      // Kiểm tra kích thước ảnh
      if (image.naturalWidth <= 0 || image.naturalHeight <= 0 ||
          image.naturalWidth > 4096 || image.naturalHeight > 4096) {
        throw new Error("Invalid image");
      }

      // Lưu ảnh hợp lệ để xem trước
      setAvatarFile(file);

    } catch (error) {
      toast.error("Tệp ảnh không hợp lệ hoặc không thể đọc được");
    } finally {
      URL.revokeObjectURL(imageUrl);
      setCheckingAvatar(false);
    }
  };

  // ========================================
  // 6. KHÔI PHỤC ẢNH ĐẠI DIỆN
  // ========================================

  const handleRevertAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview("");

    if (avatarInputRef.current) {
      avatarInputRef.current.value = "";
    }
  };

  // ========================================
  // 7. KIỂM TRA HỌ VÀ TÊN
  // ========================================

  const validateFullName = () => {
    const name = fullName.trim();

    if (!name) {
      setFullNameError("Họ và tên không được để trống");
      return false;
    }

    if (name.length > 100) {
      setFullNameError("Họ và tên không được vượt quá 100 ký tự");
      return false;
    }

    setFullNameError("");
    return true;
  };

  // ========================================
  // 8. KIỂM TRA THÔNG TIN THAY ĐỔI
  // ========================================

  const hasChanges =
    fullName.trim() !== (profile?.fullName || "").trim() ||
    avatarFile !== null;

  // ========================================
  // 9. MỞ MODAL XÁC NHẬN
  // ========================================

  const handleSubmit = (event) => {
    event.preventDefault();

    if (saving || loading || checkingAvatar) return;
    if (!validateFullName()) return;

    if (!hasChanges) {
      toast.error("Thông tin cá nhân chưa có thay đổi");
      return;
    }

    setShowConfirmModal(true);
  };

  // ========================================
  // 10. CẬP NHẬT THÔNG TIN CÁ NHÂN
  // ========================================

  const handleConfirmUpdate = async () => {
    if (saving || checkingAvatar) return;
    if (!validateFullName()) return;

    try {
      setSaving(true);

      // Gửi họ tên và ảnh đại diện lên Backend
      const response = await updatePersonalProfile(
        fullName.trim(),
        avatarFile
      );

      const updatedProfile = response.result;

      if (!updatedProfile) {
        throw new Error("Không nhận được thông tin sau cập nhật");
      }

      // Cập nhật thông tin trên giao diện
      setProfile(updatedProfile);
      setFullName(updatedProfile.fullName || "");

      // Xóa dữ liệu ảnh tạm
      setAvatarFile(null);
      setAvatarPreview("");
      setShowConfirmModal(false);

      // Đồng bộ thông tin trên Header và Sidebar
      updateUserProfile(updatedProfile);

      // Thông báo thành công
      toast.success(
        response.message || "Cập nhật thông tin cá nhân thành công!"
      );

    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        error.message ||
        "Cập nhật thông tin cá nhân thất bại. Vui lòng thử lại"
      );
    } finally {
      setSaving(false);
    }
  };

  // ========================================
  // 11. STYLE DÙNG CHUNG
  // ========================================

  const readOnlyClass =
    "h-10 w-full rounded-lg bg-[#edf2fc] px-3.5 pr-10 text-sm text-slate-600 outline-none cursor-not-allowed";

  const inputClass =
    "h-10 w-full rounded-lg border border-gray-200 bg-white px-3.5 text-sm text-slate-800 outline-none transition-all focus:border-blue-600 focus:ring-1 focus:ring-blue-600";

  // Ưu tiên hiển thị ảnh mới được chọn
  const displayAvatar = avatarPreview || profile?.avatarUrl;

  // ========================================
  // 12. GIAO DIỆN
  // ========================================

  return (
    <div className="w-full min-h-screen bg-[#f5f6fa] p-6">

      {/* TIÊU ĐỀ TRANG */}
      <div className="mb-8">
        <h1 className="text-[28px] font-bold tracking-tight text-slate-900">
          Quản lý thông tin cá nhân
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Xem và cập nhật thông tin tài khoản cá nhân.
        </p>
      </div>

      {/* TRẠNG THÁI ĐANG TẢI */}
      {loading ? (
        <div className="flex max-w-3xl items-center justify-center gap-2 rounded-xl bg-white p-12 text-sm text-slate-500">
          <Loader2 size={20} className="animate-spin" />
          Đang tải thông tin cá nhân...
        </div>
      ) : loadError ? (

        /* TRẠNG THÁI TẢI THẤT BẠI */
        <div className="max-w-3xl rounded-xl border border-red-100 bg-white p-8">
          <p className="text-sm text-red-600">{loadError}</p>
          <button type="button" onClick={fetchProfile}
            className="mt-4 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800">
            Thử lại
          </button>
        </div>

      ) : (

        /* KHUNG THÔNG TIN CÁ NHÂN */
        <div className="w-full max-w-3xl rounded-xl border border-gray-100 bg-white p-8 shadow-sm">

          {/* ========================================
              ẢNH ĐẠI DIỆN
          ======================================== */}

          <div className="mb-8 flex items-center gap-5 border-b border-gray-100 pb-8">

            {/* INPUT CHỌN ẢNH ẨN */}
            <input
              ref={avatarInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
              onChange={handleAvatarChange}
              disabled={saving || checkingAvatar}
              className="hidden"
            />

            {/* BẤM VÀO ẢNH ĐỂ THAY ĐỔI */}
            <div className="relative shrink-0">

              <button
                type="button"
                title="Thay đổi ảnh đại diện"
                aria-label="Thay đổi ảnh đại diện"
                onClick={handleOpenAvatar}
                disabled={saving || checkingAvatar}
                className="group relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-blue-50 shadow-sm disabled:cursor-not-allowed"
              >

                {/* HIỂN THỊ ẢNH ĐẠI DIỆN */}
                {displayAvatar ? (
                  <img
                    src={displayAvatar}
                    alt="Ảnh đại diện"
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <UserRound size={46} strokeWidth={1.5} className="text-blue-700" />
                )}

                {/* HIỆU ỨNG KHI DI CHUỘT VÀO ẢNH */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                  <Camera size={26} className="text-white" />
                </div>

                {/* TRẠNG THÁI KIỂM TRA ẢNH */}
                {checkingAvatar && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <Loader2 size={24} className="animate-spin text-white" />
                  </div>
                )}

              </button>

              {/* BIỂU TƯỢNG CAMERA */}
              <button
                type="button"
                title="Chọn ảnh đại diện"
                aria-label="Chọn ảnh đại diện mới"
                onClick={handleOpenAvatar}
                disabled={saving || checkingAvatar}
                className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-blue-700 text-white shadow-sm hover:bg-blue-800"
              >
                <Camera size={14} />
              </button>

            </div>

            {/* KHÔI PHỤC ẢNH CŨ */}
            {avatarFile && (
              <button
                type="button"
                onClick={handleRevertAvatar}
                disabled={saving || checkingAvatar}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                <Undo2 size={17} />
                Khôi phục
              </button>
            )}

          </div>

          {/* ========================================
              FORM THÔNG TIN CÁ NHÂN
          ======================================== */}

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">

            {/* TÊN ĐĂNG NHẬP */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="username" className="text-sm font-medium text-slate-600">
                Tên đăng nhập
              </label>

              <div className="relative flex items-center">
                <input
                  id="username"
                  type="text"
                  value={profile?.username || ""}
                  readOnly
                  disabled
                  className={readOnlyClass}
                />
                <Lock size={16} className="absolute right-3 text-slate-500" />
              </div>
            </div>

            {/* HỌ VÀ TÊN */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="fullName" className="text-sm font-medium text-slate-700">
                Họ và tên <span className="text-red-600">*</span>
              </label>

              <input
                id="fullName"
                type="text"
                value={fullName}
                disabled={saving || showConfirmModal}
                placeholder="Nhập họ và tên đầy đủ"
                onChange={(event) => {
                  setFullName(event.target.value);
                  setFullNameError("");
                }}
                className={`${inputClass} ${fullNameError ? "border-red-500" : ""}`}
              />

              {/* THÔNG BÁO LỖI */}
              {fullNameError && (
                <p className="mt-1 text-xs text-red-600">
                  {fullNameError}
                </p>
              )}
            </div>

            {/* EMAIL */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-slate-600">
                Email
              </label>

              <div className="relative flex items-center">
                <input
                  id="email"
                  type="email"
                  value={profile?.email || ""}
                  readOnly
                  disabled
                  className={readOnlyClass}
                />
                <Mail size={17} className="absolute right-3 text-slate-500" />
              </div>
            </div>

            {/* NÚT CẬP NHẬT */}
            <div className="flex justify-start pt-4">
              <button
                type="submit"
                disabled={saving || checkingAvatar}
                className="inline-flex items-center gap-2 rounded-lg bg-[#1e40af] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save size={17} />
                Cập nhật
              </button>
            </div>

          </form>
        </div>
      )}

      {/* ========================================
          MODAL XÁC NHẬN CẬP NHẬT
      ======================================== */}

      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
          >

            {/* TIÊU ĐỀ MODAL */}
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                <CircleHelp size={24} />
              </div>

              <h3 id="confirm-title" className="text-lg font-semibold text-slate-800">
                Xác nhận cập nhật
              </h3>
            </div>

            {/* NỘI DUNG XÁC NHẬN */}
            <p className="my-5 text-sm leading-relaxed text-slate-600">
              Bạn có chắc chắn muốn cập nhật thông tin cá nhân?
            </p>

            {/* NÚT HỦY VÀ OK */}
            <div className="flex items-center justify-end gap-3">

              <button
                type="button"
                disabled={saving}
                onClick={() => setShowConfirmModal(false)}
                className="rounded-lg bg-gray-100 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-gray-200 disabled:opacity-50"
              >
                Hủy
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={handleConfirmUpdate}
                className="flex items-center gap-2 rounded-lg bg-[#1e40af] px-5 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                {saving ? "Đang cập nhật..." : "OK"}
              </button>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PersonalProfile;