package com.bytebite.server.dto;

import java.util.List;
import java.util.UUID;

public record GroceryListDTO(UUID groceryListId, String name, List<GroceryItemDTO> items) {}
