package com.bytebite.server.dto;

import java.util.UUID;

public record RecipeItemResponseDTO(
    UUID itemId, String name, Double quantity, String unit, String category) {}
