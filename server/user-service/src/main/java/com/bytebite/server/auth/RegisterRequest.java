package com.bytebite.server.auth;

public record RegisterRequest(String name, String email, String password) {}
