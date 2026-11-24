
package com.example.back_end.config;

import lombok.RequiredArgsConstructor;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;

import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;

import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    private final JwtAuthenticationEntryPoint authenticationEntryPoint;

    private final CustomAccessDeniedHandler accessDeniedHandler;

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http
    ) throws Exception {

        http
                // ==========================================
                // 1. CSRF
                // ==========================================
                .csrf(csrf -> csrf.disable())

                // ==========================================
                // 2. CORS
                // ==========================================
                .cors(cors -> {})

                // ==========================================
                // 3. JWT - KHÔNG DÙNG SESSION
                // ==========================================
                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                // ==========================================
                // 4. XỬ LÝ LỖI 401 / 403
                // ==========================================
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(
                                authenticationEntryPoint
                        )
                        .accessDeniedHandler(
                                accessDeniedHandler
                        )
                )

                // ==========================================
                // 5. PHÂN QUYỀN API
                // ==========================================
                .authorizeHttpRequests(auth -> auth

                        // ==================================
                        // API ĐĂNG NHẬP / ĐĂNG KÝ TÀI KHOẢN
                        // ==================================
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/users/register",
                                "/api/auth/login",
                                "/api/auth/refresh",
                                "/api/auth/logout"
                        ).permitAll()

                        // ==================================
                        // API PUBLIC - KHÁM PHÁ KHÓA HỌC
                        // ==================================
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/public/explore/**",
                                "/api/public/home/**"
                        ).permitAll()

                        // ==================================
                        // API PUBLIC - THÔNG TIN KHÓA HỌC & ẢNH
                        // ==================================
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/courses/search",
                                "/api/courses/featured",
                                "/api/courses/*/detail",
                                "/api/courses/*/curriculum",
                                "/api/courses/*/reviews",
                                "/api/images/**",
                                "/api/courses/images/**",
                                "/api/lesson-content/files/**"
                        ).permitAll()

                        // ==================================
                        // ZALOPAY CALLBACK
                        // ==================================
                        // ZaloPay không có JWT của sinh viên.
                        // Controller phải tự xác minh chữ ký
                        // HMAC-SHA256 bằng ZALOPAY_KEY2.
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/payments/zalopay/callback"
                        ).permitAll()

                        // ==================================
                        // SINH VIÊN ĐĂNG KÝ KHÓA HỌC
                        // ==================================
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/student/courses/*/register"
                        ).authenticated()

                        // ==================================
                        // SINH VIÊN TẠO THANH TOÁN ZALOPAY
                        // ==================================
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/student/checkout/*/pay/zalopay"
                        ).authenticated()

                        // ==================================
                        // SINH VIÊN KIỂM TRA THANH TOÁN
                        // ==================================
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/student/checkout/*/payment-status"
                        ).authenticated()

                        // ==================================
                        // CÁC API CÒN LẠI
                        // ==================================
                        .anyRequest().authenticated()
                )

                // ==========================================
                // 6. JWT FILTER
                // ==========================================
                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }

    // ==========================================
    // 7. TRÁNH JWT FILTER CHẠY HAI LẦN
    // ==========================================
    @Bean
    public FilterRegistrationBean<JwtAuthenticationFilter>
    jwtFilterRegistration(JwtAuthenticationFilter filter) {

        FilterRegistrationBean<JwtAuthenticationFilter> registration =
                new FilterRegistrationBean<>(filter);

        registration.setEnabled(false);

        return registration;
    }
}
