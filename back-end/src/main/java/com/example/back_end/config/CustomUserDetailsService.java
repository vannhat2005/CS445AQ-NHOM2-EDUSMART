
package com.example.back_end.config;

import com.example.back_end.entity.User;
import com.example.back_end.repository.UserRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username)
            throws UsernameNotFoundException {

        // 1. Lấy User cùng Role bằng JOIN FETCH
        // Tránh lỗi LazyInitializationException
        User user = userRepository
                .findByUsernameWithRole(username)
                .orElseThrow(() ->
                        new UsernameNotFoundException(
                                "Không tìm thấy tài khoản"
                        )
                );

        // 2. Kiểm tra Role
        if (user.getRole() == null
                || user.getRole().getRoleName() == null) {

            throw new UsernameNotFoundException(
                    "Tài khoản chưa được phân quyền"
            );
        }

        // 3. Lấy tên quyền
        String roleName = user.getRole()
                .getRoleName()
                .trim()
                .toUpperCase(Locale.ROOT);

        // 4. Chuẩn hóa quyền cho Spring Security
        if (!roleName.startsWith("ROLE_")) {
            roleName = "ROLE_" + roleName;
        }

        // 5. Kiểm tra trạng thái tài khoản
        boolean active = user.getStatus() != null
                && "ACTIVE".equalsIgnoreCase(
                user.getStatus().name()
        );

        // 6. Trả về UserDetails cho JWT Filter
        return org.springframework.security.core.userdetails.User
                .withUsername(user.getUsername())
                .password(user.getPasswordHash())
                .authorities(
                        List.of(
                                new SimpleGrantedAuthority(roleName)
                        )
                )
                .disabled(!active)
                .build();
    }
}
