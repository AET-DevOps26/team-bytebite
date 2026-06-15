package com.bytebite.server.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "grocery_lists")
public class GroceryList {

    @Id
    @Column(name = "grocery_list_id")
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private boolean outdated;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @OneToMany(mappedBy = "groceryList", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<GroceryItem> items;

    // The recipes this list was merged from. Unidirectional and without cascade: we only
    // record links in grocery_list_recipes and must never create or delete Recipe rows.
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "grocery_list_recipes",
            joinColumns = @JoinColumn(name = "grocery_list_id"),
            inverseJoinColumns = @JoinColumn(name = "recipe_id"))
    private List<Recipe> recipes = new ArrayList<>();

    public UUID getId() { return id; }
    public String getName() { return name; }
    public boolean isOutdated() { return outdated; }
    public UUID getUserId() { return userId; }
    public Instant getCreatedAt() { return createdAt; }
    public List<GroceryItem> getItems() { return items; }
    public List<Recipe> getRecipes() { return recipes; }

    public void setId(UUID id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setOutdated(boolean outdated) { this.outdated = outdated; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public void setItems(List<GroceryItem> items) { this.items = items; }
    public void setRecipes(List<Recipe> recipes) { this.recipes = recipes; }
}
