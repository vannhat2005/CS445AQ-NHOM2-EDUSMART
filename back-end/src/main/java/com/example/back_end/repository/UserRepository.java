package com.example.back_end.repository;

import com.example.back_end.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {

    // Bạn có thể định nghĩa thêm các hàm tìm kiếm tùy chỉnh ở đây nếu cần, ví dụ:
    // Optional<User> findByUsername(String username);
    // Optional<User> findByEmail(String email);
}