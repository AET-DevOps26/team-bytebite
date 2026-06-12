package com.bytebite.server;

import com.bytebite.server.dto.GroceryListDetailDTO;
import com.bytebite.server.dto.GroceryListSummaryDTO;
import com.bytebite.server.service.GroceryListService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/grocery-list")
@Tag(name = "Grocery Lists", description = "Stored grocery-list history and details")
public class GroceryListController {

    private final GroceryListService service;

    public GroceryListController(GroceryListService service) {
        this.service = service;
    }

    @GetMapping(value = "/history", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(
            summary = "List recent grocery lists",
            description = "Returns a summary of the 20 most recently created grocery lists, newest first.",
            security = @SecurityRequirement(name = "bearerAuth"),
            responses = {
                    @ApiResponse(responseCode = "200", description = "Grocery-list summaries"),
                    @ApiResponse(responseCode = "401", description = "Missing, expired, or invalid JWT", content = @Content)
            }
    )
    public List<GroceryListSummaryDTO> getHistory() {
        return service.getHistory();
    }

    @GetMapping(value = "/history/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(
            summary = "Get a grocery list by id",
            description = "Returns a single grocery list including its items.",
            security = @SecurityRequirement(name = "bearerAuth"),
            responses = {
                    @ApiResponse(responseCode = "200", description = "Grocery list with items"),
                    @ApiResponse(responseCode = "401", description = "Missing, expired, or invalid JWT", content = @Content),
                    @ApiResponse(responseCode = "404", description = "Grocery list not found", content = @Content(schema = @Schema(implementation = Map.class)))
            }
    )
    public GroceryListDetailDTO getById(
            @Parameter(description = "Identifier of the grocery list", required = true)
            @PathVariable UUID id) {
        return service.getById(id);
    }
}
