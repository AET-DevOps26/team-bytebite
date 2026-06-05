package com.bytebite.server.auth;

import java.time.OffsetDateTime;
import java.util.UUID;

public record UserResponse(UUID userId, String name, String email, OffsetDateTime createdAt) {
    public static UserResponse from(UserRecord user) {
        return new UserResponse(user.userId(), user.name(), user.email(), user.createdAt());
    }
}
