package com.bytebite.server.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record GroceryListDetailDTO(UUID id, String name, Instant createdAt, List<GroceryItemResponseDTO> items) {}
