package com.bytebite.server;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.junit.jupiter.api.Test;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

class JwtAuthenticationFilterTest {
  private static final String SECRET = "test-secret-with-at-least-32-chars";
  private final JwtAuthenticationFilter filter = new JwtAuthenticationFilter(SECRET);

  @Test
  void publicAuthRoutesBypassJwtValidation() {
    MockServerWebExchange exchange =
        MockServerWebExchange.from(MockServerHttpRequest.post("/api/auth/login").build());
    CapturingChain chain = new CapturingChain();

    filter.filter(exchange, chain).block();

    assertThat(chain.exchange()).isSameAs(exchange);
    assertThat(exchange.getResponse().getStatusCode()).isNull();
  }

  @Test
  void protectedApiRejectsMissingBearerToken() {
    MockServerWebExchange exchange =
        MockServerWebExchange.from(MockServerHttpRequest.get("/api/grocery-list").build());

    filter.filter(exchange, new CapturingChain()).block();

    assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
  }

  @Test
  void protectedApiInjectsUserHeadersFromValidJwtAndOverwritesClientValues() {
    UUID userId = UUID.randomUUID();
    MockServerWebExchange exchange =
        MockServerWebExchange.from(
            MockServerHttpRequest.get("/api/grocery-list")
                .header(
                    HttpHeaders.AUTHORIZATION, "Bearer " + token(userId, "ada@example.com", 3600))
                .header("X-User-Id", "attacker")
                .build());
    CapturingChain chain = new CapturingChain();

    filter.filter(exchange, chain).block();

    assertThat(chain.exchange().getRequest().getHeaders().getFirst("X-User-Id"))
        .isEqualTo(userId.toString());
    assertThat(chain.exchange().getRequest().getHeaders().getFirst("X-User-Email"))
        .isEqualTo("ada@example.com");
  }

  @Test
  void expiredJwtIsRejected() {
    MockServerWebExchange exchange =
        MockServerWebExchange.from(
            MockServerHttpRequest.get("/api/grocery-list")
                .header(
                    HttpHeaders.AUTHORIZATION,
                    "Bearer " + token(UUID.randomUUID(), "ada@example.com", -1))
                .build());

    filter.filter(exchange, new CapturingChain()).block();

    assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
  }

  private static String token(UUID userId, String email, long expiresInSeconds) {
    long now = Instant.now().getEpochSecond();
    String header = "{\"alg\":\"HS256\",\"typ\":\"JWT\"}";
    String payload =
        "{\"sub\":\""
            + userId
            + "\",\"email\":\""
            + email
            + "\",\"exp\":"
            + (now + expiresInSeconds)
            + "}";
    String unsigned = encode(header) + "." + encode(payload);
    return unsigned + "." + sign(unsigned);
  }

  private static String encode(String value) {
    return Base64.getUrlEncoder()
        .withoutPadding()
        .encodeToString(value.getBytes(StandardCharsets.UTF_8));
  }

  private static String sign(String value) {
    try {
      Mac mac = Mac.getInstance("HmacSHA256");
      mac.init(new SecretKeySpec(SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
      return Base64.getUrlEncoder()
          .withoutPadding()
          .encodeToString(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
    } catch (Exception exception) {
      throw new IllegalStateException(exception);
    }
  }

  private static final class CapturingChain implements GatewayFilterChain {
    private final AtomicReference<ServerWebExchange> exchange = new AtomicReference<>();

    @Override
    public Mono<Void> filter(ServerWebExchange exchange) {
      this.exchange.set(exchange);
      return Mono.empty();
    }

    private ServerWebExchange exchange() {
      return exchange.get();
    }
  }
}
