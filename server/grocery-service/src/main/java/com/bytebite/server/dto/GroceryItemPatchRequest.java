package com.bytebite.server.dto;

/** Partial update for a single grocery item — currently only the purchased flag. */
public record GroceryItemPatchRequest(Boolean purchased) {}
