package com.bytebite.server;

import com.bytebite.server.dto.GenerateRequest;
import com.bytebite.server.dto.ProviderAvailabilityDTO;
import com.bytebite.server.dto.RecipeResponseDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

@RestController
@Tag(name = "Recipes", description = "Recipe-to-grocery-list generation")
public class GenerateController {

  private final RestTemplate genAiRestTemplate;

  public GenerateController(RestTemplate genAiRestTemplate) {
    this.genAiRestTemplate = genAiRestTemplate;
  }

  @PostMapping(
      value = "/api/recipes/generate",
      consumes = MediaType.APPLICATION_JSON_VALUE,
      produces = MediaType.APPLICATION_JSON_VALUE)
  @Operation(
      summary = "Generate a grocery list from a dish or recipe",
      description =
          "Delegates to the Gen AI service and returns categorized ingredients with dietary restriction flags.",
      security = @SecurityRequirement(name = "bearerAuth"),
      responses = {
        @ApiResponse(responseCode = "200", description = "Generated grocery list"),
        @ApiResponse(
            responseCode = "401",
            description = "Missing, expired, or invalid JWT",
            content = @Content),
        @ApiResponse(
            responseCode = "422",
            description = "AI service returned no ingredients",
            content = @Content(schema = @Schema(implementation = Map.class))),
        @ApiResponse(
            responseCode = "502",
            description = "AI service rejected or failed the request",
            content = @Content(schema = @Schema(implementation = Map.class))),
        @ApiResponse(
            responseCode = "503",
            description = "AI service is unreachable",
            content = @Content(schema = @Schema(implementation = Map.class)))
      })
  public RecipeResponseDTO generate(@RequestBody GenerateRequest request) {
    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_JSON);
    Map<String, Object> body = new HashMap<>();
    body.put("dish", request.dish());
    body.put(
        "dietary_restrictions",
        request.dietaryRestrictions() != null ? request.dietaryRestrictions() : List.of());
    body.put("llm_provider", request.llmProvider() != null ? request.llmProvider() : "logos");
    HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

    RecipeResponseDTO response;
    try {
      response = genAiRestTemplate.postForObject("/api/ai/parse", entity, RecipeResponseDTO.class);
    } catch (HttpClientErrorException e) {
      throw new ResponseStatusException(
          HttpStatus.BAD_GATEWAY, "AI service rejected the request: " + e.getMessage());
    } catch (HttpServerErrorException e) {
      throw new ResponseStatusException(
          HttpStatus.BAD_GATEWAY, "AI service encountered an error: " + e.getMessage());
    } catch (ResourceAccessException e) {
      throw new ResponseStatusException(
          HttpStatus.SERVICE_UNAVAILABLE, "AI service is unreachable");
    }

    if (response == null || response.ingredients() == null || response.ingredients().isEmpty()) {
      throw new ResponseStatusException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          "AI service returned no ingredients for the given input");
    }

    return response;
  }

  @GetMapping(value = "/api/recipes/providers", produces = MediaType.APPLICATION_JSON_VALUE)
  @Operation(
      summary = "Check which LLM providers are available",
      description =
          "Reports whether the OpenAI provider is configured on the AI service, so the client can hide the option otherwise. Logos is always required and assumed available.")
  public ProviderAvailabilityDTO providers() {
    try {
      ResponseEntity<Map<String, Object>> health =
          genAiRestTemplate.exchange(
              "/health",
              HttpMethod.GET,
              null,
              new ParameterizedTypeReference<Map<String, Object>>() {});
      Map<String, Object> body = health.getBody();
      Object openaiAvailable = body != null ? body.get("openai_available") : null;
      return new ProviderAvailabilityDTO(Boolean.TRUE.equals(openaiAvailable));
    } catch (RestClientException e) {
      return new ProviderAvailabilityDTO(false);
    }
  }
}
