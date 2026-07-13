package com.bytebite.server.dto;

public record RecipeItemRequestDTO(String name, Double quantity, String unit, String category)
    implements ItemRequest {}
