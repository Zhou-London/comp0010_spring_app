package uk.ac.ucl.comp0010.models;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Minimal user model for authenticating write operations.
 */
@Entity
@Table(name = "users")
public class UserAccount {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Schema(accessMode = Schema.AccessMode.READ_ONLY, description = "Auto-generated user ID")
  private Long id;

  @Column(unique = true, nullable = false)
  @Schema(description = "Unique username for login", example = "admin")
  private String username;

  @Column(nullable = false)
  private String passwordHash;

  @Column(unique = true)
  private String authToken;

  /**
   * Default constructor for JPA.
   */
  public UserAccount() {
  }

  /**
   * Create a new user account with hashed password and token.
   *
   * @param username unique username
   * @param passwordHash hashed password
   * @param authToken bearer token for API access
   */
  public UserAccount(String username, String passwordHash, String authToken) {
    this.username = username;
    this.passwordHash = passwordHash;
    this.authToken = authToken;
  }

  public Long getId() {
    return id;
  }

  public String getUsername() {
    return username;
  }

  public void setUsername(String username) {
    this.username = username;
  }

  public String getPasswordHash() {
    return passwordHash;
  }

  public void setPasswordHash(String passwordHash) {
    this.passwordHash = passwordHash;
  }

  public String getAuthToken() {
    return authToken;
  }

  public void setAuthToken(String authToken) {
    this.authToken = authToken;
  }
}
