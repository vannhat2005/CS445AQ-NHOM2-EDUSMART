
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  getAccounts,
  getAccountStatistics,
  createAccount,
  updateAccount,
} from "../../services/adminUserService";

const Icon = ({ children, className = "" }) => (
  <span className={`material-symbols-outlined ${className}`}>
    {children}
  </span>
);

const PAGE_SIZE = 5;

const emptyForm = {
  fullName: "",
  username: "",
  email: "",
  password: "",
  role: "Student",
  status: "Active",
};

const roleLabel = {
  Admin: "Admin",
  Instructor: "Giảng viên",
  Student: "Học viên",

};

const roleIcon = {
  Admin: "shield_person",
  Instructor: "school",
  Student: "person",
  Support: "support_agent",
};

const roles = [
  { value: "Student", label: "Học viên", icon: "person" },
  { value: "Instructor", label: "Giảng viên", icon: "school" },
  { value: "Admin", label: "Admin", icon: "shield_person" },
];

const getErrorMessage = (error, fallback) => {
  const data = error?.response?.data;

  if (data?.errors && typeof data.errors === "object") {
    const first = Object.values(data.errors)[0];
    if (first) return String(first);
  }

  return data?.message || fallback;
};

const ManageAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [statistics, setStatistics] = useState({
    total: 0,
    instructors: 0,
    unverified: 0,
    inactive: 0,
  });

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    const timer = setTimeout(async () => {
      try {
        setLoading(true);

        const response = await getAccounts(
          keyword.trim(),
          statusFilter,
          page,
          PAGE_SIZE
        );

        if (!active) return;

        const result = response.result;

        setAccounts(result?.content || []);
        setTotalElements(result?.totalElements || 0);
        setTotalPages(Math.max(result?.totalPages || 1, 1));
      } catch (error) {
        if (active) {
          setAccounts([]);
          toast.error(
            getErrorMessage(error, "Không thể tải danh sách tài khoản")
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [keyword, statusFilter, page, refreshKey]);

  useEffect(() => {
    let active = true;

    const loadStatistics = async () => {
      try {
        const response = await getAccountStatistics();

        if (active) {
          setStatistics(response.result || {
            total: 0,
            instructors: 0,
            unverified: 0,
            inactive: 0,
          });
        }
      } catch (error) {
        if (active) {
          toast.error(
            getErrorMessage(error, "Không thể tải thống kê tài khoản")
          );
        }
      }
    };

    loadStatistics();

    return () => {
      active = false;
    };
  }, [refreshKey]);

  const updateForm = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setShowPassword(false);
    setShowModal(true);
  };

  const openEdit = (account) => {
    setEditingId(account.userId);
    setForm({
      fullName: account.fullName || "",
      username: account.username || "",
      email: account.email || "",
      password: "",
      role: account.role || "Student",
      status: account.status || "Active",
    });
    setShowPassword(false);
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
    setEditingId(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const fullName = form.fullName.trim();
    const username = form.username.trim();
    const email = form.email.trim();
    const password = form.password;

    if (!fullName) {
      toast.error("Họ và tên không được để trống");
      return;
    }

    if (!username) {
      toast.error("Tên đăng nhập không được để trống");
      return;
    }

    if (!email) {
      toast.error("Email không được để trống");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Email không đúng định dạng");
      return;
    }

    if (editingId === null && !password.trim()) {
      toast.error("Mật khẩu không được để trống");
      return;
    }

    if (password && password.length < 8) {
      toast.error("Mật khẩu phải có ít nhất 8 ký tự");
      return;
    }

    if (editingId === null && !form.role) {
      toast.error("Vui lòng chọn vai trò");
      return;
    }

    if (!form.status) {
      toast.error("Vui lòng chọn trạng thái tài khoản");
      return;
    }

    const payload = {
      fullName,
      username,
      email,
      password,
      status: form.status,
    };

    if (editingId === null) {
      payload.role = form.role;
    }

    try {
      setSaving(true);

      let response;

      if (editingId !== null) {
        response = await updateAccount(editingId, payload);
      } else {
        response = await createAccount(payload);
      }

      toast.success(
        response.message ||
          (editingId !== null
            ? "Cập nhật thông tin tài khoản thành công"
            : "Thêm tài khoản thành công")
      );

      setShowModal(false);
      setEditingId(null);

      if (page !== 1) {
        setPage(1);
      } else {
        setRefreshKey((prev) => prev + 1);
      }

      if (page !== 1) {
        setRefreshKey((prev) => prev + 1);
      }
    } catch (error) {
      toast.error(
        getErrorMessage(error, "Không thể lưu tài khoản")
      );
    } finally {
      setSaving(false);
    }
  };

  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;

  const stats = [
    {
      label: "Tổng người dùng",
      value: statistics.total,
      icon: "group",
      bg: "bg-blue-50",
      iconBg: "bg-blue-100",
      color: "text-blue-600",
    },
    {
      label: "Giảng viên hoạt động",
      value: statistics.instructors,
      icon: "school",
      bg: "bg-green-50",
      iconBg: "bg-green-100",
      color: "text-green-600",
    },
    {
      label: "Chờ xác thực",
      value: statistics.unverified,
      icon: "schedule",
      bg: "bg-purple-50",
      iconBg: "bg-purple-100",
      color: "text-purple-600",
    },
    {
      label: "Tài khoản bị khóa",
      value: statistics.inactive,
      icon: "block",
      bg: "bg-red-50",
      iconBg: "bg-red-100",
      color: "text-red-600",
    },
  ];

  return (
    <div className="w-full flex flex-col gap-6 px-2 pt-4 pb-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-gray-500">
        <Icon className="text-[18px]">school</Icon>
        <span>EduSmart</span>
        <Icon className="text-[16px]">chevron_right</Icon>
        <span className="font-semibold text-gray-800">
          Quản lý tài khoản
        </span>
      </nav>

      {/* Tiêu đề */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Quản lý tài khoản
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý thông tin, phân quyền và trạng thái tài khoản
            người dùng trên hệ thống EduSmart.
          </p>
        </div>

        <button
          type="button"
          onClick={openAdd}
          className="h-10 px-5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold flex items-center justify-center gap-2 shrink-0"
        >
          <Icon className="text-[20px]">add</Icon>
          Thêm tài khoản
        </button>
      </div>

      {/* Thống kê */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((item) => (
          <div
            key={item.label}
            className={`${item.bg} rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4`}
          >
            <div
              className={`w-14 h-14 rounded-full ${item.iconBg} ${item.color} flex items-center justify-center shrink-0`}
            >
              <Icon className="text-[30px]">{item.icon}</Icon>
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-700">
                {item.label}
              </p>
              <p className={`text-3xl font-bold mt-2 ${item.color}`}>
                {item.value ?? 0}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Tìm kiếm và lọc */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">
            search
          </Icon>

          <input
            type="text"
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm kiếm theo tên, email, tên đăng nhập, ID..."
            className="w-full h-10 pl-10 pr-3 rounded-lg bg-gray-50 border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="h-10 min-w-[180px] px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Unverified">Unverified</option>
        </select>

        <button
          type="button"
          onClick={() => {
            setKeyword("");
            setStatusFilter("all");
            setPage(1);
            setRefreshKey((prev) => prev + 1);
          }}
          className="h-10 px-4 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm font-semibold flex items-center justify-center gap-2"
        >
          <Icon className="text-[18px]">refresh</Icon>
          Đặt lại
        </button>
      </div>

      {/* Bảng tài khoản */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left border-collapse">
            <thead>
              <tr className="bg-blue-50 text-xs uppercase text-gray-600">
                <th className="px-4 py-4">Mã ID</th>
                <th className="px-4 py-4">Người dùng</th>
                <th className="px-4 py-4">Tên đăng nhập</th>
                <th className="px-4 py-4">Vai trò</th>
                <th className="px-4 py-4 text-center">Trạng thái</th>
                <th className="px-4 py-4 text-center">Hành động</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {accounts.map((account, index) => (
                <tr
                  key={account.userId}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-4 text-blue-600 font-semibold text-sm">
                    #{index + 1 + startIndex}
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                        <Icon className="text-[22px]">person</Icon>
                      </div>

                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">
                          {account.fullName}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {account.email}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4 text-sm text-gray-700">
                    {account.username}
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                        account.role === "Admin"
                          ? "bg-purple-100 text-purple-700"
                          : account.role === "Instructor"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      <Icon className="text-[15px]">
                        {roleIcon[account.role] || "person"}
                      </Icon>
                      {roleLabel[account.role] || account.role}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                        account.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : account.status === "Inactive"
                            ? "bg-red-100 text-red-700"
                            : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          account.status === "Active"
                            ? "bg-green-500"
                            : account.status === "Inactive"
                              ? "bg-red-500"
                              : "bg-purple-500"
                        }`}
                      />
                      {account.status}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-center">
                    <button
                      type="button"
                      onClick={() => openEdit(account)}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-semibold"
                    >
                      <Icon className="text-[17px]">edit</Icon>
                      Sửa
                    </button>
                  </td>
                </tr>
              ))}

              {accounts.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center text-sm text-gray-500"
                  >
                    {loading
                      ? "Đang tải danh sách tài khoản..."
                      : "Không tìm thấy tài khoản phù hợp."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang */}
        <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            Hiển thị{" "}
            <strong>
              {totalElements === 0 ? 0 : startIndex + 1}
              {" - "}
              {Math.min(startIndex + PAGE_SIZE, totalElements)}
            </strong>
            {" "}trên tổng số{" "}
            <strong>{totalElements}</strong> tài khoản
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage === 1 || loading}
              onClick={() => setPage(currentPage - 1)}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 disabled:opacity-30"
            >
              <Icon>chevron_left</Icon>
            </button>

            <span className="w-8 h-8 rounded-lg bg-blue-600 text-white text-xs font-semibold flex items-center justify-center">
              {currentPage}
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages || loading}
              onClick={() => setPage(currentPage + 1)}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 disabled:opacity-30"
            >
              <Icon>chevron_right</Icon>
            </button>
          </div>
        </div>
      </div>

      {/* Modal thêm / sửa */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[90vh] bg-white rounded-xl shadow-xl flex flex-col overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Icon>
                    {editingId !== null
                      ? "manage_accounts"
                      : "person_add"}
                  </Icon>
                </div>

                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {editingId !== null
                      ? "Chỉnh sửa tài khoản"
                      : "Thêm tài khoản mới"}
                  </h2>

                  <p className="text-xs text-gray-500 mt-1">
                    {editingId !== null
                      ? "Cập nhật thông tin và trạng thái tài khoản"
                      : "Nhập thông tin để tạo tài khoản người dùng"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-700"
              >
                <Icon>close</Icon>
              </button>
            </div>

            <form
              id="accountForm"
              onSubmit={handleSave}
              noValidate
              className="p-6 space-y-5 overflow-y-auto flex-1"
            >
              {/* Họ tên / Username */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>

                  <input
                    value={form.fullName}
                    onChange={(e) =>
                      updateForm("fullName", e.target.value)
                    }
                    placeholder="Nhập họ và tên..."
                    className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tên đăng nhập <span className="text-red-500">*</span>
                  </label>

                  <input
                    value={form.username}
                    onChange={(e) =>
                      updateForm("username", e.target.value)
                    }
                    placeholder="Nhập tên đăng nhập..."
                    className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Địa chỉ Email <span className="text-red-500">*</span>
                </label>

                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    updateForm("email", e.target.value)
                  }
                  placeholder="example@gmail.com"
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Mật khẩu */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {editingId !== null
                    ? "Mật khẩu mới"
                    : "Mật khẩu khởi tạo"}

                  {editingId === null && (
                    <span className="text-red-500"> *</span>
                  )}
                </label>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) =>
                      updateForm("password", e.target.value)
                    }
                    placeholder={
                      editingId !== null
                        ? "Để trống nếu không đổi mật khẩu"
                        : "Tối thiểu 8 ký tự"
                    }
                    className="w-full h-10 px-3 pr-10 rounded-lg border border-gray-200 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  >
                    <Icon className="text-[19px]">
                      {showPassword ? "visibility_off" : "visibility"}
                    </Icon>
                  </button>
                </div>
              </div>

              {/* Vai trò */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Vai trò hệ thống
                  {editingId === null && (
                    <span className="text-red-500"> *</span>
                  )}
                </label>

                {editingId !== null ? (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-gray-50 text-gray-600 text-sm">
                    <Icon className="text-[19px]">lock</Icon>
                    {roleLabel[form.role] || form.role} - Không được thay đổi vai trò tại đây
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {roles.map((role) => (
                      <button
                        key={role.value}
                        type="button"
                        onClick={() => updateForm("role", role.value)}
                        className={`flex flex-col items-center justify-center gap-1 p-3 rounded-lg border-2 transition-colors ${
                          form.role === role.value
                            ? "border-blue-600 bg-blue-50 text-blue-600"
                            : "border-gray-200 bg-gray-50 text-gray-600 hover:border-blue-300"
                        }`}
                      >
                        <Icon className="text-[23px]">
                          {role.icon}
                        </Icon>
                        <span className="text-xs font-semibold">
                          {role.label}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {editingId !== null && (
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <Icon className="text-[16px]">info</Icon>
                    Vai trò được thay đổi tại chức năng Quản lý phân quyền.
                  </p>
                )}
              </div>

              {/* Trạng thái */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Trạng thái tài khoản{" "}
                  <span className="text-red-500">*</span>
                </label>

                <select
                  value={form.status}
                  onChange={(e) =>
                    updateForm("status", e.target.value)
                  }
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Active">
                    Hoạt động (Active)
                  </option>

                  {editingId !== null && (
                    <option value="Inactive">
                      Khóa tài khoản (Inactive)
                    </option>
                  )}

                  <option value="Unverified">
                    Chờ xác thực (Unverified)
                  </option>
                </select>
              </div>
            </form>

            {/* Nút hành động */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 shrink-0 bg-white">
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="h-10 px-5 rounded-lg bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 disabled:opacity-50"
              >
                Hủy
              </button>

              <button
                type="submit"
                form="accountForm"
                disabled={saving}
                className="h-10 px-5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
              >
                <Icon className="text-[18px]">
                  {editingId !== null ? "save" : "person_add"}
                </Icon>

                {saving
                  ? "Đang lưu..."
                  : editingId !== null
                    ? "Lưu thay đổi"
                    : "Tạo tài khoản"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageAccounts;
