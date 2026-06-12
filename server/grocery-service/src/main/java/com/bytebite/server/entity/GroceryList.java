package com.bytebite.server.entity;

import jakarta.persistence.*;
import java.time.Instant;
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

    @OneToMany(mappedBy = "groceryList", fetch = FetchType.LAZY)
    private List<GroceryItem> items;

    public UUID getId() { return id; }
    public String getName() { return name; }
    public boolean isOutdated() { return outdated; }
    public UUID getUserId() { return userId; }
    public Instant getCreatedAt() { return createdAt; }
    public List<GroceryItem> getItems() { return items; }
}
