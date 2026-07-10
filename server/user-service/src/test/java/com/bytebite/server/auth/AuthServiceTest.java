package com.bytebite.server.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

class AuthServiceTest {
  private final InMemoryUserRepository users = new InMemoryUserRepository();
  private final JwtTokenService tokens =
      new JwtTokenService("test-secret-with-at-least-32-chars", 3600);
  private final AuthService service = new AuthService(users, tokens);

  @Test
  void registerNormalizesEmailHashesPasswordAndReturnsToken() {
    AuthResponse response =
        service.register(
            new RegisterRequest("  Ada Lovelace  ", " ADA@Example.COM ", "correct horse"));

    assertThat(response.token()).isNotBlank();
    assertThat(response.user().name()).isEqualTo("Ada Lovelace");
    assertThat(response.user().email()).isEqualTo("ada@example.com");

    UserRecord stored = users.findByEmail("ada@example.com").orElseThrow();
    assertThat(stored.name()).isEqualTo("Ada Lovelace");
    assertThat(stored.passwordHash()).isNotEqualTo("correct horse");
    assertThat(new BCryptPasswordEncoder().matches("correct horse", stored.passwordHash()))
        .isTrue();
  }

  @Test
  void registerRejectsDuplicateEmail() {
    service.register(new RegisterRequest("Ada", "ada@example.com", "correct horse"));

    assertThatThrownBy(
            () ->
                service.register(
                    new RegisterRequest("Ada Two", "ADA@example.com", "another password")))
        .isInstanceOfSatisfying(
            ResponseStatusException.class,
            exception -> assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.CONFLICT));
  }

  @Test
  void loginRejectsWrongPassword() {
    service.register(new RegisterRequest("Ada", "ada@example.com", "correct horse"));

    assertThatThrownBy(() -> service.login(new LoginRequest("ada@example.com", "wrong password")))
        .isInstanceOfSatisfying(
            ResponseStatusException.class,
            exception -> assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED));
  }

  @Test
  void currentUserLoadsUserReferencedByJwt() {
    AuthResponse registered =
        service.register(new RegisterRequest("Ada", "ada@example.com", "correct horse"));

    AuthResponse current = service.currentUser("Bearer " + registered.token());

    assertThat(current.user()).isEqualTo(registered.user());
    assertThat(tokens.verify("Bearer " + current.token()).userId())
        .isEqualTo(registered.user().userId());
  }

  @Test
  void updateProfileRejectsEmailWithoutAtSymbol() {
    AuthResponse registered =
        service.register(new RegisterRequest("Ada", "ada@example.com", "correct horse"));
    String auth = "Bearer " + registered.token();

    assertThatThrownBy(
            () -> service.updateProfile(auth, new UpdateProfileRequest("Ada", "ada.example.com")))
        .isInstanceOfSatisfying(
            ResponseStatusException.class,
            exception -> assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST));

    // The stored email is untouched, so the user can still log in.
    assertThat(users.findByEmail("ada@example.com")).isPresent();
    assertThat(service.login(new LoginRequest("ada@example.com", "correct horse")).token())
        .isNotBlank();
  }

  @Test
  void updateProfileRejectsEmailAlreadyUsedByAnotherUser() {
    service.register(new RegisterRequest("Grace", "grace@example.com", "correct horse"));
    AuthResponse ada =
        service.register(new RegisterRequest("Ada", "ada@example.com", "correct horse"));
    String auth = "Bearer " + ada.token();

    assertThatThrownBy(
            () -> service.updateProfile(auth, new UpdateProfileRequest("Ada", "grace@example.com")))
        .isInstanceOfSatisfying(
            ResponseStatusException.class,
            exception -> assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.CONFLICT));
  }

  @Test
  void updateProfileAllowsKeepingYourOwnEmailAndReissuesToken() {
    AuthResponse registered =
        service.register(new RegisterRequest("Ada", "ada@example.com", "correct horse"));

    AuthResponse updated =
        service.updateProfile(
            "Bearer " + registered.token(),
            new UpdateProfileRequest("Ada Lovelace", "ada@example.com"));

    assertThat(updated.user().name()).isEqualTo("Ada Lovelace");
    assertThat(tokens.verify("Bearer " + updated.token()).name()).isEqualTo("Ada Lovelace");
  }

  @Test
  void updatePasswordRejectsWrongCurrentPassword() {
    AuthResponse registered =
        service.register(new RegisterRequest("Ada", "ada@example.com", "correct horse"));
    String auth = "Bearer " + registered.token();

    assertThatThrownBy(
            () -> service.updatePassword(auth, new UpdatePasswordRequest("wrong", "new password")))
        .isInstanceOfSatisfying(
            ResponseStatusException.class,
            exception -> assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED));
  }

  @Test
  void updatePasswordReplacesHashSoOnlyTheNewPasswordLogsIn() {
    AuthResponse registered =
        service.register(new RegisterRequest("Ada", "ada@example.com", "correct horse"));

    service.updatePassword(
        "Bearer " + registered.token(), new UpdatePasswordRequest("correct horse", "new password"));

    assertThat(service.login(new LoginRequest("ada@example.com", "new password")).token())
        .isNotBlank();
    assertThatThrownBy(() -> service.login(new LoginRequest("ada@example.com", "correct horse")))
        .isInstanceOfSatisfying(
            ResponseStatusException.class,
            exception -> assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED));
  }

  private static final class InMemoryUserRepository extends UserRepository {
    private final Map<UUID, UserRecord> byId = new LinkedHashMap<>();
    private final Map<String, UserRecord> byEmail = new LinkedHashMap<>();

    private InMemoryUserRepository() {
      super("jdbc:unused", "unused", "unused");
    }

    @Override
    public UserRecord create(String name, String email, String passwordHash) {
      UserRecord user =
          new UserRecord(UUID.randomUUID(), name, email, passwordHash, OffsetDateTime.now());
      byId.put(user.userId(), user);
      byEmail.put(user.email(), user);
      return user;
    }

    @Override
    public UserRecord updateProfile(UUID userId, String name, String email) {
      UserRecord existing = byId.get(userId);
      UserRecord updated =
          new UserRecord(userId, name, email, existing.passwordHash(), existing.createdAt());
      byEmail.remove(existing.email());
      byId.put(userId, updated);
      byEmail.put(email, updated);
      return updated;
    }

    @Override
    public UserRecord updatePassword(UUID userId, String passwordHash) {
      UserRecord existing = byId.get(userId);
      UserRecord updated =
          new UserRecord(
              userId, existing.name(), existing.email(), passwordHash, existing.createdAt());
      byId.put(userId, updated);
      byEmail.put(updated.email(), updated);
      return updated;
    }

    @Override
    public Optional<UserRecord> findByEmail(String email) {
      return Optional.ofNullable(byEmail.get(email));
    }

    @Override
    public Optional<UserRecord> findById(UUID userId) {
      return Optional.ofNullable(byId.get(userId));
    }
  }
}
