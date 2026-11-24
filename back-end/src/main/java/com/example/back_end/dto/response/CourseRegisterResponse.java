
package com.example.back_end.dto.response;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseRegisterResponse {

    private Integer registrationId;

    private Integer courseId;

    private String courseTitle;

    private BigDecimal amount;

    private String enrollmentCode;

    private String registrationStatus;

    private boolean alreadyPurchased;

    private String message;
}
