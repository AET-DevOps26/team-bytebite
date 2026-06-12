package com.bytebite.server.recipe;

import java.util.UUID;

/** A single ingredient belonging to a recipe. */
public record RecipeItem(
        UUID itemId,
        String name,
        String quantity,
        String unit,
        String category
) {}