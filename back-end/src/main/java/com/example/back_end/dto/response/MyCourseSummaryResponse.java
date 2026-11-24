package com.example.back_end.dto.response;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MyCourseSummaryResponse {
    private long total;
    private long inProgress;
    private long completed;
    private long notStarted;
}
