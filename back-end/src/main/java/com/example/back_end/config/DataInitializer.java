
package com.example.back_end.config;

import com.example.back_end.entity.User;
import com.example.back_end.entity.Role;
import com.example.back_end.enumType.AccountStatus;
import com.example.back_end.repository.UserRepository;
import com.example.back_end.repository.RoleRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initAccounts(UserRepository userRepository,
                                   RoleRepository roleRepository,
                                   PasswordEncoder passwordEncoder) {
        return args -> {
            Role adminRole = roleRepository.findByRoleName("Admin")
                    .orElseGet(() -> {
                        Role role = new Role();
                        role.setRoleName("Admin");
                        return roleRepository.save(role);
                    });

            Role instructorRole = roleRepository.findByRoleName("Instructor")
                    .orElseGet(() -> {
                        Role role = new Role();
                        role.setRoleName("Instructor");
                        return roleRepository.save(role);
                    });
            Role studentRole = roleRepository
                    .findByRoleName("Student")
                    .orElseGet(() -> {
                        Role role = new Role();
                        role.setRoleName("Student");
                        return roleRepository.save(role);
                    });

            if (userRepository.findByUsername("admin").isEmpty()) {
                User admin = new User();
                admin.setUsername("admin");
                admin.setFullName("Quản trị viên");
                admin.setEmail("admin@edusmart.local");
                admin.setPasswordHash(passwordEncoder.encode("12345678"));
                admin.setStatus(AccountStatus.Active);
                admin.setRole(adminRole);
                userRepository.save(admin);
            }

            if (userRepository.findByUsername("instructor").isEmpty()) {
                User instructor = new User();
                instructor.setUsername("instructor");
                instructor.setFullName("Giảng viên EduSmart");
                instructor.setEmail("instructor@edusmart.local");
                instructor.setPasswordHash(passwordEncoder.encode("12345678"));
                instructor.setStatus(AccountStatus.Active);
                instructor.setRole(instructorRole);
                userRepository.save(instructor);
            }
            if (userRepository.findByUsername("student").isEmpty()) {

                User student = new User();

                student.setUsername("student");
                student.setFullName("Học viên EduSmart");
                student.setEmail("student@edusmart.local");

                student.setPasswordHash(
                        passwordEncoder.encode("12345678")
                );

                student.setStatus(AccountStatus.Active);
                student.setRole(studentRole);

                userRepository.save(student);
            }
        };
    }
}
