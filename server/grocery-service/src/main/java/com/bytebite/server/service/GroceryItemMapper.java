package com.bytebite.server.service;

import com.bytebite.server.dto.ItemRequest;
import com.bytebite.server.entity.GroceryCategory;
import com.bytebite.server.entity.GroceryItem;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

/**
 * Builds {@link GroceryItem} entities from request payloads. Recipes and grocery lists
 * share the same item table, so they share the same field handling here; callers set the
 * owning association (and {@code purchased}) afterwards.
 */
final class GroceryItemMapper {

    private GroceryItemMapper() {
    }

    /** Creates an item with the common fields populated, validating name and normalizing unit/category. */
    static GroceryItem newItem(ItemRequest dto) {
        if (dto.name() == null || dto.name().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Item name is required");
        }
        GroceryItem item = new GroceryItem();
        item.setId(UUID.randomUUID());
        item.setName(dto.name());
        item.setQuantity(dto.quantity());
        item.setUnit(dto.unit() == null ? "" : dto.unit());
        item.setCategory(parseCategory(dto.category()));
        return item;
    }

    /** Maps a free-form category onto a valid grocery_category enum, defaulting to OTHER. */
    static GroceryCategory parseCategory(String value) {
        if (value == null || value.isBlank()) {
            return GroceryCategory.OTHER;
        }
        try {
            return GroceryCategory.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException exception) {
            return GroceryCategory.OTHER;
        }
    }
}