
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { courseService, getCourseError } from '../../services/adminCourseApi';
import { categoryService, getCategoryError } from '../../services/categoryService';

const Icon = ({ children, className = '' }) => (
  <span className={`material-symbols-outlined ${className}`}>{children}</span>
);

const emptyForm = {
  title: '',
  description: '',
  learningOutcomes: [''],
  price: '',
  imageUrl: '',
  instructorId: '',
  categoryId: '',
  status: 'DRAFT'
};

const PAGE_SIZE = 5;

// Chuyển JSON mục tiêu học tập thành mảng
const parseOutcomes = value => {
  if (Array.isArray(value)) return value.length ? value : [''];

  try {
    const data = JSON.parse(value || '[]');
    return Array.isArray(data) && data.length ? data : [''];
  } catch {
    return [''];
  }
};

// Kiểm tra URL chỉ để xem trước ảnh
const isValidImageUrl = value => {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
};

const ManageCourses = () => {
  // Dữ liệu từ Backend
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [instructors, setInstructors] = useState([]);

  const [statistics, setStatistics] = useState({
    total: 0,
    published: 0,
    draft: 0,
    hidden: 0
  });

  // Tìm kiếm, lọc và phân trang
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modal thêm và sửa khóa học
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [originalStatus, setOriginalStatus] = useState('DRAFT');
  const [imageError, setImageError] = useState(false);

  // Trạng thái xử lý API
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [changingId, setChangingId] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Lấy danh sách khóa học
  const loadCourses = async (showToast = true) => {
    setLoading(true);
    setLoadError('');

    try {
      const data = await courseService.getAll({
        keyword: search,
        categoryId: categoryFilter,
        page,
        size: PAGE_SIZE
      });

      setCourses(data.courses);
      setTotalElements(data.totalElements);
      setTotalPages(Math.max(1, data.totalPages));

      if (page > 1 && page > Math.max(1, data.totalPages)) {
        setPage(Math.max(1, data.totalPages));
      }
    } catch (err) {
      const message = getCourseError(err);
      setLoadError(message);

      if (showToast) toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Lấy thống kê khóa học
  const loadStatistics = async () => {
    try {
      const data = await courseService.getStatistics();
      setStatistics(data);
    } catch (err) {
      toast.error(getCourseError(err));
    }
  };

  // Lấy danh mục và giảng viên
  const loadOptions = async () => {
    try {
      const [categoryData, instructorData] = await Promise.all([
        categoryService.getAll(),
        courseService.getInstructors()
      ]);

      setCategories(categoryData);
      setInstructors(instructorData);
    } catch (err) {
      toast.error(getCategoryError(err));
    }
  };

  // Tải dữ liệu khi mở trang
  useEffect(() => {
    loadOptions();
    loadStatistics();
  }, []);

  // Tải danh sách khi tìm kiếm, lọc, phân trang
  useEffect(() => {
    loadCourses();
  }, [search, categoryFilter, page, reloadKey]);

  const formatPrice = value =>
    Number(value || 0).toLocaleString('vi-VN') + ' đ';

  const startIndex = (page - 1) * PAGE_SIZE;

  // Tìm kiếm
  const handleSearch = e => {
    e.preventDefault();
    setSearch(keyword);
    setPage(1);
  };

  // Lọc danh mục
  const changeCategory = value => {
    setCategoryFilter(value);
    setPage(1);
  };

  // Cập nhật dữ liệu form
  const updateForm = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // Mở modal thêm khóa học
  const openAdd = () => {
    setEditingId(null);
    setOriginalStatus('DRAFT');
    setForm({ ...emptyForm, learningOutcomes: [''] });
    setImageError(false);
    setShowModal(true);
  };

  // Mở modal sửa khóa học
  const openEdit = async course => {
    if (loadingDetail) return;

    setLoadingDetail(true);

    try {
      const detail = await courseService.getById(course.courseId);

      setEditingId(detail.courseId);
      setOriginalStatus(detail.status);

      setForm({
        title: detail.title ?? '',
        description: detail.description ?? '',
        learningOutcomes: parseOutcomes(detail.learningOutcomes),
        price: String(detail.price ?? ''),
        imageUrl: detail.imageUrl ?? '',
        instructorId: String(detail.instructorId ?? ''),
        categoryId: String(detail.categoryId ?? ''),
        status: detail.status
      });

      setImageError(false);
      setShowModal(true);
    } catch (err) {
      toast.error(getCourseError(err));
    } finally {
      setLoadingDetail(false);
    }
  };

  // Nhập URL ảnh
  const handleImageUrlChange = e => {
    updateForm('imageUrl', e.target.value);
    setImageError(false);
  };

  // Thêm mục tiêu học tập
  const addOutcome = () => {
    updateForm('learningOutcomes', [...form.learningOutcomes, '']);
  };

  // Sửa mục tiêu học tập
  const updateOutcome = (index, value) => {
    updateForm(
      'learningOutcomes',
      form.learningOutcomes.map((item, i) =>
        i === index ? value : item
      )
    );
  };

  // Xóa mục tiêu học tập
  const removeOutcome = index => {
    updateForm(
      'learningOutcomes',
      form.learningOutcomes.filter((_, i) => i !== index)
    );
  };

  // Thêm hoặc cập nhật khóa học
  const handleSave = async e => {
    e.preventDefault();

    if (saving) return;

    setSaving(true);

    try {
      // Khóa trạng thái Draft khi chỉnh sửa
      const formData = {
        ...form,
        status: editingId !== null && originalStatus === 'DRAFT'
          ? 'DRAFT'
          : form.status
      };

      const response = editingId !== null
        ? await courseService.update(editingId, formData)
        : await courseService.create(formData);

      // Toast thành công từ Backend
      toast.success(response.message || 'Lưu khóa học thành công');

      setShowModal(false);

      await loadStatistics();

      if (page === 1) {
        setReloadKey(prev => prev + 1);
      } else {
        setPage(1);
      }
    } catch (err) {
      // Toast lỗi từ Backend
      toast.error(getCourseError(err));
    } finally {
      setSaving(false);
    }
  };

  // Chuyển trạng thái Published và Hidden
  const toggleStatus = async course => {
    // Draft không được thay đổi trạng thái
    if (course.status === 'DRAFT' || changingId !== null) return;

    setChangingId(course.courseId);

    try {
      const detail = await courseService.getById(course.courseId);

      // Không cho phép đổi trạng thái nếu Backend đã chuyển thành Draft
      if (detail.status === 'DRAFT') {
        toast.error('Khóa học ở trạng thái bản nháp không được thay đổi trạng thái');
        return;
      }

      const newStatus = detail.status === 'PUBLISHED'
        ? 'HIDDEN'
        : 'PUBLISHED';

      const updateFormData = {
        ...detail,
        learningOutcomes: parseOutcomes(detail.learningOutcomes),
        price: String(detail.price ?? ''),
        instructorId: String(detail.instructorId ?? ''),
        categoryId: String(detail.categoryId ?? ''),
        status: newStatus
      };

      const response = await courseService.update(
        course.courseId,
        updateFormData
      );

      toast.success(response.message || 'Cập nhật trạng thái thành công');

      await loadStatistics();
      setReloadKey(prev => prev + 1);
    } catch (err) {
      toast.error(getCourseError(err));
    } finally {
      setChangingId(null);
    }
  };

  // Thống kê
  const stats = [
    {
      label: 'Tổng khóa học',
      value: statistics.total,
      icon: 'menu_book',
      bg: 'bg-blue-50',
      iconBg: 'bg-blue-100',
      color: 'text-blue-600'
    },
    {
      label: 'Đã xuất bản',
      value: statistics.published,
      icon: 'check_circle',
      bg: 'bg-green-50',
      iconBg: 'bg-green-100',
      color: 'text-green-600'
    },
    {
      label: 'Bản nháp',
      value: statistics.draft,
      icon: 'edit_note',
      bg: 'bg-blue-50',
      iconBg: 'bg-blue-100',
      color: 'text-blue-600'
    },
    {
      label: 'Đã ẩn',
      value: statistics.hidden,
      icon: 'visibility_off',
      bg: 'bg-red-50',
      iconBg: 'bg-red-100',
      color: 'text-red-600'
    }
  ];

  return (
    <div className="w-full flex flex-col gap-6 px-2 pt-4 pb-12">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-gray-500">
        <Icon className="text-[18px]">school</Icon>
        <span>EduSmart</span>
        <Icon className="text-[16px]">chevron_right</Icon>
        <span className="font-semibold text-gray-800">
          Quản lý khóa học
        </span>
      </nav>

      {/* Tiêu đề */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Quản lý khóa học
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý thông tin, phân loại danh mục, học phí và trạng thái các khóa học.
          </p>
        </div>

        <button
          onClick={openAdd}
          className="h-10 px-5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold flex items-center justify-center gap-2 shrink-0"
        >
          <Icon className="text-[20px]">add</Icon>
          Thêm khóa học
        </button>
      </div>

      {/* Thống kê */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(item => (
          <div
            key={item.label}
            className={`${item.bg} rounded-xl border border-gray-100 shadow-sm p-5 flex items-center justify-between`}
          >
            <div>
              <p className="text-xs font-semibold text-gray-600">
                {item.label}
              </p>
              <p className={`text-3xl font-bold mt-2 ${item.color}`}>
                {item.value}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-xl ${item.iconBg} ${item.color} flex items-center justify-center`}>
              <Icon className="text-[27px]">{item.icon}</Icon>
            </div>
          </div>
        ))}
      </div>

      {/* Tìm kiếm và lọc danh mục */}
      <form
        onSubmit={handleSearch}
        className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col lg:flex-row gap-3"
      >
        <div className="relative flex-1">
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">
            search
          </Icon>
          <input
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="Tìm kiếm theo tên khóa học, mã ID, giảng viên..."
            className="w-full h-10 pl-10 pr-3 rounded-lg bg-gray-50 border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
        >
          <Icon className="text-[18px]">search</Icon>
          Tìm kiếm
        </button>

        <select
          value={categoryFilter}
          onChange={e => changeCategory(e.target.value)}
          className="h-10 min-w-[170px] px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Tất cả danh mục</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </form>

      {/* Thông báo lỗi tải dữ liệu */}
      {loadError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex items-center justify-between gap-3"
        >
          <span>{loadError}</span>
          <button
            type="button"
            onClick={() => loadCourses()}
            className="font-semibold underline"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Bảng khóa học */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left border-collapse">
            <thead>
              <tr className="bg-blue-50 text-xs uppercase text-gray-600">
                <th className="px-4 py-4">Mã ID</th>
                <th className="px-4 py-4">Tên khóa học</th>
                <th className="px-4 py-4">Danh mục</th>
                <th className="px-4 py-4">Giảng viên</th>
                <th className="px-4 py-4 text-right">Học phí</th>
                <th className="px-4 py-4 text-center">Trạng thái</th>
                <th className="px-4 py-4 text-center">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-gray-500">
                    Đang tải khóa học...
                  </td>
                </tr>
              )}

              {!loading && !loadError && courses.map((course, index) => (
                <tr key={course.courseId} className="hover:bg-gray-50">

                  {/* ID */}
                  <td className="px-4 py-4 text-blue-600 font-semibold text-sm">
                    #{index + 1 + startIndex}
                  </td>

                  {/* Tên và ảnh khóa học */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-12 rounded-lg bg-blue-50 overflow-hidden shrink-0 flex items-center justify-center">
                        {course.imageUrl ? (
                          <img
                            src={course.imageUrl}
                            alt={course.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Icon className="text-[24px] text-blue-400">
                            image
                          </Icon>
                        )}
                      </div>

                      <div>
                        <p className="font-semibold text-gray-900 text-sm">
                          {course.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 max-w-[260px] line-clamp-2">
                          {course.description}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Danh mục */}
                  <td className="px-4 py-4">
                    <span className="inline-flex px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold">
                      {course.categoryName || '—'}
                    </span>
                  </td>

                  {/* Giảng viên */}
                  <td className="px-4 py-4 text-sm text-gray-700">
                    {course.instructorName || '—'}
                  </td>

                  {/* Học phí */}
                  <td className="px-4 py-4 text-right text-sm font-semibold text-gray-900 whitespace-nowrap">
                    {formatPrice(course.price)}
                  </td>

                  {/* Trạng thái */}
                  <td className="px-4 py-4 text-center">
                    {course.status === 'DRAFT' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold">
                        <Icon className="text-[15px]">lock</Icon>
                        Bản nháp
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={changingId !== null}
                        onClick={() => toggleStatus(course)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold disabled:opacity-50 ${
                          course.status === 'PUBLISHED'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${
                          course.status === 'PUBLISHED'
                            ? 'bg-green-500'
                            : 'bg-gray-500'
                        }`} />
                        {changingId === course.courseId
                          ? 'Đang lưu...'
                          : course.status === 'PUBLISHED'
                            ? 'Hiển thị'
                            : 'Ẩn'}
                      </button>
                    )}
                  </td>

                  {/* Thao tác */}
                  <td className="px-4 py-4 text-center">
                    <button
                      onClick={() => openEdit(course)}
                      disabled={loadingDetail || changingId !== null}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-semibold disabled:opacity-50"
                    >
                      <Icon className="text-[17px]">edit</Icon>
                      Sửa
                    </button>
                  </td>
                </tr>
              ))}

              {!loading && !loadError && courses.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-gray-500">
                    Không tìm thấy khóa học phù hợp.
                  </td>
                </tr>
              )}

              {!loading && loadError && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-red-600">
                    Không thể tải danh sách khóa học.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang */}
        <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            Hiển thị{' '}
            <strong>
              {totalElements === 0 ? 0 : startIndex + 1}
              {' - '}
              {Math.min(startIndex + PAGE_SIZE, totalElements)}
            </strong>
            {' '}trên tổng số{' '}
            <strong>{totalElements}</strong> khóa học
          </p>

          <div className="flex items-center gap-2">
            <button
              disabled={page === 1 || loading}
              onClick={() => setPage(page - 1)}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 disabled:opacity-30"
            >
              <Icon>chevron_left</Icon>
            </button>

            <span className="w-8 h-8 rounded-lg bg-blue-600 text-white text-xs font-semibold flex items-center justify-center">
              {page}
            </span>

            <button
              disabled={page >= totalPages || loading}
              onClick={() => setPage(page + 1)}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 disabled:opacity-30"
            >
              <Icon>chevron_right</Icon>
            </button>
          </div>
        </div>
      </div>

      {/* Modal thêm hoặc chỉnh sửa khóa học */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[90vh] bg-white rounded-xl shadow-xl flex flex-col overflow-hidden">

            {/* Tiêu đề modal */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Icon>{editingId !== null ? 'edit' : 'menu_book'}</Icon>
                </div>

                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {editingId !== null ? 'Chỉnh sửa khóa học' : 'Thêm khóa học mới'}
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Thông tin chi tiết khóa học
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-700 disabled:opacity-50"
              >
                <Icon>close</Icon>
              </button>
            </div>

            {/* Form không chặn validation của Backend */}
            <form
              id="courseForm"
              noValidate
              onSubmit={handleSave}
              className="p-6 space-y-5 overflow-y-auto flex-1"
            >

              {/* Tên khóa học */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tên khóa học <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.title}
                  onChange={e => updateForm('title', e.target.value)}
                  placeholder="Nhập tên khóa học..."
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Danh mục và giảng viên */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Danh mục <span className="text-red-500">*</span>
                  </label>

                  <select
                    value={form.categoryId}
                    onChange={e => updateForm('categoryId', e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-gray-50 text-sm outline-none"
                  >
                    <option value="">Chọn danh mục</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Giảng viên phụ trách <span className="text-red-500">*</span>
                  </label>

                  <select
                    value={form.instructorId}
                    onChange={e => updateForm('instructorId', e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-gray-50 text-sm outline-none"
                  >
                    <option value="">Chọn giảng viên</option>
                    {instructors.map(i => (
                      <option key={i.userId} value={i.userId}>
                        {i.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Học phí */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Học phí (VNĐ) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={form.price}
                  onChange={e => updateForm('price', e.target.value)}
                  placeholder="Nhập học phí..."
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Mô tả khóa học */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mô tả khóa học
                </label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={e => updateForm('description', e.target.value)}
                  placeholder="Nhập nội dung mô tả khóa học..."
                  className="w-full p-3 rounded-lg border border-gray-200 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Mục tiêu học tập */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Mục tiêu học tập
                  </label>

                  <button
                    type="button"
                    onClick={addOutcome}
                    className="text-blue-600 text-xs font-semibold flex items-center gap-1 hover:underline"
                  >
                    <Icon className="text-[17px]">add</Icon>
                    Thêm mục tiêu
                  </button>
                </div>

                <div className="space-y-2">
                  {form.learningOutcomes.map((outcome, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Icon className="text-green-600 text-[19px]">
                        check_circle
                      </Icon>

                      <input
                        value={outcome}
                        onChange={e => updateOutcome(index, e.target.value)}
                        placeholder={`Mục tiêu học tập ${index + 1}`}
                        className="flex-1 h-10 px-3 rounded-lg border border-gray-200 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />

                      <button
                        type="button"
                        onClick={() => removeOutcome(index)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Icon className="text-[20px]">
                          remove_circle_outline
                        </Icon>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* URL ảnh đại diện */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  URL ảnh đại diện khóa học
                </label>

                <input
                  type="text"
                  value={form.imageUrl}
                  onChange={handleImageUrlChange}
                  placeholder="https://example.com/course.jpg"
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />

                <p className="text-xs text-gray-500 mt-2">
                  Nhập đường dẫn URL ảnh bắt đầu bằng http:// hoặc https://
                </p>

                {form.imageUrl.trim() && isValidImageUrl(form.imageUrl.trim()) && (
                  <div className="mt-3">
                    {!imageError ? (
                      <img
                        key={form.imageUrl}
                        src={form.imageUrl.trim()}
                        alt="Xem trước ảnh khóa học"
                        onError={() => setImageError(true)}
                        className="w-48 h-28 rounded-lg border border-gray-200 object-cover"
                      />
                    ) : (
                      <p className="text-xs text-red-500">
                        Không thể hiển thị ảnh từ URL này.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Trạng thái khóa học */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Trạng thái khóa học
                </label>

                {editingId === null ? (
                  // Thêm mới: mặc định Draft
                  <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-gray-50 text-gray-600 text-sm">
                    <Icon className="text-[19px]">lock</Icon>
                    Khóa học mới mặc định ở trạng thái Bản nháp
                  </div>
                ) : originalStatus === 'DRAFT' ? (
                  // Draft: không được đổi trạng thái
                  <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-gray-50 text-gray-600 text-sm">
                    <Icon className="text-[19px]">lock</Icon>
                    Bản nháp - Không được thay đổi trạng thái
                  </div>
                ) : (
                  // Published và Hidden: chỉ được chuyển đổi qua lại
                  <select
                    value={form.status}
                    onChange={e => updateForm('status', e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-gray-50 text-sm outline-none"
                  >
                    <option value="PUBLISHED">Đã xuất bản</option>
                    <option value="HIDDEN">Đã ẩn</option>
                  </select>
                )}
              </div>
            </form>

            {/* Nút hành động */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 shrink-0 bg-white">
              <button
                type="button"
                disabled={saving}
                onClick={() => setShowModal(false)}
                className="h-10 px-5 rounded-lg bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 disabled:opacity-50"
              >
                Hủy
              </button>

              <button
                type="submit"
                form="courseForm"
                disabled={saving}
                className="h-10 px-5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
              >
                <Icon className="text-[18px]">save</Icon>
                {saving
                  ? 'Đang lưu...'
                  : editingId !== null
                    ? 'Lưu thay đổi'
                    : 'Tạo khóa học'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCourses;
