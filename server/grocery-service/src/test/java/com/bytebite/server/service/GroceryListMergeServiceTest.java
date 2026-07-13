package com.bytebite.server.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.bytebite.server.dto.IngredientDTO;
import com.bytebite.server.dto.MergeListRequest;
import com.bytebite.server.dto.MergeResponseDTO;
import com.bytebite.server.entity.GroceryCategory;
import com.bytebite.server.entity.GroceryItem;
import com.bytebite.server.entity.GroceryList;
import com.bytebite.server.entity.Recipe;
import com.bytebite.server.repository.GroceryListRepository;
import com.bytebite.server.repository.RecipeRepository;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class GroceryListMergeServiceTest {
  @Mock private RecipeRepository recipeRepository;

  @Mock private GroceryListRepository groceryListRepository;

  @Mock private RestTemplate genAiRestTemplate;

  @Test
  void mergePersistsAiMergedIngredientsAndLinksSourceRecipes() {
    UUID userId = UUID.randomUUID();
    UUID recipeId = UUID.randomUUID();
    Recipe recipe =
        recipe(recipeId, userId, "Pasta", item("Tomato", 2.0, "pcs", GroceryCategory.PRODUCE));
    when(recipeRepository.findByIdAndUserId(recipeId, userId)).thenReturn(Optional.of(recipe));
    when(genAiRestTemplate.postForObject(eq("/api/ai/merge"), any(), eq(MergeResponseDTO.class)))
        .thenReturn(
            new MergeResponseDTO(
                List.of(
                    new IngredientDTO("Tomato", "3", "pcs", "Produce", false, null),
                    new IngredientDTO("Salt", "N/A", "", "Spices & Herbs", false, null))));
    when(groceryListRepository.save(any(GroceryList.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));

    var merged = service().merge(userId, new MergeListRequest(List.of(recipeId), "openai"));

    ArgumentCaptor<GroceryList> captor = ArgumentCaptor.forClass(GroceryList.class);
    verify(groceryListRepository).save(captor.capture());
    GroceryList saved = captor.getValue();
    assertThat(saved.getName()).isEqualTo("Pasta");
    assertThat(saved.getUserId()).isEqualTo(userId);
    assertThat(saved.getRecipes()).containsExactly(recipe);
    assertThat(saved.getItems()).hasSize(2);
    assertThat(saved.getItems().getFirst().getQuantity()).isEqualTo(3.0);
    assertThat(saved.getItems().getFirst().getCategory()).isEqualTo(GroceryCategory.PRODUCE);
    assertThat(saved.getItems().get(1).getQuantity()).isNull();
    assertThat(saved.getItems().get(1).getCategory()).isEqualTo(GroceryCategory.SPICES);

    assertThat(merged.name()).isEqualTo("Pasta");
    assertThat(merged.items()).extracting("name").containsExactly("Tomato", "Salt");
  }

  @Test
  void mergeRejectsEmptyRecipeSelection() {
    assertThatThrownBy(
            () -> service().merge(UUID.randomUUID(), new MergeListRequest(List.of(), null)))
        .isInstanceOfSatisfying(
            ResponseStatusException.class,
            exception -> assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST));
  }

  @Test
  void mergeMapsAiConnectivityFailureToServiceUnavailable() {
    UUID userId = UUID.randomUUID();
    UUID recipeId = UUID.randomUUID();
    when(recipeRepository.findByIdAndUserId(recipeId, userId))
        .thenReturn(Optional.of(recipe(recipeId, userId, "Pasta")));
    when(genAiRestTemplate.postForObject(eq("/api/ai/merge"), any(), eq(MergeResponseDTO.class)))
        .thenThrow(new ResourceAccessException("connection refused"));

    assertThatThrownBy(() -> service().merge(userId, new MergeListRequest(List.of(recipeId), null)))
        .isInstanceOfSatisfying(
            ResponseStatusException.class,
            exception ->
                assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE));
  }

  private GroceryListMergeService service() {
    return new GroceryListMergeService(recipeRepository, groceryListRepository, genAiRestTemplate);
  }

  private static Recipe recipe(UUID id, UUID userId, String name, GroceryItem... items) {
    Recipe recipe = new Recipe();
    recipe.setId(id);
    recipe.setUserId(userId);
    recipe.setName(name);
    recipe.setCreatedAt(Instant.now());
    recipe.setItems(List.of(items));
    for (GroceryItem item : recipe.getItems()) {
      item.setRecipe(recipe);
    }
    return recipe;
  }

  private static GroceryItem item(
      String name, Double quantity, String unit, GroceryCategory category) {
    GroceryItem item = new GroceryItem();
    item.setId(UUID.randomUUID());
    item.setName(name);
    item.setQuantity(quantity);
    item.setUnit(unit);
    item.setCategory(category);
    item.setPurchased(false);
    return item;
  }
}
