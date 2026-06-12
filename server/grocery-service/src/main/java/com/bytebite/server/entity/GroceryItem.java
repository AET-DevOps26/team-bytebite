package com.bytebite.server.entity;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "grocery_items")
public class GroceryItem {

    @Id
    @Column(name = "item_id")
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private double quantity;

    @Column(nullable = false)
    private String unit;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "grocery_category", nullable = false)
    private GroceryCategory category;

    @Column(name = "is_purchased", nullable = false)
    private boolean purchased;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "grocery_list_id")
    private GroceryList groceryList;

    public UUID getId() { return id; }
    public String getName() { return name; }
    public double getQuantity() { return quantity; }
    public String getUnit() { return unit; }
    public GroceryCategory getCategory() { return category; }
    public boolean isPurchased() { return purchased; }
    public GroceryList getGroceryList() { return groceryList; }

    public void setId(UUID id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setQuantity(double quantity) { this.quantity = quantity; }
    public void setUnit(String unit) { this.unit = unit; }
    public void setCategory(GroceryCategory category) { this.category = category; }
    public void setPurchased(boolean purchased) { this.purchased = purchased; }
    public void setGroceryList(GroceryList groceryList) { this.groceryList = groceryList; }
}
