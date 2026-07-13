package com.bytebite.server;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.bytebite.server.dto.GroceryItemPatchRequest;
import com.bytebite.server.dto.GroceryItemResponseDTO;
import com.bytebite.server.dto.GroceryListDetailDTO;
import com.bytebite.server.service.GroceryListMergeService;
import com.bytebite.server.service.GroceryListService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(GroceryListController.class)
class GroceryListControllerTest {
  @Autowired private MockMvc mockMvc;

  @Autowired private ObjectMapper objectMapper;

  @MockBean private GroceryListService groceryListService;

  @MockBean private GroceryListMergeService mergeService;

  @Test
  void updateItemRejectsMissingPurchasedFlagBeforeCallingService() throws Exception {
    UUID userId = UUID.randomUUID();
    UUID listId = UUID.randomUUID();
    UUID itemId = UUID.randomUUID();

    mockMvc
        .perform(
            patch("/api/grocery-list/{listId}/items/{itemId}", listId, itemId)
                .header("X-User-Id", userId)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
        .andExpect(status().isBadRequest());

    verifyNoInteractions(groceryListService);
  }

  @Test
  void updateItemReturnsUpdatedItem() throws Exception {
    UUID userId = UUID.randomUUID();
    UUID listId = UUID.randomUUID();
    UUID itemId = UUID.randomUUID();
    when(groceryListService.setItemPurchased(listId, itemId, userId, true))
        .thenReturn(new GroceryItemResponseDTO(itemId, "Milk", 1.0, "l", "DAIRY", true));

    mockMvc
        .perform(
            patch("/api/grocery-list/{listId}/items/{itemId}", listId, itemId)
                .header("X-User-Id", userId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new GroceryItemPatchRequest(true))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.itemId").value(itemId.toString()))
        .andExpect(jsonPath("$.purchased").value(true));

    verify(groceryListService).setItemPurchased(listId, itemId, userId, true);
  }

  @Test
  void mergeReturnsCreatedLocationForNewGroceryList() throws Exception {
    UUID userId = UUID.randomUUID();
    UUID listId = UUID.randomUUID();
    when(mergeService.merge(eq(userId), org.mockito.ArgumentMatchers.any()))
        .thenReturn(new GroceryListDetailDTO(listId, "Merged", Instant.now(), List.of()));

    mockMvc
        .perform(
            post("/api/grocery-list/merge")
                .header("X-User-Id", userId)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"recipeIds\":[\"" + UUID.randomUUID() + "\"]}"))
        .andExpect(status().isCreated())
        .andExpect(header().string("Location", "http://localhost/api/grocery-list/" + listId))
        .andExpect(jsonPath("$.groceryListId").value(listId.toString()));
  }
}
