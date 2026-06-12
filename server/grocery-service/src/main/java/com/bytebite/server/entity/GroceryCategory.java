package com.bytebite.server.entity;

public enum GroceryCategory {
    PRODUCE,
    DAIRY,
    MEAT,
    SEAFOOD,
    BAKERY,
    PANTRY,
    FROZEN,
    BEVERAGES,
    SPICES,
    OTHER;

    public static GroceryCategory fromAiCategory(String aiCategory) {
        if (aiCategory == null) return OTHER;
        return switch (aiCategory) {
            case "Produce" -> PRODUCE;
            case "Dairy & Eggs" -> DAIRY;
            case "Meat & Seafood" -> MEAT;
            case "Bakery & Bread" -> BAKERY;
            case "Spices & Herbs" -> SPICES;
            case "Frozen Foods" -> FROZEN;
            case "Beverages" -> BEVERAGES;
            default -> OTHER;
        };
    }
}
