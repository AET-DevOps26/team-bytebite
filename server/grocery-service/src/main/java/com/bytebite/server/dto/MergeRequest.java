package com.bytebite.server.dto;

import java.util.List;
import java.util.UUID;

// TODO: replace userId with extraction from the JWT forwarded by the api-gateway
public record MergeRequest(List<UUID> recipeIds, String name, UUID userId) {}
