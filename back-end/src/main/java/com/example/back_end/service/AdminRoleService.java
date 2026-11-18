package com.example.back_end.service;

import com.example.back_end.dto.request.AdminRoleUpdateRequest;
import com.example.back_end.dto.response.AdminRoleResponse;

import java.util.List;

public interface AdminRoleService {

    List<AdminRoleResponse> getAll();

    void updateRoles(AdminRoleUpdateRequest request);
}