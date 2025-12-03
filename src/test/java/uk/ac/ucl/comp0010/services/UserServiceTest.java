package uk.ac.ucl.comp0010.services;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import uk.ac.ucl.comp0010.exceptions.ResourceConflictException;
import uk.ac.ucl.comp0010.exceptions.ResourceNotFoundException;
import uk.ac.ucl.comp0010.models.UserAccount;
import uk.ac.ucl.comp0010.repositories.UserAccountRepository;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

  @Mock
  private UserAccountRepository userRepository;

  @Mock
  private BCryptPasswordEncoder passwordEncoder;

  private UserService userService;

  @BeforeEach
  void setUp() {
    userService = new UserService(userRepository, passwordEncoder);
  }

  @Test
  void registerRejectsDuplicateUsernames() {
    when(userRepository.findByUsername("ada")).thenReturn(Optional.of(new UserAccount()));

    assertThatThrownBy(() -> userService.register("ada", "secret"))
        .isInstanceOf(ResourceConflictException.class);
  }

  @Test
  void registerSavesNewUser() {
    UserAccount account = new UserAccount("ada", "hashed", "token");
    when(userRepository.findByUsername("ada")).thenReturn(Optional.empty());
    when(passwordEncoder.encode("secret")).thenReturn("hashed");
    when(userRepository.save(any(UserAccount.class))).thenReturn(account);

    UserAccount created = userService.register("ada", "secret");

    assertThat(created).isEqualTo(account);
    verify(userRepository).save(any(UserAccount.class));
  }

  @Test
  void loginThrowsWhenUserMissingOrPasswordIncorrect() {
    when(userRepository.findByUsername("ada")).thenReturn(Optional.empty());
    assertThatThrownBy(() -> userService.login("ada", "secret"))
        .isInstanceOf(ResourceNotFoundException.class);

    UserAccount account = new UserAccount("ada", "hashed", "token");
    when(userRepository.findByUsername("ada")).thenReturn(Optional.of(account));
    when(passwordEncoder.matches("bad", "hashed")).thenReturn(false);

    assertThatThrownBy(() -> userService.login("ada", "bad"))
        .isInstanceOf(ResourceConflictException.class);
  }

  @Test
  void loginRegeneratesToken() {
    UserAccount account = new UserAccount("ada", "hashed", "token");
    when(userRepository.findByUsername("ada")).thenReturn(Optional.of(account));
    when(passwordEncoder.matches("secret", "hashed")).thenReturn(true);
    when(userRepository.save(any(UserAccount.class))).thenReturn(account);

    UserAccount loggedIn = userService.login("ada", "secret");

    assertThat(loggedIn.getAuthToken()).isNotEqualTo("token");
    verify(userRepository).save(account);
  }

  @Test
  void findByTokenDelegatesToRepository() {
    when(userRepository.findByAuthToken("token")).thenReturn(Optional.empty());

    assertThat(userService.findByToken("token")).isEmpty();
    verify(userRepository).findByAuthToken("token");
  }
}
