package com.bytebite.server.auth;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final JwtTokenService jwtTokenService;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder(12);

    public AuthService(UserRepository userRepository, JwtTokenService jwtTokenService) {
        this.userRepository = userRepository;
        this.jwtTokenService = jwtTokenService;
    }

    public AuthResponse register(RegisterRequest request) {
        String name = normalizeRequired(request.name(), "Name");
        String email = normalizeEmail(request.email());
        String password = requirePassword(request.password());

        userRepository.findByEmail(email).ifPresent(user -> {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already registered.");
        });

        UserRecord user = userRepository.create(name, email, passwordEncoder.encode(password));
        return responseFor(user);
    }

    public AuthResponse login(LoginRequest request) {
        String email = normalizeEmail(request.email());
        String password = normalizeRequired(request.password(), "Password");
        UserRecord user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password."));

        if (!passwordEncoder.matches(password, user.passwordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password.");
        }

        return responseFor(user);
    }

    public AuthResponse currentUser(String authorizationHeader) {
        JwtTokenService.JwtUser jwtUser = jwtTokenService.verify(authorizationHeader);
        UserRecord user = userRepository.findById(jwtUser.userId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User no longer exists."));
        return responseFor(user);
    }

    private AuthResponse responseFor(UserRecord user) {
        UserResponse userResponse = UserResponse.from(user);
        return new AuthResponse(jwtTokenService.createToken(userResponse), userResponse);
    }

    private String normalizeEmail(String value) {
        String email = normalizeRequired(value, "Email").toLowerCase();
        if (!email.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is not valid.");
        }
        return email;
    }

    private String requirePassword(String value) {
        String password = normalizeRequired(value, "Password");
        if (password.length() < 8) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must be at least 8 characters.");
        }
        return password;
    }

    private String normalizeRequired(String value, String label) {
        if (value == null || value.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, label + " is required.");
        }
        return value.trim();
    }
}
