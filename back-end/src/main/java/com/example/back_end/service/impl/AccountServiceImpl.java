
package com.example.back_end.service.impl;

import com.example.back_end.dto.request.AccountRequest;
import com.example.back_end.dto.response.AccountResponse;
import com.example.back_end.dto.response.AccountStatisticsResponse;
import com.example.back_end.entity.Role;
import com.example.back_end.entity.User;
import com.example.back_end.enumType.AccountStatus;
import com.example.back_end.repository.AdminUserRepository;
import com.example.back_end.repository.RoleRepository;
import com.example.back_end.service.AccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AccountServiceImpl implements AccountService {

    private final AdminUserRepository adminUserRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    // Chuyển Entity sang Response
    private AccountResponse toResponse(User user) {
        return AccountResponse.builder()
                .userId(user.getUserId())
                .fullName(user.getFullName())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole() != null
                        ? user.getRole().getRoleName()
                        : null)
                .status(user.getStatus())
                .build();
    }

    // Lấy danh sách tài khoản, tìm kiếm, lọc và phân trang
    @Override
    @Transactional(readOnly = true)
    public Page<AccountResponse> getAccounts(
            String keyword,
            AccountStatus status,
            int pageNo,
            int pageSize) {

        Pageable pageable = PageRequest.of(
                Math.max(pageNo - 1, 0),
                pageSize,
                Sort.by(Sort.Direction.DESC, "userId")
        );

        String search = keyword == null
                ? ""
                : keyword.trim().toLowerCase();

        return adminUserRepository
                .searchAccounts(search, status, pageable)
                .map(this::toResponse);
    }

    // Lấy chi tiết tài khoản
    @Override
    @Transactional(readOnly = true)
    public AccountResponse getAccount(Integer userId) {

        User user = adminUserRepository.findById(userId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Không tìm thấy tài khoản"
                        )
                );

        return toResponse(user);
    }

    // Thống kê tài khoản
    @Override
    @Transactional(readOnly = true)
    public AccountStatisticsResponse getStatistics() {

        long total = adminUserRepository.count();

        long instructors = adminUserRepository.findAll()
                .stream()
                .filter(user ->
                        user.getRole() != null
                                && "Instructor".equals(
                                user.getRole().getRoleName()
                        )
                                && user.getStatus() == AccountStatus.Active
                )
                .count();

        long unverified = adminUserRepository.countByStatus(
                AccountStatus.Unverified
        );

        long inactive = adminUserRepository.countByStatus(
                AccountStatus.Inactive
        );

        return new AccountStatisticsResponse(
                total,
                instructors,
                unverified,
                inactive
        );
    }

    // Thêm tài khoản
    @Override
    @Transactional
    public AccountResponse createAccount(AccountRequest request) {

        String username = request.getUsername().trim();
        String email = request.getEmail().trim();

        if (adminUserRepository.existsByUsername(username)) {
            throw new IllegalArgumentException(
                    "Tên đăng nhập đã tồn tại"
            );
        }

        if (adminUserRepository.existsByEmail(email)) {
            throw new IllegalArgumentException(
                    "Email đã tồn tại"
            );
        }

        if (request.getPassword() == null
                || request.getPassword().length() < 8) {
            throw new IllegalArgumentException(
                    "Mật khẩu phải có ít nhất 8 ký tự"
            );
        }

        if (request.getRole() == null
                || request.getRole().isBlank()) {
            throw new IllegalArgumentException(
                    "Vai trò không được để trống"
            );
        }

        Role role = roleRepository
                .findByRoleName(request.getRole())
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Vai trò không tồn tại"
                        )
                );

        User user = new User();

        user.setFullName(request.getFullName().trim());
        user.setUsername(username);
        user.setEmail(email);
        user.setPasswordHash(
                passwordEncoder.encode(request.getPassword())
        );
        user.setRole(role);
        user.setStatus(request.getStatus());

        return toResponse(adminUserRepository.save(user));
    }

    // Cập nhật tài khoản
    @Override
    @Transactional
    public AccountResponse updateAccount(
            Integer userId,
            AccountRequest request) {

        User user = adminUserRepository.findById(userId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Không tìm thấy tài khoản"
                        )
                );

        String username = request.getUsername().trim();
        String email = request.getEmail().trim();

        if (adminUserRepository.existsByUsernameAndUserIdNot(
                username, userId)) {
            throw new IllegalArgumentException(
                    "Tên đăng nhập đã tồn tại"
            );
        }

        if (adminUserRepository.existsByEmailAndUserIdNot(
                email, userId)) {
            throw new IllegalArgumentException(
                    "Email đã tồn tại"
            );
        }

        user.setFullName(request.getFullName().trim());
        user.setUsername(username);
        user.setEmail(email);
        user.setStatus(request.getStatus());

        // Chỉ đổi mật khẩu khi nhập mật khẩu mới
        if (request.getPassword() != null
                && !request.getPassword().isBlank()) {

            if (request.getPassword().length() < 8) {
                throw new IllegalArgumentException(
                        "Mật khẩu phải có ít nhất 8 ký tự"
                );
            }

            user.setPasswordHash(
                    passwordEncoder.encode(request.getPassword())
            );
        }

        // Không cho thay đổi vai trò khi chỉnh sửa
        return toResponse(adminUserRepository.save(user));
    }
}
