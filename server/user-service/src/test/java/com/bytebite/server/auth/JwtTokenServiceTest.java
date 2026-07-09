package com.bytebite.server.auth;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtTokenServiceTest {
    private final JwtTokenService service = new JwtTokenService("test-secret-with-at-least-32-chars", 3600);

    @Test
    void createdTokenCanBeVerified() {
        UUID userId = UUID.randomUUID();
        UserResponse user = new UserResponse(userId, "Ada \"Countess\"", "ada@example.com", OffsetDateTime.now());

        JwtTokenService.JwtUser verified = service.verify("Bearer " + service.createToken(user));

        assertThat(verified.userId()).isEqualTo(userId);
        assertThat(verified.email()).isEqualTo("ada@example.com");
        assertThat(verified.name()).isEqualTo("Ada \"Countess\"");
    }

    @Test
    void tamperedSignatureIsRejected() {
        UserResponse user = new UserResponse(UUID.randomUUID(), "Ada", "ada@example.com", OffsetDateTime.now());
        String token = service.createToken(user);
        String tampered = token.substring(0, token.length() - 2) + "xx";

        assertThatThrownBy(() -> service.verify("Bearer " + tampered))
                .isInstanceOfSatisfying(ResponseStatusException.class, exception ->
                        assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED));
    }

    @Test
    void expiredTokenIsRejected() {
        JwtTokenService expiringService = new JwtTokenService("test-secret-with-at-least-32-chars", -1);
        UserResponse user = new UserResponse(UUID.randomUUID(), "Ada", "ada@example.com", OffsetDateTime.now());

        assertThatThrownBy(() -> expiringService.verify("Bearer " + expiringService.createToken(user)))
                .isInstanceOfSatisfying(ResponseStatusException.class, exception ->
                        assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED));
    }
}
