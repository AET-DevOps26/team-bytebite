package com.bytebite.server.dto;

import java.util.List;

public record GroceryListCreateRequest(String name, List<GroceryItemRequestDTO> items) {}
