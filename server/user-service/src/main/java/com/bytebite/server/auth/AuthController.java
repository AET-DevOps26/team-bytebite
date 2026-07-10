package com.bytebite.server.auth;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@Tag(name = "Authentication", description = "Registration, login, and current user endpoints")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/api/auth/register")
    @Operation(
            summary = "Register a new user",
            responses = {
                    @ApiResponse(responseCode = "200", description = "User registered and JWT issued"),
                    @ApiResponse(responseCode = "400", description = "Invalid registration data", content = @Content(schema = @Schema(implementation = Map.class))),
                    @ApiResponse(responseCode = "409", description = "Email address is already registered", content = @Content(schema = @Schema(implementation = Map.class)))
            }
    )
    public AuthResponse register(@RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/api/auth/login")
    @Operation(
            summary = "Log in",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Credentials accepted and JWT issued"),
                    @ApiResponse(responseCode = "401", description = "Invalid credentials", content = @Content(schema = @Schema(implementation = Map.class)))
            }
    )
    public AuthResponse login(@RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/api/users/me")
    @Operation(
            summary = "Get the current user",
            security = @SecurityRequirement(name = "bearerAuth"),
            responses = {
                    @ApiResponse(responseCode = "200", description = "Current authenticated user"),
                    @ApiResponse(responseCode = "401", description = "Missing, expired, or invalid JWT", content = @Content(schema = @Schema(implementation = Map.class)))
            }
    )
    public AuthResponse me(@Parameter(hidden = true) @RequestHeader(HttpHeaders.AUTHORIZATION) String authorization) {
        return authService.currentUser(authorization);
    }

    @PatchMapping("/api/users/me")
    @Operation(
            summary = "Update the current user's name and email",
            security = @SecurityRequirement(name = "bearerAuth"),
            responses = {
                    @ApiResponse(responseCode = "200", description = "Profile updated and a fresh JWT issued"),
                    @ApiResponse(responseCode = "400", description = "Invalid profile data", content = @Content(schema = @Schema(implementation = Map.class))),
                    @ApiResponse(responseCode = "401", description = "Missing, expired, or invalid JWT", content = @Content(schema = @Schema(implementation = Map.class))),
                    @ApiResponse(responseCode = "409", description = "Email address is already registered", content = @Content(schema = @Schema(implementation = Map.class)))
            }
    )
    public AuthResponse updateProfile(
            @Parameter(hidden = true) @RequestHeader(HttpHeaders.AUTHORIZATION) String authorization,
            @RequestBody UpdateProfileRequest request
    ) {
        return authService.updateProfile(authorization, request);
    }

    @PutMapping("/api/users/me/password")
    @Operation(
            summary = "Change the current user's password",
            security = @SecurityRequirement(name = "bearerAuth"),
            responses = {
                    @ApiResponse(responseCode = "204", description = "Password changed"),
                    @ApiResponse(responseCode = "400", description = "Invalid password data", content = @Content(schema = @Schema(implementation = Map.class))),
                    @ApiResponse(responseCode = "401", description = "Missing/invalid JWT or incorrect current password", content = @Content(schema = @Schema(implementation = Map.class)))
            }
    )
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void updatePassword(
            @Parameter(hidden = true) @RequestHeader(HttpHeaders.AUTHORIZATION) String authorization,
            @RequestBody UpdatePasswordRequest request
    ) {
        authService.updatePassword(authorization, request);
    }

    @org.springframework.web.bind.annotation.ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> handleStatus(ResponseStatusException exception) {
        HttpStatus status = HttpStatus.valueOf(exception.getStatusCode().value());
        return ResponseEntity.status(status).body(Map.of("message", exception.getReason()));
    }
}
