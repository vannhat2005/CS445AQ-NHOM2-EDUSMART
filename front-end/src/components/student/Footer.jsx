
import React from "react";

/** Footer trang chủ EduSmart */
export default function Footer() {
  return (
    <footer className="w-full bg-surface-container-lowest border-t border-surface-variant mt-auto">
      <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-tablet lg:px-margin py-space-xl">

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">

          {/* CỘT 1: GIỚI THIỆU EDUSMART */}
          <div className="space-y-space-sm">
            <div className="flex items-center gap-space-xs">
              <img
                alt="EduSmart Logo"
                className="h-7 w-auto object-contain"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBjEn4LuRxFdKzCHfhDAhJSJAM-8J3t2lti012G4lFKPra8G0HL27HRMzZBOkRzMRrD9DcFIJWv8iONjYYGe5EPb_sb9N--02vRRmeWnmIQILUYdkDwbVt9IAyR-zD0TyOhFSaRI5Fu7OQZaXquxx-8Sy0kwyJ8JqBcaMO07GAUHEMARjjsSceMiRtTYxQOmdEKEzLRyJTpUTmH-306dT5-aGLTdhoZs2XjFF4nfXJC"
              />

              <span className="font-headline-sm text-headline-sm text-primary tracking-tight font-extrabold">
                EduSmart
              </span>
            </div>

            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Hệ thống học tập số toàn diện giúp người học phát triển
              năng lực chuyên môn và thăng tiến nghề nghiệp bền vững.
            </p>

            <div className="inline-flex items-center gap-space-xs px-2.5 py-1 rounded-full bg-surface-container font-label-sm text-label-sm text-outline">
              <span className="material-symbols-outlined text-[16px] text-primary">
                verified
              </span>

              <span>Kiểm định chất lượng EduTrust 2024</span>
            </div>
          </div>

          {/* CỘT 2: KHÁM PHÁ */}
          <div>
            <h4 className="font-title-sm text-title-sm text-on-surface font-semibold mb-space-md">
              Khám phá
            </h4>

            <ul className="space-y-space-sm font-body-sm text-body-sm text-on-surface-variant">
              <li>
                <a className="hover:text-primary transition-colors" href="#">
                  Tất cả khóa học
                </a>
              </li>

              <li>
                <a className="hover:text-primary transition-colors" href="#">
                  Lộ trình chứng chỉ
                </a>
              </li>

              <li>
                <a className="hover:text-primary transition-colors" href="#">
                  Giảng viên &amp; Chuyên gia
                </a>
              </li>

              <li>
                <a className="hover:text-primary transition-colors" href="#">
                  Doanh nghiệp đối tác
                </a>
              </li>
            </ul>
          </div>

          {/* CỘT 3: HỖ TRỢ SINH VIÊN */}
          <div>
            <h4 className="font-title-sm text-title-sm text-on-surface font-semibold mb-space-md">
              Hỗ trợ sinh viên
            </h4>

            <ul className="space-y-space-sm font-body-sm text-body-sm text-on-surface-variant">
              <li>
                <a className="hover:text-primary transition-colors" href="#">
                  Trung tâm trợ giúp
                </a>
              </li>

              <li>
                <a className="hover:text-primary transition-colors" href="#">
                  Cộng đồng học thuật
                </a>
              </li>

              <li>
                <a className="hover:text-primary transition-colors" href="#">
                  Chính sách hoàn phí
                </a>
              </li>

              <li>
                <a className="hover:text-primary transition-colors" href="#">
                  Liên hệ phản hồi
                </a>
              </li>
            </ul>
          </div>

          {/* CỘT 4: PHÁP LÝ VÀ CHỨNG NHẬN */}
          <div>
            <h4 className="font-title-sm text-title-sm text-on-surface font-semibold mb-space-md">
              Pháp lý &amp; Chứng nhận
            </h4>

            <ul className="space-y-space-sm font-body-sm text-body-sm text-on-surface-variant">
              <li>
                <a className="hover:text-primary transition-colors" href="#">
                  Điều khoản sử dụng
                </a>
              </li>

              <li>
                <a className="hover:text-primary transition-colors" href="#">
                  Chính sách quyền riêng tư
                </a>
              </li>

              <li>
                <a className="hover:text-primary transition-colors" href="#">
                  Tiêu chuẩn học thuật
                </a>
              </li>

              <li>
                <a className="hover:text-primary transition-colors" href="#">
                  Bảo mật dữ liệu
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* PHẦN DƯỚI FOOTER */}
        <div className="mt-space-xl pt-space-lg border-t border-surface-variant flex flex-col sm:flex-row items-center justify-between gap-space-sm text-center sm:text-left">

          <p className="font-body-sm text-body-sm text-outline">
            © 2024 EduSmart Learning Systems Inc. Tất cả quyền được bảo lưu.
          </p>

          <div className="flex items-center gap-space-md font-label-md text-label-md text-outline">

            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">
                lock
              </span>
              Bảo mật SSL 256-bit
            </span>

            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">
                public
              </span>
              Tiêu chuẩn SCORM &amp; LTI
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
