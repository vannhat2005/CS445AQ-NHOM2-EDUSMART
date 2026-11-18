
package com.example.back_end.dto.response;

public record AuthTokenResult<T>(
        T response,
        String refreshToken
) {
}
