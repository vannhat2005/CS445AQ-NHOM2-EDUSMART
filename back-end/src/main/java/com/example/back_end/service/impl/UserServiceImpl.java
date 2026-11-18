package com.example.back_end.service.impl;



import com.example.back_end.dto.request.RegisterRequest;
import com.example.back_end.dto.response.RegisterResponse;
import com.example.back_end.entity.Role;
import com.example.back_end.entity.User;
import com.example.back_end.enumType.AccountStatus;
import com.example.back_end.repository.RoleRepository;
import com.example.back_end.repository.UserRepository;
import com.example.back_end.service.UserService;

import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public RegisterResponse register(RegisterRequest request) {

        String username = request.getUsername().trim();
        String email = request.getEmail()
                .trim()
                .toLowerCase(Locale.ROOT);

        String fullName = request.getFullName().trim();

        if (userRepository.existsByUsername(username)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Tên đăng nhập đã tồn tại"
            );
        }

        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Email đã được sử dụng"
            );
        }

        Role studentRole = roleRepository
                .findByRoleName("Student")
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.INTERNAL_SERVER_ERROR,
                        "Không tìm thấy role Student"
                ));

        User user = new User();

        user.setUsername(username);
        user.setPasswordHash(
                passwordEncoder.encode(request.getPassword())
        );
        user.setFullName(fullName);
        user.setEmail(email);
        user.setRole(studentRole);
        user.setStatus(AccountStatus.Active);

        User savedUser;

        try {
            savedUser = userRepository.saveAndFlush(user);
        } catch (DataIntegrityViolationException ex) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Tên đăng nhập hoặc email đã tồn tại",
                    ex
            );
        }

        return RegisterResponse.builder()
                .userId(savedUser.getUserId())
                .username(savedUser.getUsername())
                .fullName(savedUser.getFullName())
                .email(savedUser.getEmail())
                .role(studentRole.getRoleName())
                .status(savedUser.getStatus().name())
                .build();
    }
}
