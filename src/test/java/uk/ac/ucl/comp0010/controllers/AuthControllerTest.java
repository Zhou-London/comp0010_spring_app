package uk.ac.ucl.comp0010.controllers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import uk.ac.ucl.comp0010.controllers.responses.AuthResponse;
import uk.ac.ucl.comp0010.exceptions.ResourceNotFoundException;
import uk.ac.ucl.comp0010.models.UserAccount;
import uk.ac.ucl.comp0010.services.UserService;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

  @Mock
  private UserService userService;

  private AuthController authController;

  @BeforeEach
  void setUp() {
    authController = new AuthController(userService);
  }

  @Test
  void meReturnsUserWhenTokenPresent() {
    UserAccount account = new UserAccount("agent", "secret", "token");
    when(userService.findByToken("token")).thenReturn(Optional.of(account));

    AuthResponse response = authController.me("Bearer token");

    assertThat(response.getUsername()).isEqualTo("agent");
    assertThat(response.getToken()).isEqualTo(account.getAuthToken());
  }

  @Test
  void meThrowsWhenHeaderMissingOrInvalid() {
    when(userService.findByToken("")).thenReturn(Optional.empty());

    assertThatThrownBy(() -> authController.me(null))
        .isInstanceOf(ResourceNotFoundException.class);
  }
}
