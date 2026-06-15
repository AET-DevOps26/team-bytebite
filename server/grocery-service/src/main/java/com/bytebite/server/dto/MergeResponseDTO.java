package com.bytebite.server.dto;

import java.util.List;

/** Shape of the gen-ai {@code POST /api/ai/merge} response. */
public record MergeResponseDTO(List<IngredientDTO> ingredients) {}
