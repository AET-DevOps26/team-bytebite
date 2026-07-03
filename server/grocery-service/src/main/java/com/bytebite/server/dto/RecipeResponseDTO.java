package com.bytebite.server.dto;

import java.util.List;

public record RecipeResponseDTO(String dish, List<IngredientDTO> ingredients, String note) {}
