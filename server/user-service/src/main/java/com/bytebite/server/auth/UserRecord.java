package com.bytebite.server.auth;

import java.time.OffsetDateTime;
import java.util.UUID;

public record UserRecord(
        UUID userId,
        String name,
        String email,
        String passwordHash,
        OffsetDateTime createdAt
) {
}
