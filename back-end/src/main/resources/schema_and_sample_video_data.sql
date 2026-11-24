-- ====================================================================================
-- EDUSMART - CẤU TRÚC DATABASE VÀ DỮ LIỆU MẪU CHUẨN XÁC 100% THEO SPRING BOOT ENTITY
-- ====================================================================================
-- Tương thích hoàn toàn với:
-- 1. Course.java              -> Bảng Courses (enum CourseStatus: Draft, Published, Hidden)
-- 2. Chapter.java             -> Bảng Chapters (enum GeneralStatus: Active, Inactive)
-- 3. Lesson.java              -> Bảng Lessons (enum GeneralStatus: Active, Inactive)
-- 4. LessonContent.java       -> Bảng LessonContents (enum ContentType: Text, Video, PDF)
-- 5. CourseRegistration.java  -> Bảng CourseRegistrations (enum RegistrationStatus: Pending, Paid, Failed)
-- 6. User.java                -> Bảng Users (enum AccountStatus: Active, Inactive, Unverified)
-- 7. Category.java            -> Bảng Categories
-- 8. Role.java                -> Bảng Roles
-- ====================================================================================

-- 1. BẢNG VAI TRÒ (Roles)
CREATE TABLE IF NOT EXISTS Roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(255) NOT NULL -- 'Admin', 'Instructor', 'Student'
);

-- 2. BẢNG NGƯỜI DÙNG (Users)
CREATE TABLE IF NOT EXISTS Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    avatar_url VARCHAR(255),
    role_id INT,
    status ENUM('Active', 'Inactive', 'Unverified') DEFAULT 'Active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES Roles(role_id) ON DELETE SET NULL
);

-- 3. BẢNG DANH MỤC KHÓA HỌC (Categories)
CREATE TABLE IF NOT EXISTS Categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status BOOLEAN DEFAULT TRUE -- 1: Hiển thị, 0: Ẩn
);

-- 4. BẢNG KHÓA HỌC (Courses) - CHỈ LƯU URL ẢNH THUMBNAIL
CREATE TABLE IF NOT EXISTS Courses (
    course_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    learning_outcomes JSON,
    price DECIMAL(10, 2) DEFAULT 0.00,
    -- Cột image_url CHỈ LƯU ĐƯỜNG DẪN FILE trong uploads/images/
    image_url VARCHAR(255),
    instructor_id INT,
    category_id INT,
    status ENUM('Draft', 'Published', 'Hidden') DEFAULT 'Published',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_courses_instructor FOREIGN KEY (instructor_id) REFERENCES Users(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_courses_category FOREIGN KEY (category_id) REFERENCES Categories(category_id) ON DELETE SET NULL
);

-- 5. BẢNG CHƯƠNG HỌC (Chapters)
CREATE TABLE IF NOT EXISTS Chapters (
    chapter_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    order_num INT DEFAULT 1,
    status ENUM('Active', 'Inactive') DEFAULT 'Active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_chapters_course FOREIGN KEY (course_id) REFERENCES Courses(course_id) ON DELETE CASCADE
);

-- 6. BẢNG BÀI HỌC (Lessons)
CREATE TABLE IF NOT EXISTS Lessons (
    lesson_id INT AUTO_INCREMENT PRIMARY KEY,
    chapter_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    order_num INT DEFAULT 1,
    status ENUM('Active', 'Inactive') DEFAULT 'Active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_lessons_chapter FOREIGN KEY (chapter_id) REFERENCES Chapters(chapter_id) ON DELETE CASCADE
);

-- 7. BẢNG NỘI DUNG BÀI HỌC (LessonContents) - LƯU VIDEO BÀI GIẢNG / PDF / TEXT
CREATE TABLE IF NOT EXISTS LessonContents (
    content_id INT AUTO_INCREMENT PRIMARY KEY,
    lesson_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    -- Định dạng nội dung: Text, Video, PDF
    content_type ENUM('Text', 'Video', 'PDF') NOT NULL,
    -- Cột content_data CHỈ LƯU ĐƯỜNG DẪN URL STREAM VIDEO, TUYỆT ĐỐI KHÔNG LƯU BLOB NHỊ PHÂN
    content_data TEXT NOT NULL,
    order_num INT DEFAULT 1,
    status ENUM('Active', 'Inactive') DEFAULT 'Active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_contents_lesson FOREIGN KEY (lesson_id) REFERENCES Lessons(lesson_id) ON DELETE CASCADE
);

-- 8. BẢNG ĐĂNG KÝ KHÓA HỌC (CourseRegistrations) - DÙNG ĐỂ CHECK QUYỀN HỌC VIÊN
CREATE TABLE IF NOT EXISTS CourseRegistrations (
    registration_id INT AUTO_INCREMENT PRIMARY KEY,
    enrollment_code VARCHAR(50),
    user_id INT NOT NULL,
    course_id INT NOT NULL,
    total_amount DECIMAL(10, 2) DEFAULT 0.00,
    status ENUM('Pending', 'Paid', 'Failed') DEFAULT 'Pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_registrations_user FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_registrations_course FOREIGN KEY (course_id) REFERENCES Courses(course_id) ON DELETE CASCADE
);


-- ====================================================================================
-- DỮ LIỆU MẪU (INSERT SCRIPT) ĐỂ VIDEO HIỂN THỊ NGAY CHO BÀI HỌC 37 - KHÓA HỌC 7
-- ====================================================================================

-- 1. Thêm danh mục mẫu (nếu chưa có)
INSERT INTO Categories (category_id, name, description, status)
VALUES (1, 'Trí tuệ nhân tạo & Khoa học dữ liệu', 'Các khóa học về AI, Machine Learning và Data Science', 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 2. Thêm Khóa học 7: "Machine Learning thực hành với Python" (theo ảnh chụp màn hình của bạn)
INSERT INTO Courses (course_id, title, description, learning_outcomes, price, image_url, category_id, status)
VALUES (
    7,
    'Machine Learning thực hành với Python',
    'Khóa học từ cơ bản đến nâng cao về Machine Learning và Deep Learning sử dụng ngôn ngữ Python.',
    '["Hiểu rõ các thuật toán Regression, Classification, Clustering", "Xây dựng mô hình với Scikit-Learn và TensorFlow", "Triển khai mô hình AI lên production"]',
    1299000.00,
    '/api/images/course_ml_python.png', -- Ảnh lưu trong uploads/images/
    1,
    'Published'
) ON DUPLICATE KEY UPDATE 
    title = VALUES(title),
    image_url = VALUES(image_url),
    status = 'Published';

-- 3. Thêm Chương 1: "Làm quen với nền tảng"
INSERT INTO Chapters (chapter_id, course_id, title, description, order_num, status)
VALUES (
    1,
    7,
    'Làm quen với nền tảng',
    'Giới thiệu tổng quan lộ trình và môi trường phát triển',
    1,
    'Active'
) ON DUPLICATE KEY UPDATE title = VALUES(title), status = 'Active';

-- 4. Thêm Bài học 37: "Giới thiệu và mục tiêu học tập" (theo ảnh chụp màn hình của bạn)
INSERT INTO Lessons (lesson_id, chapter_id, title, order_num, status)
VALUES (
    37,
    1,
    'Giới thiệu và mục tiêu học tập',
    1,
    'Active'
) ON DUPLICATE KEY UPDATE title = VALUES(title), status = 'Active';

-- 5. Thêm Video cho Bài học 37 (Liên kết tới file trong uploads/videos/ hỗ trợ Range Request)
INSERT INTO LessonContents (content_id, lesson_id, title, content_type, content_data, order_num, status)
VALUES (
    101,
    37,
    'Video bài giảng: Giới thiệu và mục tiêu học tập',
    'Video',
    '/api/videos/stream/ml_lesson_37_intro.mp4', -- URL Stream Range Request
    1,
    'Active'
) ON DUPLICATE KEY UPDATE 
    title = VALUES(title),
    content_type = 'Video',
    content_data = '/api/videos/stream/ml_lesson_37_intro.mp4',
    status = 'Active';

-- 6. Cấp quyền truy cập cho học viên (Giả sử tài khoản học viên hiện tại là user_id = 1)
-- Nếu user_id của bạn là ID khác (ví dụ: 2, 3...), hãy đổi số 1 thành ID tài khoản của bạn.
INSERT INTO CourseRegistrations (user_id, course_id, status, total_amount, enrollment_code)
VALUES (
    1,
    7,
    'Paid', -- Trạng thái 'Paid' để qua bước kiểm tra quyền xem video riêng tư
    1299000.00,
    'DH-2025007'
) ON DUPLICATE KEY UPDATE status = 'Paid';
