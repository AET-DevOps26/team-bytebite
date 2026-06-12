package com.bytebite.server.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.util.UUID;

@Entity
@Table(name = "recipes")
public class Recipe {

    @Id
    @Column(name = "recipe_id")
    private UUID recipeId;

    private String name;

    @Column(name = "user_id")
    private UUID userId;

    public UUID getRecipeId() { return recipeId; }
    public String getName() { return name; }
    public UUID getUserId() { return userId; }
}
