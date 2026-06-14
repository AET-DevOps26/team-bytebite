package com.bytebite.server.repository;

import com.bytebite.server.entity.Recipe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RecipeRepository extends JpaRepository<Recipe, UUID> {

    List<Recipe> findAllByUserIdOrderByCreatedAtDesc(UUID userId);

    Optional<Recipe> findByIdAndUserId(UUID id, UUID userId);
}