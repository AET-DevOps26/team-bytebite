package com.bytebite.server.dto;

import java.util.UUID;

public record GroceryItemDTO(UUID itemId, String name, double quantity, String unit, String category, boolean isPurchased) {}
