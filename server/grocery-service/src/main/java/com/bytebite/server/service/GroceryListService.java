package com.bytebite.server.service;

import com.bytebite.server.dto.GroceryItemRequestDTO;
import com.bytebite.server.dto.GroceryItemResponseDTO;
import com.bytebite.server.dto.GroceryListCreateRequest;
import com.bytebite.server.dto.GroceryListDetailDTO;
import com.bytebite.server.dto.GroceryListSummaryDTO;
import com.bytebite.server.entity.GroceryCategory;
import com.bytebite.server.entity.GroceryItem;
import com.bytebite.server.entity.GroceryList;
import com.bytebite.server.repository.GroceryListRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class GroceryListService {

    private final GroceryListRepository repository;

    public GroceryListService(GroceryListRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<GroceryListSummaryDTO> getHistory() {
        return repository.findTop20ByOrderByCreatedAtDesc().stream()
                .map(gl -> new GroceryListSummaryDTO(gl.getId(), gl.getName(), gl.getCreatedAt()))
                .toList();
    }

    @Transactional(readOnly = true)
    public GroceryListDetailDTO getById(UUID id) {
        GroceryList groceryList = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Grocery list not found: " + id));
        return toDetail(groceryList);
    }

    @Transactional
    public GroceryListDetailDTO create(GroceryListCreateRequest request) {
        if (request.name() == null || request.name().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Grocery list name is required");
        }
        if (request.userId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "userId is required");
        }

        GroceryList groceryList = new GroceryList();
        groceryList.setId(UUID.randomUUID());
        groceryList.setName(request.name());
        groceryList.setUserId(request.userId());
        groceryList.setOutdated(false);
        groceryList.setCreatedAt(Instant.now());

        List<GroceryItem> items = new ArrayList<>();
        if (request.items() != null) {
            for (GroceryItemRequestDTO itemDto : request.items()) {
                GroceryItem item = new GroceryItem();
                item.setId(UUID.randomUUID());
                item.setName(itemDto.name());
                item.setQuantity(itemDto.quantity());
                item.setUnit(itemDto.unit());
                item.setCategory(parseCategory(itemDto.category()));
                item.setPurchased(itemDto.purchased());
                item.setGroceryList(groceryList);
                items.add(item);
            }
        }
        groceryList.setItems(items);

        return toDetail(repository.save(groceryList));
    }

    @Transactional
    public void delete(UUID id) {
        if (!repository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Grocery list not found: " + id);
        }
        repository.deleteById(id);
    }

    private GroceryListDetailDTO toDetail(GroceryList groceryList) {
        List<GroceryItemResponseDTO> items = groceryList.getItems().stream()
                .map(item -> new GroceryItemResponseDTO(
                        item.getId(),
                        item.getName(),
                        item.getQuantity(),
                        item.getUnit(),
                        item.getCategory().name(),
                        item.isPurchased()
                ))
                .toList();

        return new GroceryListDetailDTO(groceryList.getId(), groceryList.getName(), groceryList.getCreatedAt(), items);
    }

    private GroceryCategory parseCategory(String category) {
        if (category == null || category.isBlank()) {
            return GroceryCategory.OTHER;
        }
        try {
            return GroceryCategory.valueOf(category.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown grocery category: " + category);
        }
    }
}
