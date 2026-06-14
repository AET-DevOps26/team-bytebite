package com.bytebite.server.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcType;
import org.hibernate.dialect.PostgreSQLEnumJdbcType;
import java.util.UUID;

@Entity
@Table(name = "grocery_items")
public class GroceryItem {

    @Id
    @Column(name = "item_id")
    private UUID id;

    @Column(nullable = false)
    private String name;

    // Nullable: recipe ingredients may have an unspecified quantity (e.g. "N/A", "to taste").
    @Column
    private Double quantity;

    @Column(nullable = false)
    private String unit;

    @Enumerated(EnumType.STRING)
    @JdbcType(PostgreSQLEnumJdbcType.class)
    @Column(columnDefinition = "grocery_category", nullable = false)
    private GroceryCategory category;

    @Column(name = "is_purchased", nullable = false)
    private boolean purchased;

    // A grocery item belongs to either a grocery list or a recipe (see chk_grocery_items_owner).
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "grocery_list_id")
    private GroceryList groceryList;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipe_id")
    private Recipe recipe;

    public UUID getId() { return id; }
    public String getName() { return name; }
    public Double getQuantity() { return quantity; }
    public String getUnit() { return unit; }
    public GroceryCategory getCategory() { return category; }
    public boolean isPurchased() { return purchased; }
    public GroceryList getGroceryList() { return groceryList; }
    public Recipe getRecipe() { return recipe; }

    public void setId(UUID id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setQuantity(Double quantity) { this.quantity = quantity; }
    public void setUnit(String unit) { this.unit = unit; }
    public void setCategory(GroceryCategory category) { this.category = category; }
    public void setPurchased(boolean purchased) { this.purchased = purchased; }
    public void setGroceryList(GroceryList groceryList) { this.groceryList = groceryList; }
    public void setRecipe(Recipe recipe) { this.recipe = recipe; }
}
