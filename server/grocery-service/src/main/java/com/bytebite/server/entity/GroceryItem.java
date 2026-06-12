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
}
