package com.bytebite.server;

import com.bytebite.server.dto.GroceryItemPatchRequest;
import com.bytebite.server.dto.GroceryItemResponseDTO;
import com.bytebite.server.dto.GroceryListCreateRequest;
import com.bytebite.server.dto.GroceryListDetailDTO;
import com.bytebite.server.dto.GroceryListSummaryDTO;
import com.bytebite.server.dto.MergeListRequest;
import com.bytebite.server.service.GroceryListMergeService;
import com.bytebite.server.service.GroceryListService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/grocery-list")
@Tag(name = "Grocery Lists", description = "Stored grocery-list history and details")
public class GroceryListController {

    private final GroceryListService service;
    private final GroceryListMergeService mergeService;

    public GroceryListController(GroceryListService service, GroceryListMergeService mergeService) {
        this.service = service;
        this.mergeService = mergeService;
    }

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(
            summary = "List grocery lists",
            description = "Returns a summary of all the caller's grocery lists, newest first.",
            security = @SecurityRequirement(name = "bearerAuth"),
            responses = {
                    @ApiResponse(responseCode = "200", description = "Grocery-list summaries"),
                    @ApiResponse(responseCode = "401", description = "Missing, expired, or invalid JWT", content = @Content)
            }
    )
    public List<GroceryListSummaryDTO> list(
            @Parameter(hidden = true) @RequestHeader("X-User-Id") UUID userId) {
        return service.getAll(userId);
    }

    @GetMapping(value = "/{groceryListId}", produces = MediaType.APPLICATION_JSON_VALUE)
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
            @Parameter(hidden = true) @RequestHeader("X-User-Id") UUID userId,
            @Parameter(description = "Identifier of the grocery list", required = true)
            @PathVariable UUID groceryListId) {
        return service.getById(groceryListId, userId);
    }

    @PostMapping(
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(
            summary = "Create a grocery list",
            description = "Persists a new grocery list with its items and returns the created resource.",
            security = @SecurityRequirement(name = "bearerAuth"),
            responses = {
                    @ApiResponse(responseCode = "201", description = "Grocery list created"),
                    @ApiResponse(responseCode = "400", description = "Invalid request body", content = @Content(schema = @Schema(implementation = Map.class))),
                    @ApiResponse(responseCode = "401", description = "Missing, expired, or invalid JWT", content = @Content)
            }
    )
    public ResponseEntity<GroceryListDetailDTO> create(
            @Parameter(hidden = true) @RequestHeader("X-User-Id") UUID userId,
            @RequestBody GroceryListCreateRequest request) {
        GroceryListDetailDTO created = service.create(userId, request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(created.groceryListId())
                .toUri();
        return ResponseEntity.created(location).body(created);
    }

    @PostMapping(value = "/merge",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(
            summary = "Merge recipes into a new grocery list",
            description = "Reads the selected recipes, asks the Gen AI service to deduplicate and sum their "
                    + "ingredients, then persists the result as a new grocery list linked to those recipes.",
            security = @SecurityRequirement(name = "bearerAuth"),
            responses = {
                    @ApiResponse(responseCode = "201", description = "Merged grocery list created"),
                    @ApiResponse(responseCode = "400", description = "No recipes provided", content = @Content(schema = @Schema(implementation = Map.class))),
                    @ApiResponse(responseCode = "401", description = "Missing, expired, or invalid JWT", content = @Content),
                    @ApiResponse(responseCode = "404", description = "One or more recipes not found", content = @Content(schema = @Schema(implementation = Map.class))),
                    @ApiResponse(responseCode = "422", description = "AI service returned no merged ingredients", content = @Content(schema = @Schema(implementation = Map.class))),
                    @ApiResponse(responseCode = "502", description = "AI service rejected or failed the request", content = @Content(schema = @Schema(implementation = Map.class))),
                    @ApiResponse(responseCode = "503", description = "AI service is unreachable", content = @Content(schema = @Schema(implementation = Map.class)))
            }
    )
    public ResponseEntity<GroceryListDetailDTO> merge(
            @Parameter(hidden = true) @RequestHeader("X-User-Id") UUID userId,
            @RequestBody MergeListRequest request) {
        GroceryListDetailDTO created = mergeService.merge(userId, request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequestUri()
                .replacePath("/api/grocery-list/{id}")
                .buildAndExpand(created.groceryListId())
                .toUri();
        return ResponseEntity.created(location).body(created);
    }

    @PutMapping(value = "/{groceryListId}",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(
            summary = "Replace a grocery list's name and items",
            description = "Renames the grocery list and replaces all of its items.",
            security = @SecurityRequirement(name = "bearerAuth"),
            responses = {
                    @ApiResponse(responseCode = "200", description = "Grocery list updated"),
                    @ApiResponse(responseCode = "400", description = "Invalid request body", content = @Content(schema = @Schema(implementation = Map.class))),
                    @ApiResponse(responseCode = "401", description = "Missing, expired, or invalid JWT", content = @Content),
                    @ApiResponse(responseCode = "404", description = "Grocery list not found", content = @Content(schema = @Schema(implementation = Map.class)))
            }
    )
    public GroceryListDetailDTO update(
            @Parameter(hidden = true) @RequestHeader("X-User-Id") UUID userId,
            @Parameter(description = "Identifier of the grocery list", required = true)
            @PathVariable UUID groceryListId,
            @RequestBody GroceryListCreateRequest request) {
        return service.update(groceryListId, userId, request);
    }

    @PatchMapping(value = "/{groceryListId}/items/{itemId}",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(
            summary = "Update a grocery item's purchased flag",
            description = "Marks a single item in the list as picked up (or not) without resending the whole list.",
            security = @SecurityRequirement(name = "bearerAuth"),
            responses = {
                    @ApiResponse(responseCode = "200", description = "Item updated"),
                    @ApiResponse(responseCode = "400", description = "Missing purchased flag", content = @Content(schema = @Schema(implementation = Map.class))),
                    @ApiResponse(responseCode = "401", description = "Missing, expired, or invalid JWT", content = @Content),
                    @ApiResponse(responseCode = "404", description = "Grocery list or item not found", content = @Content(schema = @Schema(implementation = Map.class)))
            }
    )
    public GroceryItemResponseDTO updateItem(
            @Parameter(hidden = true) @RequestHeader("X-User-Id") UUID userId,
            @Parameter(description = "Identifier of the grocery list", required = true)
            @PathVariable UUID groceryListId,
            @Parameter(description = "Identifier of the item", required = true)
            @PathVariable UUID itemId,
            @RequestBody GroceryItemPatchRequest request) {
        if (request == null || request.purchased() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "purchased is required");
        }
        return service.setItemPurchased(groceryListId, itemId, userId, request.purchased());
    }

    @DeleteMapping(value = "/{groceryListId}")
    @Operation(
            summary = "Delete a grocery list",
            description = "Deletes the grocery list identified by the given id along with its items.",
            security = @SecurityRequirement(name = "bearerAuth"),
            responses = {
                    @ApiResponse(responseCode = "204", description = "Grocery list deleted"),
                    @ApiResponse(responseCode = "401", description = "Missing, expired, or invalid JWT", content = @Content),
                    @ApiResponse(responseCode = "404", description = "Grocery list not found", content = @Content(schema = @Schema(implementation = Map.class)))
            }
    )
    public ResponseEntity<Void> delete(
            @Parameter(hidden = true) @RequestHeader("X-User-Id") UUID userId,
            @Parameter(description = "Identifier of the grocery list", required = true)
            @PathVariable UUID groceryListId) {
        service.delete(groceryListId, userId);
        return ResponseEntity.noContent().build();
    }
}
