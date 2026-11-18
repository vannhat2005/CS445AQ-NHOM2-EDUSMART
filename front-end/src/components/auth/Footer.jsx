
import { ShieldCheck } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full border-t border-slate-200 bg-slate-50 px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">

        {/* THÔNG TIN BẢO MẬT */}
        <div className="flex max-w-2xl items-start gap-2 text-center text-xs leading-5 text-slate-500 sm:text-sm md:text-left">
          <ShieldCheck
            size={19}
            className="mt-0.5 shrink-0 text-indigo-600"
            aria-hidden="true"
          />

          <span>
            Kết nối bảo mật qua HTTPS khi triển khai
            <span className="mx-2 text-slate-300">
              •
            </span>
            © {new Date().getFullYear()} EduSmart.
            Bảo lưu mọi quyền.
          </span>
        </div>

        {/* CÁC LIÊN KẾT */}
        <nav
          aria-label="Liên kết pháp lý và hỗ trợ"
          className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-slate-500 sm:text-sm"
        >
          <a
            href="#terms"
            className="whitespace-nowrap transition-colors duration-200 hover:text-indigo-600 hover:underline"
          >
            Điều khoản sử dụng
          </a>

          <a
            href="#privacy"
            className="whitespace-nowrap transition-colors duration-200 hover:text-indigo-600 hover:underline"
          >
            Chính sách bảo mật
          </a>

          <a
            href="mailto:support@edusmart.vn"
            className="whitespace-nowrap transition-colors duration-200 hover:text-indigo-600 hover:underline"
          >
            Hỗ trợ kỹ thuật
          </a>
        </nav>
      </div>
    </footer>
  );
}
