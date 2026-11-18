package com.example.back_end.service;



import com.example.back_end.dto.request.RegisterRequest;
import com.example.back_end.dto.response.RegisterResponse;

public interface UserService {

    RegisterResponse register(RegisterRequest request);
}
