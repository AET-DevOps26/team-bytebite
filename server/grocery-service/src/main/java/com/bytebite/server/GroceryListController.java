package com.bytebite.server;

import com.bytebite.server.dto.GroceryListDetailDTO;
import com.bytebite.server.dto.GroceryListSummaryDTO;
import com.bytebite.server.service.GroceryListService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/grocery-list")
public class GroceryListController {

    private final GroceryListService service;

    public GroceryListController(GroceryListService service) {
        this.service = service;
    }

    @GetMapping("/history")
    public List<GroceryListSummaryDTO> getHistory() {
        return service.getHistory();
    }

    @GetMapping("/history/{id}")
    public GroceryListDetailDTO getById(@PathVariable UUID id) {
        return service.getById(id);
    }
}
