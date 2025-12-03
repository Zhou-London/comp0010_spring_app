package uk.ac.ucl.comp0010.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import uk.ac.ucl.comp0010.services.UserService;

/**
 * Filter that enforces bearer tokens on non-GET requests.
 */
@Component
public class AuthTokenFilter extends OncePerRequestFilter {

  private final UserService userService;

  public AuthTokenFilter(UserService userService) {
    this.userService = userService;
  }

  @SuppressWarnings("null")
  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
      FilterChain filterChain) throws ServletException, IOException {

    boolean safeMethod = HttpMethod.GET.matches(request.getMethod())
        || HttpMethod.OPTIONS.matches(request.getMethod());
    boolean authPath = request.getRequestURI().startsWith("/api/auth");
    if (safeMethod || authPath) {
      filterChain.doFilter(request, response);
      return;
    }

    String header = request.getHeader("Authorization");
    String token = (header != null && header.startsWith("Bearer ")) ? header.substring(7) : null;

    var account = userService.findByToken(token).orElse(null);
    if (!StringUtils.hasText(token) || account == null) {
      respondUnauthorized(response);
      return;
    }

    UsernamePasswordAuthenticationToken authentication =
        UsernamePasswordAuthenticationToken.authenticated(account.getUsername(), null,
            java.util.List.of());
    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
    SecurityContextHolder.getContext().setAuthentication(authentication);
    filterChain.doFilter(request, response);
  }

  private void respondUnauthorized(HttpServletResponse response) throws IOException {
    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
    response.setCharacterEncoding(StandardCharsets.UTF_8.name());
    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
    response.getWriter().write("{\"error\":\"Unauthorized\"}");
  }
}
