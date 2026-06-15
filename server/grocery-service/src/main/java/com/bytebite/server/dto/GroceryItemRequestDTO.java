package com.bytebite.server.dto;

public record GroceryItemRequestDTO(String name, Double quantity, String unit, String category, boolean purchased) implements ItemRequest {}