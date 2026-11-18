
package com.example.back_end.service.impl;

import com.example.back_end.config.JwtTokenProvider;
import com.example.back_end.dto.request.LoginRequest;
import com.example.back_end.dto.response.AuthTokenResult;
import com.example.back_end.dto.response.LoginResponse;
import com.example.back_end.dto.response.RefreshTokenResponse;
import com.example.back_end.entity.User;
import com.example.back_end.repository.UserRepository;
import com.example.back_end.service.AuthService;

import com.example.back_end.service.RefreshTokenService;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenService refreshTokenService;

    @Override
    @Transactional
    public AuthTokenResult<LoginResponse> login(LoginRequest request) {

        User user = userRepository
                .findByUsername(request.getUsername())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Sai tên đăng nhập hoặc mật khẩu"
                ));

        if (!passwordEncoder.matches(
                request.getPassword(),
                user.getPasswordHash()
        )) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Sai tên đăng nhập hoặc mật khẩu"
            );
        }

        if (user.getStatus() == null ||
                !user.getStatus().name().equalsIgnoreCase("ACTIVE")) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Tài khoản đã bị khóa hoặc chưa kích hoạt"
            );
        }

        String accessToken =
                jwtTokenProvider.generateToken(user.getUsername());

        String refreshToken =
                refreshTokenService.createRefreshToken(user);

        LoginResponse response = LoginResponse.builder()
                .accessToken(accessToken)
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getExpirationMs() / 1000)
                .userId(user.getUserId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .role(user.getRole().getRoleName().toUpperCase())
                .build();

        return new AuthTokenResult<>(response, refreshToken);
    }

    @Override
    @Transactional
    public AuthTokenResult<RefreshTokenResponse> refresh(
            String rawRefreshToken
    ) {

        // Thu hồi Refresh Token cũ
        User user = refreshTokenService.rotateRefreshToken(
                rawRefreshToken
        );

        if (user.getStatus() == null ||
                !user.getStatus().name().equalsIgnoreCase("ACTIVE")) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Tài khoản không còn hoạt động"
            );
        }

        // Tạo Refresh Token mới
        String newRefreshToken =
                refreshTokenService.createRefreshToken(user);

        // Tạo Access Token mới
        String newAccessToken =
                jwtTokenProvider.generateToken(user.getUsername());


        RefreshTokenResponse response =
                RefreshTokenResponse.builder()
                        .accessToken(newAccessToken)
                        .tokenType("Bearer")
                        .expiresIn(
                                jwtTokenProvider.getExpirationMs() / 1000
                        )
                        .userId(user.getUserId())
                        .username(user.getUsername())
                        .fullName(user.getFullName())
                        .role(
                                user.getRole()
                                        .getRoleName()
                                        .toUpperCase()
                        )
                        .build();


        return new AuthTokenResult<>(response, newRefreshToken);
    }

    @Override
    @Transactional
    public void logout(String refreshToken) {
        refreshTokenService.revokeRefreshToken(refreshToken);
    }
}
