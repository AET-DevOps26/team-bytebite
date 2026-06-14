package com.bytebite.server.dto;

import java.time.Instant;
import java.util.UUID;

public record GroceryListSummaryDTO(UUID groceryListId, String name, Instant createdAt,
                                    long itemCount, long purchasedCount) {}