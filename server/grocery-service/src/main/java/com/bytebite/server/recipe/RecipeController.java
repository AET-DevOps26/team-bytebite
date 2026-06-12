package com.bytebite.server.recipe;

import com.bytebite.server.auth.JwtAuth;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/recipes")
@Tag(name = "Recipes", description = "Persisted recipes and their grocery items")
public class RecipeController {

    private final RecipeRepository repository;
    private final JwtAuth jwtAuth;

    public RecipeController(RecipeRepository repository, JwtAuth jwtAuth) {
        this.repository = repository;
        this.jwtAuth = jwtAuth;
    }

    @GetMapping
    @Operation(summary = "List the authenticated user's saved recipes",
            security = @SecurityRequirement(name = "bearerAuth"))
    public List<Recipe> list(@RequestHeader(HttpHeaders.AUTHORIZATION) String authorization) {
        UUID userId = jwtAuth.requireUserId(authorization);
        return repository.findAllByUser(userId);
    }

    @GetMapping("/{recipeId}")
    @Operation(summary = "Get a single saved recipe",
            security = @SecurityRequirement(name = "bearerAuth"))
    public Recipe get(@RequestHeader(HttpHeaders.AUTHORIZATION) String authorization,
                      @PathVariable UUID recipeId) {
        UUID userId = jwtAuth.requireUserId(authorization);
        return repository.findByIdForUser(recipeId, userId).orElseThrow(this::notFound);
    }

    @PostMapping
    @Operation(summary = "Save a new recipe",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Recipe> create(@RequestHeader(HttpHeaders.AUTHORIZATION) String authorization,
                                         @RequestBody RecipeRequest request) {
        UUID userId = jwtAuth.requireUserId(authorization);
        Recipe recipe = repository.create(userId, requireName(request), request.items());
        return ResponseEntity.status(HttpStatus.CREATED).body(recipe);
    }

    @PutMapping("/{recipeId}")
    @Operation(summary = "Replace a saved recipe's name and items",
            security = @SecurityRequirement(name = "bearerAuth"))
    public Recipe update(@RequestHeader(HttpHeaders.AUTHORIZATION) String authorization,
                         @PathVariable UUID recipeId,
                         @RequestBody RecipeRequest request) {
        UUID userId = jwtAuth.requireUserId(authorization);
        return repository.replace(recipeId, userId, requireName(request), request.items())
                .orElseThrow(this::notFound);
    }

    @DeleteMapping("/{recipeId}")
    @Operation(summary = "Delete a saved recipe",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Void> delete(@RequestHeader(HttpHeaders.AUTHORIZATION) String authorization,
                                       @PathVariable UUID recipeId) {
        UUID userId = jwtAuth.requireUserId(authorization);
        if (!repository.deleteForUser(recipeId, userId)) {
            throw notFound();
        }
        return ResponseEntity.noContent().build();
    }

    private String requireName(RecipeRequest request) {
        if (request == null || request.name() == null || request.name().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Recipe name is required.");
        }
        return request.name();
    }

    private ResponseStatusException notFound() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Recipe not found.");
    }
}