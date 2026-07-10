package com.bytebite.server.auth;

public record AuthResponse(String token, UserResponse user) {}
