package uk.ac.ucl.comp0010.controllers;

import io.swagger.v3.oas.annotations.Operation;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import uk.ac.ucl.comp0010.controllers.requests.AuthRequest;
import uk.ac.ucl.comp0010.controllers.responses.AuthResponse;
import uk.ac.ucl.comp0010.models.UserAccount;
import uk.ac.ucl.comp0010.services.UserService;

/**
 * Endpoints for registering and logging in users.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

  private final UserService userService;

  public AuthController(UserService userService) {
    this.userService = userService;
  }

  /**
   * Register a user with username and password.
   *
   * @param request auth payload
   * @return issued token and username
   */
  @Operation(summary = "Register a new user")
  @PostMapping("/register")
  @ResponseStatus(HttpStatus.CREATED)
  public AuthResponse register(@RequestBody AuthRequest request) {
    UserAccount account = userService.register(request.getUsername(), request.getPassword());
    return new AuthResponse(account.getUsername(), account.getAuthToken());
  }

  /**
   * Log in an existing user.
   *
   * @param request auth payload
   * @return issued token and username
   */
  @Operation(summary = "Log in an existing user")
  @PostMapping("/login")
  public AuthResponse login(@RequestBody AuthRequest request) {
    UserAccount account = userService.login(request.getUsername(), request.getPassword());
    return new AuthResponse(account.getUsername(), account.getAuthToken());
  }

  /**
   * Validate a bearer token and return the associated account.
   *
   * @param authHeader Authorization header containing the token
   * @return authenticated user details
   */
  @Operation(summary = "Validate an existing token")
  @GetMapping("/me")
  public AuthResponse me(@RequestHeader(value = "Authorization", required = false)
      String authHeader) {
    String token = authHeader != null ? authHeader.replace("Bearer ", "").trim() : "";
    return userService.findByToken(token)
        .map(account -> new AuthResponse(account.getUsername(), account.getAuthToken()))
        .orElseThrow(() -> new uk.ac.ucl.comp0010.exceptions.ResourceNotFoundException(
            "User not found"));
  }
}
