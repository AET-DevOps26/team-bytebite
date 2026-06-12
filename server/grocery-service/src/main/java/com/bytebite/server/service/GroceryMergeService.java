package com.bytebite.server.service;

import com.bytebite.server.dto.GenAiMergeResponse;
import com.bytebite.server.dto.GroceryItemDTO;
import com.bytebite.server.dto.GroceryListDTO;
import com.bytebite.server.dto.IngredientDTO;
import com.bytebite.server.dto.MergeRequest;
import com.bytebite.server.entity.GroceryCategory;
import com.bytebite.server.entity.GroceryItem;
import com.bytebite.server.entity.GroceryList;
import com.bytebite.server.repository.GroceryItemRepository;
import com.bytebite.server.repository.GroceryListRepository;
import com.bytebite.server.repository.RecipeRepository;
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

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class GroceryMergeService {

    private final RecipeRepository recipeRepository;
    private final GroceryListRepository groceryListRepository;
    private final GroceryItemRepository groceryItemRepository;
    private final RestTemplate genAiRestTemplate;

    public GroceryMergeService(RecipeRepository recipeRepository,
                               GroceryListRepository groceryListRepository,
                               GroceryItemRepository groceryItemRepository,
                               RestTemplate genAiRestTemplate) {
        this.recipeRepository = recipeRepository;
        this.groceryListRepository = groceryListRepository;
        this.groceryItemRepository = groceryItemRepository;
        this.genAiRestTemplate = genAiRestTemplate;
    }

    @Transactional
    public GroceryListDTO merge(MergeRequest request) {
        List<List<IngredientDTO>> recipeLists = fetchRecipeIngredients(request.recipeIds());

        GenAiMergeResponse mergeResponse = callGenAiMerge(recipeLists);

        return saveGroceryList(request, mergeResponse.ingredients());
    }

    // TODO: implement once colleague adds recipe ingredient storage
    // Replace the stub body with:
    //   return request.recipeIds().stream()
    //       .map(id -> groceryItemRepository.findAllByRecipeId(id).stream()
    //           .map(item -> new IngredientDTO(item.getName(), String.valueOf(item.getQuantity()),
    //               item.getUnit(), item.getCategory().name(), false, null))
    //           .toList())
    //       .toList();
    private List<List<IngredientDTO>> fetchRecipeIngredients(List<UUID> recipeIds) {
        throw new ResponseStatusException(HttpStatus.NOT_IMPLEMENTED,
                "Recipe ingredient fetch not yet implemented — waiting for colleague's DB work");
    }

    private GenAiMergeResponse callGenAiMerge(List<List<IngredientDTO>> recipeLists) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        List<List<Map<String, Object>>> payload = recipeLists.stream()
                .map(list -> list.stream()
                        .map(i -> (Map<String, Object>) Map.of(
                                "name", i.name(),
                                "quantity", i.quantity(),
                                "unit", i.unit(),
                                "category", i.category()))
                        .toList())
                .toList();

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(Map.of("recipes", payload), headers);

        GenAiMergeResponse response;
        try {
            response = genAiRestTemplate.postForObject("/api/ai/merge", entity, GenAiMergeResponse.class);
        } catch (HttpClientErrorException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "AI service rejected the merge request: " + e.getMessage());
        } catch (HttpServerErrorException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "AI service encountered an error: " + e.getMessage());
        } catch (ResourceAccessException e) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "AI service is unreachable");
        }

        if (response == null || response.ingredients() == null || response.ingredients().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "AI service returned no ingredients for the merge");
        }

        return response;
    }

    private GroceryListDTO saveGroceryList(MergeRequest request, List<IngredientDTO> mergedIngredients) {
        GroceryList groceryList = groceryListRepository.save(new GroceryList(request.name(), request.userId()));

        List<GroceryItem> items = mergedIngredients.stream()
                .map(ingredient -> new GroceryItem(
                        ingredient.name(),
                        parseQuantity(ingredient.quantity()),
                        ingredient.unit(),
                        GroceryCategory.fromAiCategory(ingredient.category()),
                        groceryList.getGroceryListId()))
                .toList();
        groceryItemRepository.saveAll(items);

        List<GroceryItemDTO> itemDTOs = items.stream()
                .map(item -> new GroceryItemDTO(
                        item.getItemId(),
                        item.getName(),
                        item.getQuantity(),
                        item.getUnit(),
                        item.getCategory().name(),
                        item.isPurchased()))
                .toList();

        return new GroceryListDTO(groceryList.getGroceryListId(), groceryList.getName(), itemDTOs);
    }

    private double parseQuantity(String quantity) {
        try {
            return Double.parseDouble(quantity);
        } catch (NumberFormatException e) {
            return 0.0;
        }
    }
}
