package com.bytebite.server.repository;

import com.bytebite.server.entity.GroceryItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface GroceryItemRepository extends JpaRepository<GroceryItem, UUID> {
    List<GroceryItem> findAllByRecipeId(UUID recipeId);
}
