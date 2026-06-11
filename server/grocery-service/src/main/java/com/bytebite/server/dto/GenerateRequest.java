package com.bytebite.server.dto;

import java.util.List;

public record GenerateRequest(String dish, List<String> dietaryRestrictions) {}
