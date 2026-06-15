package com.bytebite.server.service;

import com.bytebite.server.dto.RecipeCreateRequest;
import com.bytebite.server.dto.RecipeDetailDTO;
import com.bytebite.server.dto.RecipeItemRequestDTO;
import com.bytebite.server.dto.RecipeItemResponseDTO;
import com.bytebite.server.dto.RecipeSummaryDTO;
import com.bytebite.server.entity.GroceryItem;
import com.bytebite.server.entity.Recipe;
import com.bytebite.server.repository.RecipeRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class RecipeService {

    private final RecipeRepository repository;

    public RecipeService(RecipeRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<RecipeSummaryDTO> getAll(UUID userId) {
        return repository.findAllByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(recipe -> new RecipeSummaryDTO(recipe.getId(), recipe.getName(), recipe.getCreatedAt()))
                .toList();
    }

    @Transactional(readOnly = true)
    public RecipeDetailDTO getById(UUID id, UUID userId) {
        return toDetail(requireOwned(id, userId));
    }

    @Transactional
    public RecipeDetailDTO create(UUID userId, RecipeCreateRequest request) {
        String name = requireName(request);
        Recipe recipe = new Recipe();
        recipe.setId(UUID.randomUUID());
        recipe.setUserId(userId);
        recipe.setName(name);
        recipe.setCreatedAt(Instant.now());
        recipe.setItems(buildItems(request.items(), recipe));
        return toDetail(repository.save(recipe));
    }

    @Transactional
    public RecipeDetailDTO update(UUID id, UUID userId, RecipeCreateRequest request) {
        String name = requireName(request);
        Recipe recipe = requireOwned(id, userId);
        recipe.setName(name);
        recipe.getItems().clear();
        recipe.getItems().addAll(buildItems(request.items(), recipe));
        return toDetail(repository.save(recipe));
    }

    @Transactional
    public void delete(UUID id, UUID userId) {
        repository.delete(requireOwned(id, userId));
    }

    private List<GroceryItem> buildItems(List<RecipeItemRequestDTO> itemDtos, Recipe recipe) {
        List<GroceryItem> items = new ArrayList<>();
        if (itemDtos == null) {
            return items;
        }
        for (RecipeItemRequestDTO dto : itemDtos) {
            GroceryItem item = GroceryItemMapper.newItem(dto);
            item.setPurchased(false);
            item.setRecipe(recipe);
            items.add(item);
        }
        return items;
    }

    private String requireName(RecipeCreateRequest request) {
        if (request == null || request.name() == null || request.name().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Recipe name is required");
        }
        return request.name();
    }

    private Recipe requireOwned(UUID id, UUID userId) {
        return repository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Recipe not found: " + id));
    }

    private RecipeDetailDTO toDetail(Recipe recipe) {
        List<RecipeItemResponseDTO> items = recipe.getItems().stream()
                .map(item -> new RecipeItemResponseDTO(
                        item.getId(),
                        item.getName(),
                        item.getQuantity(),
                        item.getUnit(),
                        item.getCategory().name()))
                .toList();
        return new RecipeDetailDTO(recipe.getId(), recipe.getName(), recipe.getCreatedAt(), items);
    }
}