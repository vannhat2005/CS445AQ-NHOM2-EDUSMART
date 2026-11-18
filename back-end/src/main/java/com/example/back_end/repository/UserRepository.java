package com.example.back_end.repository;

import com.example.back_end.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {

    // Bạn có thể định nghĩa thêm các hàm tìm kiếm tùy chỉnh ở đây nếu cần, ví dụ:
    // Optional<User> findByUsername(String username);
    // Optional<User> findByEmail(String email);


    Optional<User> findByUsername(String username);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);


    @Query("""
    SELECT u
    FROM User u
    JOIN FETCH u.role
    WHERE u.username = :username
""")
    Optional<User> findByUsernameWithRole(
            @Param("username") String username
    );

}