
package com.example.back_end.repository;

import com.example.back_end.entity.User;
import com.example.back_end.enumType.AccountStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AdminUserRepository extends JpaRepository<User, Integer> {

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    boolean existsByUsernameAndUserIdNot(String username, Integer userId);

    boolean existsByEmailAndUserIdNot(String email, Integer userId);

    long countByStatus(AccountStatus status);

    @Query("""
        SELECT u FROM User u
        WHERE (
            :keyword = ''
            OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(u.username) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR str(u.userId) LIKE CONCAT('%', :keyword, '%')
        )
        AND (:status IS NULL OR u.status = :status)
    """)
    Page<User> searchAccounts(
            @Param("keyword") String keyword,
            @Param("status") AccountStatus status,
            Pageable pageable
    );
}
