package com.bytebite.server.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.util.UUID;

@Entity
@Table(name = "grocery_lists")
public class GroceryList {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "grocery_list_id")
    private UUID groceryListId;

    private String name;

    private boolean outdated = false;

    @Column(name = "user_id")
    private UUID userId;

    public GroceryList() {}

    public GroceryList(String name, UUID userId) {
        this.name = name;
        this.userId = userId;
    }

    public UUID getGroceryListId() { return groceryListId; }
    public String getName() { return name; }
    public boolean isOutdated() { return outdated; }
    public UUID getUserId() { return userId; }
}
