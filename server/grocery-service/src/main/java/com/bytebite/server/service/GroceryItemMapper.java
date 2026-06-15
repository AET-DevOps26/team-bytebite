package com.bytebite.server.service;

import com.bytebite.server.dto.ItemRequest;
import com.bytebite.server.entity.GroceryCategory;
import com.bytebite.server.entity.GroceryItem;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
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

    /**
     * Aliases mapping the gen-ai taxonomy (and common variants) onto the coarser
     * {@link GroceryCategory} enum. The gen-ai prompt is aligned to emit the enum tokens
     * directly; this table is defence-in-depth so legacy or drifting labels (e.g.
     * "Dairy &amp; Eggs", "Dry Goods &amp; Pasta", "Spices &amp; Herbs") still resolve to a real
     * category instead of silently collapsing to OTHER.
     */
    private static final Map<String, GroceryCategory> CATEGORY_ALIASES = Map.ofEntries(
            Map.entry("PRODUCE", GroceryCategory.PRODUCE),
            Map.entry("FRUIT", GroceryCategory.PRODUCE),
            Map.entry("FRUITS", GroceryCategory.PRODUCE),
            Map.entry("VEGETABLE", GroceryCategory.PRODUCE),
            Map.entry("VEGETABLES", GroceryCategory.PRODUCE),
            Map.entry("DAIRY", GroceryCategory.DAIRY),
            Map.entry("DAIRY & EGGS", GroceryCategory.DAIRY),
            Map.entry("EGGS", GroceryCategory.DAIRY),
            Map.entry("MEAT", GroceryCategory.MEAT),
            Map.entry("MEAT & SEAFOOD", GroceryCategory.MEAT),
            Map.entry("POULTRY", GroceryCategory.MEAT),
            Map.entry("SEAFOOD", GroceryCategory.SEAFOOD),
            Map.entry("FISH", GroceryCategory.SEAFOOD),
            Map.entry("BAKERY", GroceryCategory.BAKERY),
            Map.entry("BAKERY & BREAD", GroceryCategory.BAKERY),
            Map.entry("BREAD", GroceryCategory.BAKERY),
            Map.entry("PANTRY", GroceryCategory.PANTRY),
            Map.entry("DRY GOODS & PASTA", GroceryCategory.PANTRY),
            Map.entry("DRY GOODS", GroceryCategory.PANTRY),
            Map.entry("PASTA", GroceryCategory.PANTRY),
            Map.entry("CANNED & JARRED GOODS", GroceryCategory.PANTRY),
            Map.entry("CANNED GOODS", GroceryCategory.PANTRY),
            Map.entry("CONDIMENTS & SAUCES", GroceryCategory.PANTRY),
            Map.entry("CONDIMENTS", GroceryCategory.PANTRY),
            Map.entry("SAUCES", GroceryCategory.PANTRY),
            Map.entry("BAKING NEEDS", GroceryCategory.PANTRY),
            Map.entry("BAKING", GroceryCategory.PANTRY),
            Map.entry("SNACKS", GroceryCategory.PANTRY),
            Map.entry("INTERNATIONAL FOODS", GroceryCategory.PANTRY),
            Map.entry("INTERNATIONAL", GroceryCategory.PANTRY),
            Map.entry("FROZEN", GroceryCategory.FROZEN),
            Map.entry("FROZEN FOODS", GroceryCategory.FROZEN),
            Map.entry("BEVERAGES", GroceryCategory.BEVERAGES),
            Map.entry("BEVERAGE", GroceryCategory.BEVERAGES),
            Map.entry("DRINKS", GroceryCategory.BEVERAGES),
            Map.entry("SPICES", GroceryCategory.SPICES),
            Map.entry("SPICES & HERBS", GroceryCategory.SPICES),
            Map.entry("HERBS", GroceryCategory.SPICES),
            Map.entry("OTHER", GroceryCategory.OTHER)
    );

    /** Maps a free-form category onto a valid grocery_category enum, defaulting to OTHER. */
    static GroceryCategory parseCategory(String value) {
        if (value == null || value.isBlank()) {
            return GroceryCategory.OTHER;
        }
        return CATEGORY_ALIASES.getOrDefault(value.trim().toUpperCase(), GroceryCategory.OTHER);
    }
}