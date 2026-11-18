
package com.example.back_end.service;

import com.example.back_end.dto.request.LoginRequest;
import com.example.back_end.dto.response.AuthTokenResult;
import com.example.back_end.dto.response.LoginResponse;
import com.example.back_end.dto.response.RefreshTokenResponse;

public interface AuthService {

    AuthTokenResult<LoginResponse> login(LoginRequest request);

    AuthTokenResult<RefreshTokenResponse> refresh(String refreshToken);

    void logout(String refreshToken);
}
