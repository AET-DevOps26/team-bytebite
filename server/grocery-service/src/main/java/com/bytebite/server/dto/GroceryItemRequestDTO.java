package com.bytebite.server.dto;

public record GroceryItemRequestDTO(String name, double quantity, String unit, String category, boolean purchased) {}
