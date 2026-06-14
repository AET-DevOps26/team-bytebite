package com.bytebite.server.dto;

import java.time.Instant;
import java.util.UUID;

public record RecipeSummaryDTO(UUID recipeId, String name, Instant createdAt) {}