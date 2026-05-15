package com.bytebite.server;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@RestController
public class GenerateController {

    private final RestTemplate genAiRestTemplate;

    public GenerateController(RestTemplate genAiRestTemplate) {
        this.genAiRestTemplate = genAiRestTemplate;
    }

    record IngredientDto(String name, String quantity, String unit) {}
    record GenerateRequest(String dish) {}
    record GenerateResponse(String dish, List<IngredientDto> ingredients) {}

    @PostMapping(value = "/generate",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    public GenerateResponse generate(@RequestBody GenerateRequest request) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, String>> entity = new HttpEntity<>(Map.of("dish", request.dish()), headers);
        return genAiRestTemplate.postForObject("/generate", entity, GenerateResponse.class);
    }
}
