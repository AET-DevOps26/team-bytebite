package com.bytebite.server;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Tag(name = "Health", description = "Service health checks")
public class HealthController {

  @GetMapping("/health")
  @Operation(summary = "Check grocery-service health")
  public Map<String, String> health() {
    return Map.of("status", "ok");
  }
}
