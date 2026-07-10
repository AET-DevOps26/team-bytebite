package com.bytebite.server.auth;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Optional;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Repository;
import org.springframework.web.server.ResponseStatusException;

@Repository
public class UserRepository {
  private final String datasourceUrl;
  private final String datasourceUsername;
  private final String datasourcePassword;

  public UserRepository(
      @Value("${spring.datasource.url}") String datasourceUrl,
      @Value("${spring.datasource.username}") String datasourceUsername,
      @Value("${spring.datasource.password}") String datasourcePassword) {
    this.datasourceUrl = datasourceUrl;
    this.datasourceUsername = datasourceUsername;
    this.datasourcePassword = datasourcePassword;
  }

  public UserRecord create(String name, String email, String passwordHash) {
    String sql =
        """
                INSERT INTO users (name, email, password_hash)
                VALUES (?, ?, ?)
                RETURNING user_id, name, email, password_hash, created_at
                """;
    try (Connection connection = connect();
        PreparedStatement statement = connection.prepareStatement(sql)) {
      statement.setString(1, name);
      statement.setString(2, email);
      statement.setString(3, passwordHash);
      try (ResultSet resultSet = statement.executeQuery()) {
        resultSet.next();
        return map(resultSet);
      }
    } catch (SQLException exception) {
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not create user.");
    }
  }

  public UserRecord updateProfile(UUID userId, String name, String email) {
    String sql =
        """
                UPDATE users
                SET name = ?, email = ?
                WHERE user_id = ?
                RETURNING user_id, name, email, password_hash, created_at
                """;
    try (Connection connection = connect();
        PreparedStatement statement = connection.prepareStatement(sql)) {
      statement.setString(1, name);
      statement.setString(2, email);
      statement.setObject(3, userId);
      try (ResultSet resultSet = statement.executeQuery()) {
        if (!resultSet.next()) {
          throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User no longer exists.");
        }
        return map(resultSet);
      }
    } catch (SQLException exception) {
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not update user.");
    }
  }

  public UserRecord updatePassword(UUID userId, String passwordHash) {
    String sql =
        """
                UPDATE users
                SET password_hash = ?
                WHERE user_id = ?
                RETURNING user_id, name, email, password_hash, created_at
                """;
    try (Connection connection = connect();
        PreparedStatement statement = connection.prepareStatement(sql)) {
      statement.setString(1, passwordHash);
      statement.setObject(2, userId);
      try (ResultSet resultSet = statement.executeQuery()) {
        if (!resultSet.next()) {
          throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User no longer exists.");
        }
        return map(resultSet);
      }
    } catch (SQLException exception) {
      throw new ResponseStatusException(
          HttpStatus.INTERNAL_SERVER_ERROR, "Could not update password.");
    }
  }

  public Optional<UserRecord> findByEmail(String email) {
    return find(
        "SELECT user_id, name, email, password_hash, created_at FROM users WHERE email = ?", email);
  }

  public Optional<UserRecord> findById(UUID userId) {
    return find(
        "SELECT user_id, name, email, password_hash, created_at FROM users WHERE user_id = ?",
        userId);
  }

  private Optional<UserRecord> find(String sql, Object value) {
    try (Connection connection = connect();
        PreparedStatement statement = connection.prepareStatement(sql)) {
      if (value instanceof UUID uuid) {
        statement.setObject(1, uuid);
      } else {
        statement.setString(1, String.valueOf(value));
      }
      try (ResultSet resultSet = statement.executeQuery()) {
        if (!resultSet.next()) {
          return Optional.empty();
        }
        return Optional.of(map(resultSet));
      }
    } catch (SQLException exception) {
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not read user.");
    }
  }

  private Connection connect() throws SQLException {
    return DriverManager.getConnection(datasourceUrl, datasourceUsername, datasourcePassword);
  }

  private UserRecord map(ResultSet resultSet) throws SQLException {
    return new UserRecord(
        resultSet.getObject("user_id", UUID.class),
        resultSet.getString("name"),
        resultSet.getString("email"),
        resultSet.getString("password_hash"),
        resultSet.getObject("created_at", java.time.OffsetDateTime.class));
  }
}
