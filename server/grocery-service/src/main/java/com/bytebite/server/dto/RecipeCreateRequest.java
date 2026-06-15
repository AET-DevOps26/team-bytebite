package com.bytebite.server.dto;

import java.util.List;

public record RecipeCreateRequest(String name, List<RecipeItemRequestDTO> items) {}