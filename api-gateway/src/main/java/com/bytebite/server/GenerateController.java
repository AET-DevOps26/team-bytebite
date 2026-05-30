package com.bytebite.server;

import com.bytebite.server.dto.GenerateRequest;
import com.bytebite.server.dto.RecipeResponseDTO;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.DefaultUriBuilderFactory;

import java.util.Map;

@RestController
public class GenerateController {

    private final RestTemplate groceryServiceRestTemplate;

    public GenerateController(@Value("${GROCERY_SERVICE_BASE_URL:${grocery-service.base-url}}") String groceryServiceBaseUrl) {
        this.groceryServiceRestTemplate = new RestTemplate();
        this.groceryServiceRestTemplate.setUriTemplateHandler(new DefaultUriBuilderFactory(groceryServiceBaseUrl));
    }

    @PostMapping(value = "/api/recipes/generate",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    public RecipeResponseDTO generate(@RequestBody GenerateRequest request) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, String>> entity = new HttpEntity<>(Map.of("dish", request.dish()), headers);

        RecipeResponseDTO response;
        try {
            response = groceryServiceRestTemplate.postForObject("/api/recipes/generate", entity, RecipeResponseDTO.class);
        } catch (HttpClientErrorException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Grocery service rejected the request: " + e.getMessage());
        } catch (HttpServerErrorException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Grocery service encountered an error: " + e.getMessage());
        } catch (ResourceAccessException e) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Grocery service is unreachable");
        }

        if (response == null || response.ingredients() == null || response.ingredients().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "Grocery service returned no ingredients for the given input");
        }

        return response;
    }
}
