package com.example.back_end.dto.request;

import lombok.Data;
import java.util.List;

@Data
public class AdminRoleUpdateRequest {

    private List<RoleChange> changes;

    @Data
    public static class RoleChange {
        private Integer userId;
        private String role;
    }
}