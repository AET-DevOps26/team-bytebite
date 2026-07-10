package com.bytebite.server;

import com.bytebite.server.dto.RecipeCreateRequest;
import com.bytebite.server.dto.RecipeDetailDTO;
import com.bytebite.server.dto.RecipeSummaryDTO;
import com.bytebite.server.service.RecipeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.MediaType;
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
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@RestController
@RequestMapping("/api/recipes")
@Tag(name = "Recipes", description = "Stored recipes and their items")
public class RecipeController {

  private final RecipeService service;

  public RecipeController(RecipeService service) {
    this.service = service;
  }

  @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
  @Operation(
      summary = "List saved recipes",
      description =
          "Returns the caller's recipes as summaries, newest first. Use GET /{recipeId} for items.",
      security = @SecurityRequirement(name = "bearerAuth"),
      responses = {
        @ApiResponse(responseCode = "200", description = "Recipe summaries"),
        @ApiResponse(
            responseCode = "401",
            description = "Missing, expired, or invalid JWT",
            content = @Content)
      })
  public List<RecipeSummaryDTO> list(
      @Parameter(hidden = true) @RequestHeader("X-User-Id") UUID userId) {
    return service.getAll(userId);
  }

  @GetMapping(value = "/{recipeId}", produces = MediaType.APPLICATION_JSON_VALUE)
  @Operation(
      summary = "Get a recipe by id",
      security = @SecurityRequirement(name = "bearerAuth"),
      responses = {
        @ApiResponse(responseCode = "200", description = "Recipe with items"),
        @ApiResponse(
            responseCode = "401",
            description = "Missing, expired, or invalid JWT",
            content = @Content),
        @ApiResponse(
            responseCode = "404",
            description = "Recipe not found",
            content = @Content(schema = @Schema(implementation = Map.class)))
      })
  public RecipeDetailDTO getById(
      @Parameter(hidden = true) @RequestHeader("X-User-Id") UUID userId,
      @Parameter(description = "Identifier of the recipe", required = true) @PathVariable
          UUID recipeId) {
    return service.getById(recipeId, userId);
  }

  @PostMapping(
      consumes = MediaType.APPLICATION_JSON_VALUE,
      produces = MediaType.APPLICATION_JSON_VALUE)
  @Operation(
      summary = "Save a recipe",
      security = @SecurityRequirement(name = "bearerAuth"),
      responses = {
        @ApiResponse(responseCode = "201", description = "Recipe created"),
        @ApiResponse(
            responseCode = "400",
            description = "Invalid request body",
            content = @Content(schema = @Schema(implementation = Map.class))),
        @ApiResponse(
            responseCode = "401",
            description = "Missing, expired, or invalid JWT",
            content = @Content)
      })
  public ResponseEntity<RecipeDetailDTO> create(
      @Parameter(hidden = true) @RequestHeader("X-User-Id") UUID userId,
      @RequestBody RecipeCreateRequest request) {
    RecipeDetailDTO created = service.create(userId, request);
    URI location =
        ServletUriComponentsBuilder.fromCurrentRequest()
            .path("/{id}")
            .buildAndExpand(created.recipeId())
            .toUri();
    return ResponseEntity.created(location).body(created);
  }

  @PutMapping(
      value = "/{recipeId}",
      consumes = MediaType.APPLICATION_JSON_VALUE,
      produces = MediaType.APPLICATION_JSON_VALUE)
  @Operation(
      summary = "Replace a recipe's name and items",
      security = @SecurityRequirement(name = "bearerAuth"),
      responses = {
        @ApiResponse(responseCode = "200", description = "Recipe updated"),
        @ApiResponse(
            responseCode = "400",
            description = "Invalid request body",
            content = @Content(schema = @Schema(implementation = Map.class))),
        @ApiResponse(
            responseCode = "401",
            description = "Missing, expired, or invalid JWT",
            content = @Content),
        @ApiResponse(
            responseCode = "404",
            description = "Recipe not found",
            content = @Content(schema = @Schema(implementation = Map.class)))
      })
  public RecipeDetailDTO update(
      @Parameter(hidden = true) @RequestHeader("X-User-Id") UUID userId,
      @Parameter(description = "Identifier of the recipe", required = true) @PathVariable
          UUID recipeId,
      @RequestBody RecipeCreateRequest request) {
    return service.update(recipeId, userId, request);
  }

  @DeleteMapping("/{recipeId}")
  @Operation(
      summary = "Delete a recipe",
      security = @SecurityRequirement(name = "bearerAuth"),
      responses = {
        @ApiResponse(responseCode = "204", description = "Recipe deleted"),
        @ApiResponse(
            responseCode = "401",
            description = "Missing, expired, or invalid JWT",
            content = @Content),
        @ApiResponse(
            responseCode = "404",
            description = "Recipe not found",
            content = @Content(schema = @Schema(implementation = Map.class)))
      })
  public ResponseEntity<Void> delete(
      @Parameter(hidden = true) @RequestHeader("X-User-Id") UUID userId,
      @Parameter(description = "Identifier of the recipe", required = true) @PathVariable
          UUID recipeId) {
    service.delete(recipeId, userId);
    return ResponseEntity.noContent().build();
  }
}
