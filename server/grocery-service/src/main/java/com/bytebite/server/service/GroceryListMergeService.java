package com.bytebite.server.service;

import com.bytebite.server.dto.GroceryItemRequestDTO;
import com.bytebite.server.dto.GroceryItemResponseDTO;
import com.bytebite.server.dto.GroceryListDetailDTO;
import com.bytebite.server.dto.IngredientDTO;
import com.bytebite.server.dto.MergeListRequest;
import com.bytebite.server.dto.MergeResponseDTO;
import com.bytebite.server.entity.GroceryItem;
import com.bytebite.server.entity.GroceryList;
import com.bytebite.server.entity.Recipe;
import com.bytebite.server.repository.GroceryListRepository;
import com.bytebite.server.repository.RecipeRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

/**
 * Merges several stored recipes into a new grocery list: reads the selected recipes from the DB,
 * delegates deduplication/summing to the gen-ai service, then persists the result as a grocery list
 * (linked back to its source recipes via grocery_list_recipes).
 */
@Service
public class GroceryListMergeService {

  private static final String DEFAULT_LLM_PROVIDER = "logos";
  private static final int MAX_NAME_LENGTH = 255;

  private final RecipeRepository recipeRepository;
  private final GroceryListRepository groceryListRepository;
  private final RestTemplate genAiRestTemplate;

  public GroceryListMergeService(
      RecipeRepository recipeRepository,
      GroceryListRepository groceryListRepository,
      RestTemplate genAiRestTemplate) {
    this.recipeRepository = recipeRepository;
    this.groceryListRepository = groceryListRepository;
    this.genAiRestTemplate = genAiRestTemplate;
  }

  @Transactional
  public GroceryListDetailDTO merge(UUID userId, MergeListRequest request) {
    List<UUID> recipeIds = request == null ? null : request.recipeIds();
    if (recipeIds == null || recipeIds.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one recipe is required");
    }

    List<Recipe> recipes = new ArrayList<>();
    for (UUID recipeId : recipeIds) {
      recipes.add(
          recipeRepository
              .findByIdAndUserId(recipeId, userId)
              .orElseThrow(
                  () ->
                      new ResponseStatusException(
                          HttpStatus.NOT_FOUND, "Recipe not found: " + recipeId)));
    }

    List<IngredientDTO> merged =
        callGenAiMerge(
            recipes, request.llmProvider() != null ? request.llmProvider() : DEFAULT_LLM_PROVIDER);

    GroceryList groceryList = new GroceryList();
    groceryList.setId(UUID.randomUUID());
    groceryList.setUserId(userId);
    groceryList.setName(deriveName(recipes));
    groceryList.setOutdated(false);
    groceryList.setCreatedAt(Instant.now());
    groceryList.setItems(buildItems(merged, groceryList));
    groceryList.setRecipes(recipes);

    return toDetail(groceryListRepository.save(groceryList));
  }

  /** Sends each recipe's items to gen-ai for deduplication and returns the merged ingredients. */
  private List<IngredientDTO> callGenAiMerge(List<Recipe> recipes, String llmProvider) {
    List<List<IngredientDTO>> recipePayloads = new ArrayList<>();
    for (Recipe recipe : recipes) {
      List<IngredientDTO> ingredients =
          recipe.getItems().stream().map(this::toIngredientDTO).toList();
      recipePayloads.add(ingredients);
    }

    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_JSON);
    Map<String, Object> body = new HashMap<>();
    body.put("recipes", recipePayloads);
    body.put("llm_provider", llmProvider);
    HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

    MergeResponseDTO response;
    try {
      response = genAiRestTemplate.postForObject("/api/ai/merge", entity, MergeResponseDTO.class);
    } catch (HttpClientErrorException e) {
      throw new ResponseStatusException(
          HttpStatus.BAD_GATEWAY, "AI service rejected the request: " + e.getMessage());
    } catch (HttpServerErrorException e) {
      throw new ResponseStatusException(
          HttpStatus.BAD_GATEWAY, "AI service encountered an error: " + e.getMessage());
    } catch (ResourceAccessException e) {
      throw new ResponseStatusException(
          HttpStatus.SERVICE_UNAVAILABLE, "AI service is unreachable");
    }

    if (response == null || response.ingredients() == null || response.ingredients().isEmpty()) {
      throw new ResponseStatusException(
          HttpStatus.UNPROCESSABLE_ENTITY, "AI service returned no merged ingredients");
    }
    return response.ingredients();
  }

  // Stored items use a numeric quantity and the GroceryCategory enum; gen-ai expects strings.
  // We send the enum name so gen-ai (which preserves the input category) round-trips it cleanly.
  private IngredientDTO toIngredientDTO(GroceryItem item) {
    String quantity = item.getQuantity() == null ? "N/A" : String.valueOf(item.getQuantity());
    return new IngredientDTO(
        item.getName(), quantity, item.getUnit(), item.getCategory().name(), false, null);
  }

  private List<GroceryItem> buildItems(List<IngredientDTO> ingredients, GroceryList groceryList) {
    List<GroceryItem> items = new ArrayList<>();
    for (IngredientDTO ingredient : ingredients) {
      GroceryItemRequestDTO dto =
          new GroceryItemRequestDTO(
              ingredient.name(),
              parseQuantity(ingredient.quantity()),
              ingredient.unit(),
              ingredient.category(),
              false);
      GroceryItem item = GroceryItemMapper.newItem(dto);
      item.setPurchased(false);
      item.setGroceryList(groceryList);
      items.add(item);
    }
    return items;
  }

  /**
   * Parses a free-form quantity string to a number, treating blanks/"N/A"/non-numeric as
   * unspecified.
   */
  private static Double parseQuantity(String quantity) {
    if (quantity == null) {
      return null;
    }
    String trimmed = quantity.trim();
    if (trimmed.isEmpty() || trimmed.equalsIgnoreCase("N/A")) {
      return null;
    }
    try {
      return Double.valueOf(trimmed);
    } catch (NumberFormatException exception) {
      return null;
    }
  }

  private static String deriveName(List<Recipe> recipes) {
    String name =
        recipes.stream()
            .map(Recipe::getName)
            .reduce((a, b) -> a + " + " + b)
            .orElse("Merged grocery list");
    return name.length() > MAX_NAME_LENGTH ? name.substring(0, MAX_NAME_LENGTH) : name;
  }

  private GroceryListDetailDTO toDetail(GroceryList groceryList) {
    List<GroceryItemResponseDTO> items =
        groceryList.getItems().stream()
            .map(
                item ->
                    new GroceryItemResponseDTO(
                        item.getId(),
                        item.getName(),
                        item.getQuantity(),
                        item.getUnit(),
                        item.getCategory().name(),
                        item.isPurchased()))
            .toList();
    return new GroceryListDetailDTO(
        groceryList.getId(), groceryList.getName(), groceryList.getCreatedAt(), items);
  }
}
