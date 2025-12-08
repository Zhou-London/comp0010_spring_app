package uk.ac.ucl.comp0010.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import uk.ac.ucl.comp0010.models.UserAccount;
import uk.ac.ucl.comp0010.services.UserService;

@ExtendWith(MockitoExtension.class)
class AuthTokenFilterTest {

  @Mock
  private UserService userService;

  @Mock
  private FilterChain filterChain;

  private AuthTokenFilter filter;

  @BeforeEach
  void setUp() {
    filter = new AuthTokenFilter(userService);
    SecurityContextHolder.clearContext();
  }

  @AfterEach
  void tearDown() {
    SecurityContextHolder.clearContext();
  }

  @Test
  void permitsSafeMethodsWithoutAuth() throws Exception {
    MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/students");
    MockHttpServletResponse response = new MockHttpServletResponse();

    filter.doFilterInternal(request, response, filterChain);

    verify(filterChain).doFilter(request, response);
  }

  @Test
  void permitsAuthPathWithoutToken() throws Exception {
    MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/login");
    MockHttpServletResponse response = new MockHttpServletResponse();

    filter.doFilterInternal(request, response, filterChain);

    verify(filterChain).doFilter(request, response);
  }

  @Test
  void rejectsWhenTokenMissingOrInvalid() throws Exception {
    MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/students");
    MockHttpServletResponse response = new MockHttpServletResponse();

    filter.doFilterInternal(request, response, filterChain);

    assertThat(response.getStatus()).isEqualTo(HttpServletResponse.SC_UNAUTHORIZED);
    verify(filterChain, never()).doFilter(request, response);
  }

  @Test
  void authenticatesWhenTokenValid() throws Exception {
    MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/students");
    request.addHeader("Authorization", "Bearer token123");
    MockHttpServletResponse response = new MockHttpServletResponse();

    when(userService.findByToken("token123"))
        .thenReturn(Optional.of(new UserAccount("bond", "license", "token123")));

    filter.doFilterInternal(request, response, filterChain);

    verify(filterChain, times(1)).doFilter(request, response);
    assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();
    assertThat(SecurityContextHolder.getContext().getAuthentication().getName()).isEqualTo("bond");
  }
}
