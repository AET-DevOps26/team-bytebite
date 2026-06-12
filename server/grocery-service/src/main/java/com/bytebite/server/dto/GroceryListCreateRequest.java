package com.bytebite.server.dto;

import java.util.List;
import java.util.UUID;

public record GroceryListCreateRequest(String name, UUID userId, List<GroceryItemRequestDTO> items) {}
