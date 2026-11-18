
package com.example.back_end.service.impl;

import com.example.back_end.dto.request.AdminRoleUpdateRequest;
import com.example.back_end.dto.response.AdminRoleResponse;
import com.example.back_end.entity.Role;
import com.example.back_end.entity.User;
import com.example.back_end.exception.AppException;
import com.example.back_end.exception.ErrorCode;
import com.example.back_end.repository.RoleRepository;
import com.example.back_end.repository.UserRepository;
import com.example.back_end.service.AdminRoleService;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AdminRoleServiceImpl implements AdminRoleService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    // Lấy danh sách người dùng và vai trò
    @Override
    @Transactional(readOnly = true)
    public List<AdminRoleResponse> getAll() {

        return userRepository.findAll().stream()
                .map(user -> new AdminRoleResponse(
                        user.getUserId(),
                        user.getUsername(),
                        user.getFullName(),
                        user.getEmail(),
                        user.getRole() != null
                                ? user.getRole().getRoleName()
                                : null
                ))
                .toList();
    }

    // Cập nhật vai trò cho nhiều người dùng
    @Override
    @Transactional
    public void updateRoles(AdminRoleUpdateRequest request) {

        if (request == null || request.getChanges() == null
                || request.getChanges().isEmpty()) {
            throw new AppException(ErrorCode.ROLE_NO_CHANGES);
        }

        for (AdminRoleUpdateRequest.RoleChange change : request.getChanges()) {

            if (change == null || change.getUserId() == null
                    || change.getRole() == null
                    || !Set.of("Admin", "Instructor", "Student")
                    .contains(change.getRole())) {
                throw new AppException(ErrorCode.ROLE_INVALID_DATA);
            }

            User user = userRepository.findById(change.getUserId())
                    .orElseThrow(() ->
                            new AppException(ErrorCode.ROLE_USER_NOT_FOUND)
                    );

            Role role = roleRepository.findByRoleName(change.getRole())
                    .orElseThrow(() ->
                            new AppException(ErrorCode.ROLE_NOT_FOUND)
                    );

            user.setRole(role);
            userRepository.save(user);
        }
    }
}
