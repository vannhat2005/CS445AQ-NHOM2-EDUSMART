
package com.example.back_end.service;

import com.example.back_end.entity.User;

public interface RefreshTokenService {

    String createRefreshToken(User user);

    User rotateRefreshToken(String rawToken);

    void revokeRefreshToken(String rawToken);
}
