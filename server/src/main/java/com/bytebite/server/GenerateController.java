package com.bytebite.server;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClient;

import java.util.List;

@RestController
public class GenerateController {

    private final RestClient genAiRestClient;

    public GenerateController(RestClient genAiRestClient) {
        this.genAiRestClient = genAiRestClient;
    }

    record IngredientDto(String name, String quantity, String unit) {}
    record GenerateRequest(String dish) {}
    record GenerateResponse(String dish, List<IngredientDto> ingredients) {}

    @PostMapping(value = "/generate",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    public GenerateResponse generate(@RequestBody GenerateRequest request) {
        return genAiRestClient.post()
                .uri("/generate")
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .retrieve()
                .body(GenerateResponse.class);
    }
}
