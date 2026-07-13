package com.bytebite.server.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "recipes")
public class Recipe {

  @Id
  @Column(name = "recipe_id")
  private UUID id;

  @Column(nullable = false)
  private String name;

  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  @OneToMany(
      mappedBy = "recipe",
      cascade = CascadeType.ALL,
      orphanRemoval = true,
      fetch = FetchType.LAZY)
  private List<GroceryItem> items = new ArrayList<>();

  public UUID getId() {
    return id;
  }

  public String getName() {
    return name;
  }

  public UUID getUserId() {
    return userId;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public List<GroceryItem> getItems() {
    return items;
  }

  public void setId(UUID id) {
    this.id = id;
  }

  public void setName(String name) {
    this.name = name;
  }

  public void setUserId(UUID userId) {
    this.userId = userId;
  }

  public void setCreatedAt(Instant createdAt) {
    this.createdAt = createdAt;
  }

  public void setItems(List<GroceryItem> items) {
    this.items = items;
  }
}
