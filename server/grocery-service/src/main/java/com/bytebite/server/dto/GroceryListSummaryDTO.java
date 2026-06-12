package com.bytebite.server.dto;

import java.time.Instant;
import java.util.UUID;

public record GroceryListSummaryDTO(UUID id, String name, Instant createdAt) {}
