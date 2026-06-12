package com.bytebite.server.repository;

import com.bytebite.server.entity.Recipe;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface RecipeRepository extends JpaRepository<Recipe, UUID> {
    List<Recipe> findAllByRecipeIdIn(List<UUID> recipeIds);
}
