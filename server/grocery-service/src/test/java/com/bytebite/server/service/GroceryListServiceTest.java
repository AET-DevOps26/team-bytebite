package com.bytebite.server.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.bytebite.server.dto.GroceryItemRequestDTO;
import com.bytebite.server.dto.GroceryListCreateRequest;
import com.bytebite.server.entity.GroceryCategory;
import com.bytebite.server.entity.GroceryItem;
import com.bytebite.server.entity.GroceryList;
import com.bytebite.server.repository.GroceryListRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class GroceryListServiceTest {
  @Mock private GroceryListRepository repository;

  @InjectMocks private GroceryListService service;

  @Test
  void createBuildsOwnedListWithItemsAndReturnsSavedDto() {
    UUID userId = UUID.randomUUID();
    when(repository.save(any(GroceryList.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));

    var request =
        new GroceryListCreateRequest(
            "Weekend shop",
            List.of(
                new GroceryItemRequestDTO("Milk", 2.0, "l", "Dairy & Eggs", true),
                new GroceryItemRequestDTO("Basil", null, "bunch", "Spices & Herbs", false)));

    var created = service.create(userId, request);

    ArgumentCaptor<GroceryList> captor = ArgumentCaptor.forClass(GroceryList.class);
    verify(repository).save(captor.capture());
    GroceryList saved = captor.getValue();
    assertThat(saved.getUserId()).isEqualTo(userId);
    assertThat(saved.getName()).isEqualTo("Weekend shop");
    assertThat(saved.isOutdated()).isFalse();
    assertThat(saved.getCreatedAt()).isNotNull();
    assertThat(saved.getItems()).hasSize(2);
    assertThat(saved.getItems().getFirst().getGroceryList()).isSameAs(saved);
    assertThat(saved.getItems().getFirst().getCategory()).isEqualTo(GroceryCategory.DAIRY);
    assertThat(saved.getItems().getFirst().isPurchased()).isTrue();

    assertThat(created.groceryListId()).isEqualTo(saved.getId());
    assertThat(created.items()).extracting("name").containsExactly("Milk", "Basil");
  }

  @Test
  void updateReplacesExistingItems() {
    UUID userId = UUID.randomUUID();
    UUID listId = UUID.randomUUID();
    GroceryList existing = list(listId, userId, "Old", item("Old item"));
    when(repository.findByIdAndUserId(listId, userId)).thenReturn(Optional.of(existing));
    when(repository.save(any(GroceryList.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));

    service.update(
        listId,
        userId,
        new GroceryListCreateRequest(
            "New", List.of(new GroceryItemRequestDTO("Tomato", 4.0, "pcs", "Produce", false))));

    assertThat(existing.getName()).isEqualTo("New");
    assertThat(existing.getItems()).hasSize(1);
    assertThat(existing.getItems().getFirst().getName()).isEqualTo("Tomato");
    assertThat(existing.getItems().getFirst().getGroceryList()).isSameAs(existing);
  }

  @Test
  void setItemPurchasedRejectsUnknownItem() {
    UUID userId = UUID.randomUUID();
    UUID listId = UUID.randomUUID();
    when(repository.findByIdAndUserId(listId, userId))
        .thenReturn(Optional.of(list(listId, userId, "List")));

    assertThatThrownBy(() -> service.setItemPurchased(listId, UUID.randomUUID(), userId, true))
        .isInstanceOfSatisfying(
            ResponseStatusException.class,
            exception -> assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND));
  }

  @Test
  void createRejectsBlankName() {
    assertThatThrownBy(
            () -> service.create(UUID.randomUUID(), new GroceryListCreateRequest(" ", List.of())))
        .isInstanceOfSatisfying(
            ResponseStatusException.class,
            exception -> assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST));
  }

  private static GroceryList list(UUID id, UUID userId, String name, GroceryItem... items) {
    GroceryList list = new GroceryList();
    list.setId(id);
    list.setUserId(userId);
    list.setName(name);
    list.setCreatedAt(Instant.now());
    list.setOutdated(false);
    list.setItems(new ArrayList<>(List.of(items)));
    for (GroceryItem item : list.getItems()) {
      item.setGroceryList(list);
    }
    return list;
  }

  private static GroceryItem item(String name) {
    GroceryItem item = new GroceryItem();
    item.setId(UUID.randomUUID());
    item.setName(name);
    item.setUnit("");
    item.setCategory(GroceryCategory.OTHER);
    item.setPurchased(false);
    return item;
  }
}
