package com.bytebite.server.service;

import com.bytebite.server.dto.GroceryItemRequestDTO;
import com.bytebite.server.dto.GroceryItemResponseDTO;
import com.bytebite.server.dto.GroceryListCreateRequest;
import com.bytebite.server.dto.GroceryListDetailDTO;
import com.bytebite.server.dto.GroceryListSummaryDTO;
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
    public List<GroceryListSummaryDTO> getAll(UUID userId) {
        return repository.findSummariesByUserId(userId);
    }

    @Transactional(readOnly = true)
    public GroceryListDetailDTO getById(UUID id, UUID userId) {
        return toDetail(requireOwned(id, userId));
    }

    @Transactional
    public GroceryListDetailDTO create(UUID userId, GroceryListCreateRequest request) {
        String name = requireName(request);
        GroceryList groceryList = new GroceryList();
        groceryList.setId(UUID.randomUUID());
        groceryList.setUserId(userId);
        groceryList.setName(name);
        groceryList.setOutdated(false);
        groceryList.setCreatedAt(Instant.now());
        groceryList.setItems(buildItems(request.items(), groceryList));
        return toDetail(repository.save(groceryList));
    }

    @Transactional
    public GroceryListDetailDTO update(UUID id, UUID userId, GroceryListCreateRequest request) {
        String name = requireName(request);
        GroceryList groceryList = requireOwned(id, userId);
        groceryList.setName(name);
        groceryList.getItems().clear();
        groceryList.getItems().addAll(buildItems(request.items(), groceryList));
        return toDetail(repository.save(groceryList));
    }

    @Transactional
    public void delete(UUID id, UUID userId) {
        repository.delete(requireOwned(id, userId));
    }

    @Transactional
    public GroceryItemResponseDTO setItemPurchased(UUID id, UUID itemId, UUID userId, boolean purchased) {
        GroceryList groceryList = requireOwned(id, userId);
        GroceryItem item = groceryList.getItems().stream()
                .filter(candidate -> candidate.getId().equals(itemId))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Item not found: " + itemId));
        item.setPurchased(purchased);
        return toItemDTO(item);
    }

    private List<GroceryItem> buildItems(List<GroceryItemRequestDTO> itemDtos, GroceryList groceryList) {
        List<GroceryItem> items = new ArrayList<>();
        if (itemDtos == null) {
            return items;
        }
        for (GroceryItemRequestDTO dto : itemDtos) {
            GroceryItem item = GroceryItemMapper.newItem(dto);
            item.setPurchased(dto.purchased());
            item.setGroceryList(groceryList);
            items.add(item);
        }
        return items;
    }

    private String requireName(GroceryListCreateRequest request) {
        if (request == null || request.name() == null || request.name().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Grocery list name is required");
        }
        return request.name();
    }

    private GroceryList requireOwned(UUID id, UUID userId) {
        return repository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Grocery list not found: " + id));
    }

    private GroceryListDetailDTO toDetail(GroceryList groceryList) {
        List<GroceryItemResponseDTO> items = groceryList.getItems().stream()
                .map(this::toItemDTO)
                .toList();
        return new GroceryListDetailDTO(groceryList.getId(), groceryList.getName(), groceryList.getCreatedAt(), items);
    }

    private GroceryItemResponseDTO toItemDTO(GroceryItem item) {
        return new GroceryItemResponseDTO(
                item.getId(),
                item.getName(),
                item.getQuantity(),
                item.getUnit(),
                item.getCategory().name(),
                item.isPurchased());
    }
}