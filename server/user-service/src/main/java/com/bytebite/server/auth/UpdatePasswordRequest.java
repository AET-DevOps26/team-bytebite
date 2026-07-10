package com.bytebite.server.auth;

public record UpdatePasswordRequest(String currentPassword, String newPassword) {}
