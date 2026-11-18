package com.example.back_end.controller;



import com.example.back_end.dto.request.RegisterRequest;
import com.example.back_end.dto.response.ApiResponse;
import com.example.back_end.dto.response.RegisterResponse;
import com.example.back_end.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/register")
    public ApiResponse<RegisterResponse> register(
            @Valid @RequestBody RegisterRequest request
    ) {

        RegisterResponse response = userService.register(request);

        return ApiResponse.<RegisterResponse>builder()
                .message("Đăng ký tài khoản thành công")
                .result(response)
                .build();
    }
}
