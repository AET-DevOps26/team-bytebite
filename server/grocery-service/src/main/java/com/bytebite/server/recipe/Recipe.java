package com.bytebite.server.recipe;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/** A saved recipe with its grocery items, owned by a user. */
public record Recipe(
        UUID recipeId,
        String name,
        OffsetDateTime createdAt,
        List<RecipeItem> items
) {}