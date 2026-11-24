package com.example.back_end.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record ZaloPayCreateRequest(

        @NotNull
        @Positive
        Long amount

) {}