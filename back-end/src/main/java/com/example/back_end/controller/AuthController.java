
package com.example.back_end.controller;

import com.example.back_end.dto.request.LoginRequest;
import com.example.back_end.dto.response.ApiResponse;
import com.example.back_end.dto.response.AuthTokenResult;
import com.example.back_end.dto.response.LoginResponse;
import com.example.back_end.dto.response.RefreshTokenResponse;
import com.example.back_end.service.AuthService;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.Arrays;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @Value("${app.cookie.secure:false}")
    private boolean cookieSecure;

    @Value("${app.cookie.same-site:Lax}")
    private String sameSite;

    @Value("${app.jwt.refresh-expiration-ms:604800000}")
    private long refreshExpirationMs;

    private static final String COOKIE_NAME = "refresh_token";

    private void setRefreshCookie(
            HttpServletResponse response,
            String refreshToken
    ) {

        ResponseCookie cookie = ResponseCookie.from(
                        COOKIE_NAME,
                        refreshToken
                )
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(sameSite)
                .path("/api/auth")
                .maxAge(Duration.ofMillis(refreshExpirationMs))
                .build();

        response.addHeader(
                HttpHeaders.SET_COOKIE,
                cookie.toString()
        );
    }

    private void clearRefreshCookie(HttpServletResponse response) {

        ResponseCookie cookie = ResponseCookie.from(
                        COOKIE_NAME,
                        ""
                )
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(sameSite)
                .path("/api/auth")
                .maxAge(Duration.ZERO)
                .build();

        response.addHeader(
                HttpHeaders.SET_COOKIE,
                cookie.toString()
        );
    }

    private String getRefreshToken(HttpServletRequest request) {

        Cookie[] cookies = request.getCookies();

        if (cookies == null) {
            return null;
        }

        return Arrays.stream(cookies)
                .filter(cookie ->
                        COOKIE_NAME.equals(cookie.getName())
                )
                .map(Cookie::getValue)
                .findFirst()
                .orElse(null);
    }

    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response
    ) {

        AuthTokenResult<LoginResponse> result =
                authService.login(request);

        setRefreshCookie(response, result.refreshToken());

        return ApiResponse.<LoginResponse>builder()
                .message("Đăng nhập thành công")
                .result(result.response())
                .build();
    }

    @PostMapping("/refresh")
    public ApiResponse<RefreshTokenResponse> refresh(
            HttpServletRequest request,
            HttpServletResponse response
    ) {

        String oldRefreshToken = getRefreshToken(request);

        AuthTokenResult<RefreshTokenResponse> result =
                authService.refresh(oldRefreshToken);

        setRefreshCookie(response, result.refreshToken());

        return ApiResponse.<RefreshTokenResponse>builder()
                .message("Làm mới token thành công")
                .result(result.response())
                .build();
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(
            HttpServletRequest request,
            HttpServletResponse response
    ) {

        String refreshToken = getRefreshToken(request);

        authService.logout(refreshToken);

        clearRefreshCookie(response);

        return ApiResponse.<Void>builder()
                .message("Đăng xuất thành công")
                .build();
    }
}
