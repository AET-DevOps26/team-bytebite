package com.bytebite.server.dto;

import java.util.List;
import java.util.UUID;

/** Payload for merging several saved recipes into a new grocery list. */
public record MergeListRequest(List<UUID> recipeIds, String llmProvider) {}
