package com.bytebite.server.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record RecipeDetailDTO(UUID recipeId, String name, Instant createdAt, List<RecipeItemResponseDTO> items) {}