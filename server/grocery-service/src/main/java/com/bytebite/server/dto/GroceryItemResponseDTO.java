package com.bytebite.server.dto;

import java.util.UUID;

public record GroceryItemResponseDTO(UUID id, String name, double quantity, String unit, String category, boolean purchased) {}
