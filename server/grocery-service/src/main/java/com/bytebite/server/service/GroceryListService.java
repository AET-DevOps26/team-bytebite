package com.bytebite.server.service;

import com.bytebite.server.dto.GroceryItemResponseDTO;
import com.bytebite.server.dto.GroceryListDetailDTO;
import com.bytebite.server.dto.GroceryListSummaryDTO;
import com.bytebite.server.entity.GroceryList;
import com.bytebite.server.repository.GroceryListRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

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
}
