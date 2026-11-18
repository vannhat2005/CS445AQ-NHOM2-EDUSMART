package com.example.back_end.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AccountStatisticsResponse {
    private long total;
    private long instructors;
    private long unverified;
    private long inactive;
}