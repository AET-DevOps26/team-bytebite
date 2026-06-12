package com.bytebite.server.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Verify-only counterpart to user-service's JwtTokenService. Validates the
 * HS256 signature and expiry of a bearer token signed with the shared secret,
 * and extracts the authenticated user id. grocery-service never issues tokens.
 */
@Component
public class JwtAuth {
    private static final Base64.Decoder BASE64_URL_DECODER = Base64.getUrlDecoder();
    private static final Base64.Encoder BASE64_URL_ENCODER = Base64.getUrlEncoder().withoutPadding();

    private final byte[] secret;

    public JwtAuth(@Value("${auth.jwt.secret}") String secret) {
        if (secret == null || secret.length() < 32) {
            throw new IllegalStateException("JWT secret must be at least 32 characters.");
        }
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
    }

    /** Validates the {@code Authorization} header and returns the caller's user id. */
    public UUID requireUserId(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            throw unauthorized();
        }
        String token = authorizationHeader.substring("Bearer ".length()).trim();
        String[] parts = token.split("\\.");
        if (parts.length != 3) {
            throw unauthorized();
        }

        String unsigned = parts[0] + "." + parts[1];
        if (!constantTimeEquals(sign(unsigned), parts[2])) {
            throw unauthorized();
        }

        Map<String, String> payload = parseFlatJson(
                new String(BASE64_URL_DECODER.decode(parts[1]), StandardCharsets.UTF_8));
        long expiresAt = Long.parseLong(payload.getOrDefault("exp", "0"));
        if (expiresAt <= Instant.now().getEpochSecond()) {
            throw unauthorized();
        }

        try {
            return UUID.fromString(payload.get("sub"));
        } catch (IllegalArgumentException | NullPointerException exception) {
            throw unauthorized();
        }
    }

    private String sign(String value) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret, "HmacSHA256"));
            return BASE64_URL_ENCODER.encodeToString(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("Could not verify JWT.", exception);
        }
    }

    private boolean constantTimeEquals(String expected, String actual) {
        byte[] expectedBytes = expected.getBytes(StandardCharsets.UTF_8);
        byte[] actualBytes = actual.getBytes(StandardCharsets.UTF_8);
        if (expectedBytes.length != actualBytes.length) {
            return false;
        }
        int result = 0;
        for (int i = 0; i < expectedBytes.length; i++) {
            result |= expectedBytes[i] ^ actualBytes[i];
        }
        return result == 0;
    }

    private Map<String, String> parseFlatJson(String json) {
        Map<String, String> values = new LinkedHashMap<>();
        String body = json.substring(1, json.length() - 1);
        for (String pair : body.split(",(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)")) {
            String[] parts = pair.split(":", 2);
            if (parts.length == 2) {
                values.put(unquote(parts[0]), unquote(parts[1]));
            }
        }
        return values;
    }

    private String unquote(String value) {
        String trimmed = value.trim();
        if (trimmed.startsWith("\"") && trimmed.endsWith("\"")) {
            return trimmed.substring(1, trimmed.length() - 1)
                    .replace("\\\"", "\"")
                    .replace("\\\\", "\\");
        }
        return trimmed;
    }

    private ResponseStatusException unauthorized() {
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication is required.");
    }
}