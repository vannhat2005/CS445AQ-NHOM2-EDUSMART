
package com.example.back_end.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;

import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;

    private final CustomUserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String header = request.getHeader("Authorization");

        log.info("JWT request: {}", request.getRequestURI());

        // 1. Kiểm tra Authorization Header
        if (header == null || !header.startsWith("Bearer ")) {

            log.warn("JWT: Không tìm thấy Bearer Token");

            filterChain.doFilter(request, response);
            return;
        }

        String token = header.substring(7).trim();

        // 2. Kiểm tra Token
        if (!jwtTokenProvider.validateToken(token)) {

            log.warn("JWT: Token không hợp lệ hoặc đã hết hạn");

            SecurityContextHolder.clearContext();

            filterChain.doFilter(request, response);
            return;
        }

        // 3. Chỉ xác thực nếu chưa có Authentication
        if (SecurityContextHolder.getContext()
                .getAuthentication() == null) {

            try {

                // 4. Lấy username từ JWT
                String username =
                        jwtTokenProvider.getUsername(token);

                log.info("JWT username: {}", username);

                // 5. Lấy thông tin User
                UserDetails userDetails =
                        userDetailsService.loadUserByUsername(username);

                // 6. Kiểm tra trạng thái tài khoản
                if (!userDetails.isEnabled()
                        || !userDetails.isAccountNonLocked()
                        || !userDetails.isAccountNonExpired()
                        || !userDetails.isCredentialsNonExpired()) {

                    log.warn(
                            "JWT: Tài khoản không đủ điều kiện đăng nhập"
                    );

                    SecurityContextHolder.clearContext();

                } else {

                    // 7. Tạo Authentication
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails,
                                    null,
                                    userDetails.getAuthorities()
                            );

                    authentication.setDetails(
                            new WebAuthenticationDetailsSource()
                                    .buildDetails(request)
                    );

                    // 8. Lưu Authentication
                    SecurityContextHolder.getContext()
                            .setAuthentication(authentication);

                    log.info(
                            "JWT: Xác thực thành công, username={}",
                            username
                    );
                }

            } catch (UsernameNotFoundException ex) {

                log.warn("JWT: Không tìm thấy người dùng");

                SecurityContextHolder.clearContext();
            }
        }

        // 9. Cho request đi tiếp
        filterChain.doFilter(request, response);
    }
}
