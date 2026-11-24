package com.example.back_end.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminPaymentUpdateRequest {
    @NotBlank(message = "Trạng thái không được để trống")
    private String status;           // success, pending, failed

    private String paymentMethod;    // MoMo, ZaloPay
    private BigDecimal amount;
    private String studentName;
    private String studentEmail;
    private String courseName;
}
