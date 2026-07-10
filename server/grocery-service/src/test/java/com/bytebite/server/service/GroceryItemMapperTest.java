package com.bytebite.server.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.bytebite.server.dto.GroceryItemRequestDTO;
import com.bytebite.server.entity.GroceryCategory;
import com.bytebite.server.entity.GroceryItem;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

class GroceryItemMapperTest {
  @Test
  void mapsKnownAiCategoryAliases() {
    assertThat(GroceryItemMapper.parseCategory("Dairy & Eggs")).isEqualTo(GroceryCategory.DAIRY);
    assertThat(GroceryItemMapper.parseCategory("dry goods & pasta"))
        .isEqualTo(GroceryCategory.PANTRY);
    assertThat(GroceryItemMapper.parseCategory("Spices & Herbs")).isEqualTo(GroceryCategory.SPICES);
  }

  @Test
  void defaultsUnknownOrBlankCategoryToOther() {
    assertThat(GroceryItemMapper.parseCategory(null)).isEqualTo(GroceryCategory.OTHER);
    assertThat(GroceryItemMapper.parseCategory("")).isEqualTo(GroceryCategory.OTHER);
    assertThat(GroceryItemMapper.parseCategory("Hardware")).isEqualTo(GroceryCategory.OTHER);
  }

  @Test
  void newItemValidatesNameAndNormalizesNullUnit() {
    GroceryItem item =
        GroceryItemMapper.newItem(
            new GroceryItemRequestDTO("Milk", 1.0, null, "Dairy & Eggs", false));

    assertThat(item.getId()).isNotNull();
    assertThat(item.getName()).isEqualTo("Milk");
    assertThat(item.getUnit()).isEmpty();
    assertThat(item.getCategory()).isEqualTo(GroceryCategory.DAIRY);
  }

  @Test
  void newItemRejectsBlankName() {
    assertThatThrownBy(
            () ->
                GroceryItemMapper.newItem(
                    new GroceryItemRequestDTO(" ", 1.0, "kg", "Produce", false)))
        .isInstanceOfSatisfying(
            ResponseStatusException.class,
            exception -> assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST));
  }
}
