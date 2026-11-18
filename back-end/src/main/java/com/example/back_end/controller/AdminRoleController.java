
package com.example.back_end.controller;

import com.example.back_end.dto.request.AdminRoleUpdateRequest;
import com.example.back_end.dto.response.AdminRoleResponse;
import com.example.back_end.dto.response.ApiResponse;
import com.example.back_end.exception.ErrorCode;
import com.example.back_end.service.AdminRoleService;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/roles")
@RequiredArgsConstructor
public class AdminRoleController {

    private final AdminRoleService adminRoleService;

    // Lấy danh sách người dùng và vai trò
    @GetMapping
    public ApiResponse<List<AdminRoleResponse>> getAll() {

        return ApiResponse.<List<AdminRoleResponse>>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message("Lấy danh sách phân quyền thành công")
                .result(adminRoleService.getAll())
                .build();
    }

    // Lưu thay đổi vai trò
    @PutMapping
    public ApiResponse<Void> updateRoles(
            @RequestBody AdminRoleUpdateRequest request) {

        adminRoleService.updateRoles(request);

        return ApiResponse.<Void>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message("Cập nhật phân quyền thành công")
                .build();
    }
}
