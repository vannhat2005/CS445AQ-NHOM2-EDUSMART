
import {
  Award,
  BrainCircuit,
  GraduationCap,
  Users,
  CheckCircle2,
} from "lucide-react";

// ========================================
// HÌNH ẢNH STITCH AI
// ========================================

const IMAGE_URL =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBLo53q7D-k0-5vQCxpH3o_yziJjI0yp-dM8zaHBjczsj_33cQ59krRUzYXv0yMJsykcQOGzW99s9SxzeI3QxRQagbPpO45kyroyUgYeDCHNZfyIrWWnetCUnpZllwYbnBsdrW2X0Cx93TgYEmXSRtgWlBqwq4ozKWKaKf_zJCOEzR4UpgkGb1EKnl2ePq0JCd9wZAmMR4rNwrr9CW5YQxi3F1DB00Ho7xKAuuf4GRQ";

// ========================================
// TÍNH NĂNG NỔI BẬT
// ========================================

const features = [
  {
    icon: Award,
    text: "Chứng chỉ hoàn thành",
  },
  {
    icon: BrainCircuit,
    text: "Lộ trình học tập thông minh",
  },
  {
    icon: Users,
    text: "Cộng đồng học viên",
  },
];

// ========================================
// AUTH SHOWCASE
// ========================================

export default function AuthShowcase() {
  return (
    <section
      className="
        relative
        flex
        h-full
        min-w-0
        flex-col
        justify-between
        overflow-hidden
        bg-gradient-to-br
        from-[#00288e]
        via-[#1e40af]
        to-[#316bf3]
        p-6
        text-white
        sm:p-7
        lg:p-8
      "
    >
      {/* ========================================
          HIỆU ỨNG NỀN
      ======================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -left-24
          -top-24
          h-64
          w-64
          rounded-full
          bg-cyan-300/20
          blur-3xl
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -bottom-24
          -right-24
          h-64
          w-64
          rounded-full
          bg-indigo-200/20
          blur-3xl
        "
      />

      {/* ========================================
          NỘI DUNG PHÍA TRÊN
      ======================================== */}

      <div className="relative z-10">

        {/* NHÃN NỀN TẢNG */}
        <div
          className="
            mb-4
            inline-flex
            max-w-full
            items-center
            gap-2
            rounded-full
            border
            border-white/20
            bg-white/15
            px-3
            py-1.5
            text-[11px]
            font-semibold
            uppercase
            tracking-wide
            text-white
            backdrop-blur-md
          "
        >
          <span
            className="
              h-2
              w-2
              shrink-0
              animate-pulse
              rounded-full
              bg-cyan-300
            "
          />

          <span>
            Nền tảng đào tạo trực tuyến
          </span>
        </div>

        {/* LOGO */}
        <div className="mb-4 flex items-center gap-3">

          <div
            className="
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              rounded-xl
              border
              border-white/20
              bg-white/15
              shadow-lg
              backdrop-blur-md
            "
          >
            <GraduationCap
              size={26}
              strokeWidth={2.2}
              className="text-white"
            />
          </div>

          <span
            className="
              text-2xl
              font-extrabold
              tracking-tight
              text-white
            "
          >
            EduSmart
          </span>
        </div>

        {/* TIÊU ĐỀ */}
        <h2
          className="
            max-w-md
            text-[27px]
            font-extrabold
            leading-[1.18]
            tracking-tight
            text-white
            sm:text-[30px]
            lg:text-[32px]
          "
        >
          Khai phóng tiềm năng học tập tương lai
        </h2>

        {/* MÔ TẢ */}
        <p
          className="
            mt-3
            max-w-md
            text-sm
            leading-6
            text-blue-100
          "
        >
          Khám phá những lộ trình học tập chuyên sâu,
          phát triển kỹ năng và chinh phục mục tiêu
          tri thức cùng EduSmart.
        </p>

        {/* ========================================
            DANH SÁCH TÍNH NĂNG
        ======================================== */}

        <div className="mt-4 flex flex-wrap gap-2">

          {features.map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="
                inline-flex
                items-center
                gap-2
                rounded-lg
                border
                border-white/15
                bg-white/15
                px-2.5
                py-1.5
                text-[11px]
                font-semibold
                text-white
                shadow-sm
                backdrop-blur-md
                transition-colors
                hover:bg-white/25
              "
            >
              <Icon
                size={15}
                className="shrink-0 text-cyan-200"
                aria-hidden="true"
              />

              <span>{text}</span>
            </div>
          ))}

        </div>
      </div>

      {/* ========================================
          HÌNH ẢNH MINH HỌA
      ======================================== */}

      <div className="relative z-10 my-4 w-full">

        <div
          className="
            relative
            overflow-hidden
            rounded-2xl
            border
            border-white/15
            bg-white/10
            p-1.5
            shadow-xl
            backdrop-blur-sm
          "
        >

          {/* ẢNH */}
          <div
            className="
              relative
              overflow-hidden
              rounded-xl
              bg-[#173a9c]
            "
          >
            <img
              src={IMAGE_URL}
              alt="Minh họa học tập trực tuyến EduSmart"
              loading="lazy"
              className="
                h-44
                w-full
                object-cover
                object-center
                sm:h-48
              "
            />

            {/* GRADIENT TRÊN HÌNH */}
            <div
              aria-hidden="true"
              className="
                pointer-events-none
                absolute
                inset-0
                bg-gradient-to-t
                from-[#00288e]/60
                via-transparent
                to-transparent
              "
            />
          </div>

          {/* ========================================
              THẺ KHÓA HỌC NỔI
          ======================================== */}

          <div
            className="
              absolute
              bottom-3
              left-3
              right-3
              flex
              items-center
              gap-2.5
              rounded-xl
              border
              border-white/50
              bg-white/95
              p-2.5
              text-slate-900
              shadow-lg
              backdrop-blur-md
            "
          >

            {/* ICON */}
            <div
              className="
                flex
                h-9
                w-9
                shrink-0
                items-center
                justify-center
                rounded-full
                bg-blue-700
                text-white
              "
            >
              <GraduationCap size={20} />
            </div>

            {/* THÔNG TIN */}
            <div className="min-w-0 flex-1">

              <p
                className="
                  truncate
                  text-xs
                  font-bold
                  text-slate-900
                "
              >
                Học tập cùng EduSmart
              </p>

              <p
                className="
                  mt-0.5
                  truncate
                  text-[11px]
                  text-slate-500
                "
              >
                Lập trình Fullstack &amp; AI Engineer
              </p>

            </div>

            {/* TRẠNG THÁI */}
            <div
              className="
                flex
                shrink-0
                flex-col
                items-center
                gap-0.5
              "
            >
              <CheckCircle2
                size={19}
                className="text-blue-600"
                aria-hidden="true"
              />

              <span
                className="
                  text-[9px]
                  font-semibold
                  text-blue-700
                "
              >
                Học tập
              </span>
            </div>

          </div>
        </div>
      </div>

      {/* ========================================
          CHÂN TRANG SHOWCASE
      ======================================== */}

      <div
        className="
          relative
          z-10
          flex
          items-center
          gap-2
          border-t
          border-white/15
          pt-3
          text-xs
          text-blue-100
        "
      >
        <CheckCircle2
          size={16}
          className="shrink-0 text-cyan-300"
          aria-hidden="true"
        />

        <span>
          Học hỏi mỗi ngày, phát triển mỗi ngày.
        </span>
      </div>

    </section>
  );
}
