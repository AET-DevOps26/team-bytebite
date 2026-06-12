package com.bytebite.server.recipe;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Repository;
import org.springframework.web.server.ResponseStatusException;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Repository
public class RecipeRepository {
    private final String datasourceUrl;
    private final String datasourceUsername;
    private final String datasourcePassword;

    public RecipeRepository(
            @Value("${spring.datasource.url}") String datasourceUrl,
            @Value("${spring.datasource.username}") String datasourceUsername,
            @Value("${spring.datasource.password}") String datasourcePassword
    ) {
        this.datasourceUrl = datasourceUrl;
        this.datasourceUsername = datasourceUsername;
        this.datasourcePassword = datasourcePassword;
    }

    /** Inserts a recipe and its items atomically, returning the persisted recipe. */
    public Recipe create(UUID userId, String name, List<RecipeRequest.Item> items) {
        String insertRecipe = """
                INSERT INTO recipes (name, user_id)
                VALUES (?, ?)
                RETURNING recipe_id, created_at
                """;
        try (Connection connection = connect()) {
            connection.setAutoCommit(false);
            try {
                UUID recipeId;
                OffsetDateTime createdAt;
                try (PreparedStatement statement = connection.prepareStatement(insertRecipe)) {
                    statement.setString(1, name);
                    statement.setObject(2, userId);
                    try (ResultSet resultSet = statement.executeQuery()) {
                        resultSet.next();
                        recipeId = resultSet.getObject("recipe_id", UUID.class);
                        createdAt = resultSet.getObject("created_at", OffsetDateTime.class);
                    }
                }
                List<RecipeItem> persistedItems = insertItems(connection, recipeId, items);
                connection.commit();
                return new Recipe(recipeId, name, createdAt, persistedItems);
            } catch (SQLException exception) {
                connection.rollback();
                throw exception;
            }
        } catch (SQLException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not create recipe.");
        }
    }

    public List<Recipe> findAllByUser(UUID userId) {
        return query(BASE_SELECT + " WHERE r.user_id = ? ORDER BY r.created_at DESC, i.name ASC", userId, null);
    }

    public Optional<Recipe> findByIdForUser(UUID recipeId, UUID userId) {
        List<Recipe> recipes = query(
                BASE_SELECT + " WHERE r.user_id = ? AND r.recipe_id = ? ORDER BY i.name ASC", userId, recipeId);
        return recipes.isEmpty() ? Optional.empty() : Optional.of(recipes.get(0));
    }

    /** Renames a recipe and replaces all of its items. Empty if the recipe is not owned by the user. */
    public Optional<Recipe> replace(UUID recipeId, UUID userId, String name, List<RecipeRequest.Item> items) {
        try (Connection connection = connect()) {
            connection.setAutoCommit(false);
            try {
                OffsetDateTime createdAt;
                try (PreparedStatement statement = connection.prepareStatement(
                        "UPDATE recipes SET name = ? WHERE recipe_id = ? AND user_id = ? RETURNING created_at")) {
                    statement.setString(1, name);
                    statement.setObject(2, recipeId);
                    statement.setObject(3, userId);
                    try (ResultSet resultSet = statement.executeQuery()) {
                        if (!resultSet.next()) {
                            connection.rollback();
                            return Optional.empty();
                        }
                        createdAt = resultSet.getObject("created_at", OffsetDateTime.class);
                    }
                }
                try (PreparedStatement delete = connection.prepareStatement(
                        "DELETE FROM grocery_items WHERE recipe_id = ?")) {
                    delete.setObject(1, recipeId);
                    delete.executeUpdate();
                }
                List<RecipeItem> persistedItems = insertItems(connection, recipeId, items);
                connection.commit();
                return Optional.of(new Recipe(recipeId, name, createdAt, persistedItems));
            } catch (SQLException exception) {
                connection.rollback();
                throw exception;
            }
        } catch (SQLException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not update recipe.");
        }
    }

    /** Deletes a recipe (items cascade). Returns false if nothing was owned/deleted. */
    public boolean deleteForUser(UUID recipeId, UUID userId) {
        try (Connection connection = connect();
             PreparedStatement statement = connection.prepareStatement(
                     "DELETE FROM recipes WHERE recipe_id = ? AND user_id = ?")) {
            statement.setObject(1, recipeId);
            statement.setObject(2, userId);
            return statement.executeUpdate() > 0;
        } catch (SQLException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not delete recipe.");
        }
    }

    private List<RecipeItem> insertItems(Connection connection, UUID recipeId, List<RecipeRequest.Item> items)
            throws SQLException {
        List<RecipeItem> persisted = new ArrayList<>();
        if (items == null || items.isEmpty()) {
            return persisted;
        }
        String sql = """
                INSERT INTO grocery_items (name, quantity, unit, category, recipe_id)
                VALUES (?, ?, ?, ?, ?)
                RETURNING item_id
                """;
        for (RecipeRequest.Item item : items) {
            String itemName = require(item.name(), "Item name is required.");
            String quantity = blankToDefault(item.quantity(), "N/A");
            String unit = blankToDefault(item.unit(), "");
            String category = blankToDefault(item.category(), "OTHER");
            try (PreparedStatement statement = connection.prepareStatement(sql)) {
                statement.setString(1, itemName);
                statement.setString(2, quantity);
                statement.setString(3, unit);
                statement.setString(4, category);
                statement.setObject(5, recipeId);
                try (ResultSet resultSet = statement.executeQuery()) {
                    resultSet.next();
                    persisted.add(new RecipeItem(
                            resultSet.getObject("item_id", UUID.class),
                            itemName, quantity, unit, category));
                }
            }
        }
        return persisted;
    }

    private static final String BASE_SELECT = """
            SELECT r.recipe_id, r.name AS recipe_name, r.created_at,
                   i.item_id, i.name AS item_name, i.quantity, i.unit, i.category
            FROM recipes r
            LEFT JOIN grocery_items i ON i.recipe_id = r.recipe_id
            """;

    private List<Recipe> query(String sql, UUID userId, UUID recipeId) {
        try (Connection connection = connect();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setObject(1, userId);
            if (recipeId != null) {
                statement.setObject(2, recipeId);
            }
            try (ResultSet resultSet = statement.executeQuery()) {
                Map<UUID, List<RecipeItem>> itemsByRecipe = new LinkedHashMap<>();
                Map<UUID, Recipe> shells = new LinkedHashMap<>();
                while (resultSet.next()) {
                    UUID id = resultSet.getObject("recipe_id", UUID.class);
                    shells.computeIfAbsent(id, key -> new Recipe(
                            id,
                            sqlString(resultSet, "recipe_name"),
                            sqlOffsetDateTime(resultSet),
                            null));
                    List<RecipeItem> items = itemsByRecipe.computeIfAbsent(id, key -> new ArrayList<>());
                    UUID itemId = resultSet.getObject("item_id", UUID.class);
                    if (itemId != null) {
                        items.add(new RecipeItem(
                                itemId,
                                resultSet.getString("item_name"),
                                resultSet.getString("quantity"),
                                resultSet.getString("unit"),
                                resultSet.getString("category")));
                    }
                }
                List<Recipe> recipes = new ArrayList<>();
                for (Recipe shell : shells.values()) {
                    recipes.add(new Recipe(shell.recipeId(), shell.name(), shell.createdAt(),
                            itemsByRecipe.get(shell.recipeId())));
                }
                return recipes;
            }
        } catch (SQLException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not read recipes.");
        }
    }

    private static String sqlString(ResultSet resultSet, String column) {
        try {
            return resultSet.getString(column);
        } catch (SQLException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not read recipes.");
        }
    }

    private static OffsetDateTime sqlOffsetDateTime(ResultSet resultSet) {
        try {
            return resultSet.getObject("created_at", OffsetDateTime.class);
        } catch (SQLException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not read recipes.");
        }
    }

    private static String require(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
        return value;
    }

    private static String blankToDefault(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private Connection connect() throws SQLException {
        return DriverManager.getConnection(datasourceUrl, datasourceUsername, datasourcePassword);
    }
}