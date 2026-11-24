package com.example.back_end.controller;

import com.example.back_end.dto.request.ZaloPayCallbackRequest;
import com.example.back_end.service.ZaloPayPaymentProcessor;

import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments/zalopay")
@RequiredArgsConstructor
public class ZaloPayCallbackController {

    private final ZaloPayPaymentProcessor processor;

    @PostMapping("/callback")
    public Map<String, Object> callback(
            @RequestBody ZaloPayCallbackRequest request
    ) {

        try {
            processor.confirmFromCallback(
                    request.getData(),
                    request.getMac(),
                    request.getType()
            );

            return Map.of(
                    "return_code", 1,
                    "return_message", "Success"
            );

        } catch (SecurityException | IllegalArgumentException e) {

            return Map.of(
                    "return_code", 2,
                    "return_message", "Invalid callback"
            );

        } catch (Exception e) {

            return Map.of(
                    "return_code", 0,
                    "return_message", "Processing failed"
            );
        }
    }
}