package com.bytebite.server.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.util.UUID;

@Entity
@Table(name = "grocery_items")
public class GroceryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "item_id")
    private UUID itemId;

    private String name;

    private double quantity;

    private String unit;

    @Enumerated(EnumType.STRING)
    private GroceryCategory category;

    @Column(name = "is_purchased")
    private boolean isPurchased = false;

    @Column(name = "recipe_id")
    private UUID recipeId;

    @Column(name = "grocery_list_id")
    private UUID groceryListId;

    public GroceryItem() {}

    public GroceryItem(String name, double quantity, String unit, GroceryCategory category, UUID groceryListId) {
        this.name = name;
        this.quantity = quantity;
        this.unit = unit;
        this.category = category;
        this.groceryListId = groceryListId;
    }

    public UUID getItemId() { return itemId; }
    public String getName() { return name; }
    public double getQuantity() { return quantity; }
    public String getUnit() { return unit; }
    public GroceryCategory getCategory() { return category; }
    public boolean isPurchased() { return isPurchased; }
    public UUID getRecipeId() { return recipeId; }
    public UUID getGroceryListId() { return groceryListId; }
}
