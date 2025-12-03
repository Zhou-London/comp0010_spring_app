package uk.ac.ucl.comp0010.services;

import java.util.Optional;
import java.util.UUID;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import uk.ac.ucl.comp0010.exceptions.ResourceConflictException;
import uk.ac.ucl.comp0010.exceptions.ResourceNotFoundException;
import uk.ac.ucl.comp0010.models.UserAccount;
import uk.ac.ucl.comp0010.repositories.UserAccountRepository;

/**
 * Service managing user registration and authentication tokens.
 */
@Service
public class UserService {

  private final UserAccountRepository userRepository;
  private final BCryptPasswordEncoder passwordEncoder;

  public UserService(UserAccountRepository userRepository, BCryptPasswordEncoder passwordEncoder) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
  }

  /**
   * Register a new user if the username is unused.
   *
   * @param username requested username
   * @param password raw password
   * @return created user with fresh token
   */
  public UserAccount register(String username, String password) {
    if (userRepository.findByUsername(username).isPresent()) {
      throw new ResourceConflictException("Username already exists");
    }

    String token = generateToken();
    UserAccount account = new UserAccount(username, passwordEncoder.encode(password), token);
    return userRepository.save(account);
  }

  /**
   * Authenticate a user and mint a new token.
   *
   * @param username username
   * @param password raw password
   * @return authenticated account with regenerated token
   */
  public UserAccount login(String username, String password) {
    UserAccount account = userRepository.findByUsername(username)
        .orElseThrow(() -> new ResourceNotFoundException("User not found"));

    if (!passwordEncoder.matches(password, account.getPasswordHash())) {
      throw new ResourceConflictException("Invalid credentials");
    }

    account.setAuthToken(generateToken());
    return userRepository.save(account);
  }

  /**
   * Validate bearer token.
   *
   * @param token bearer token string
   * @return optional matching user
   */
  public Optional<UserAccount> findByToken(String token) {
    return userRepository.findByAuthToken(token);
  }

  private String generateToken() {
    return UUID.randomUUID().toString();
  }
}
