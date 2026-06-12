package com.bytebite.server.recipe;

import java.util.List;

/** Payload for creating or replacing a recipe. */
public record RecipeRequest(String name, List<Item> items) {

    public record Item(String name, String quantity, String unit, String category) {}
}