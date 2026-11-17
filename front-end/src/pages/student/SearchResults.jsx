
import React from "react";
import HomeContent from "./HomeContent.jsx";

/**
 * Trang kết quả tìm kiếm EduSmart.
 *
 * Sử dụng lại HomeContent để:
 * - Giữ nguyên Hero Banner và hình ảnh.
 * - Giữ nguyên ô tìm kiếm.
 * - Giữ nguyên các nút xu hướng.
 * - Hiển thị kết quả tìm kiếm từ backend.
 * - Hỗ trợ phân trang khóa học.
 *
 * HomeContent tự nhận biết đường dẫn:
 * /student/search?keyword=Python&page=1
 */
export default function SearchResults() {
  return <HomeContent />;
}
