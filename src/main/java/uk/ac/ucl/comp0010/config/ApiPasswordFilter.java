package uk.ac.ucl.comp0010.config;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Filter that enforces a shared password on all non-GET API requests.
 */
@Component
public class ApiPasswordFilter extends OncePerRequestFilter {
  private static final String PASSWORD_FIELD = "password";
  private final String apiPassword;
  private final ObjectMapper objectMapper;

  /**
   * CTR for the pass filter.
   *
   * @param apiPassword Authentication password.
   * @param objectMapper Object Mapper
   */
  public ApiPasswordFilter(@Value("${app.api.password}") String apiPassword,
      ObjectMapper objectMapper) {
    this.apiPassword = apiPassword;
    this.objectMapper = objectMapper;
  }

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
      FilterChain filterChain) throws ServletException, IOException {
    if ("GET".equalsIgnoreCase(request.getMethod())
        || "OPTIONS".equalsIgnoreCase(request.getMethod())) {
      filterChain.doFilter(request, response);
      return;
    }

    CachedBodyHttpServletRequest cachedRequest = new CachedBodyHttpServletRequest(request);
    String body =
        cachedRequest.getReader().lines().collect(Collectors.joining(System.lineSeparator()));

    if (!StringUtils.hasText(body)) {
      respondUnauthorized(response);
      return;
    }

    try {
      JsonNode root = objectMapper.readTree(body);
      JsonNode passwordNode = root.get(PASSWORD_FIELD);
      if (passwordNode == null || !passwordNode.isTextual()
          || !passwordNode.asText().equals(apiPassword)) {
        respondUnauthorized(response);
        return;
      }
    } catch (IOException ex) {
      respondUnauthorized(response);
      return;
    }

    filterChain.doFilter(cachedRequest, response);
  }

  private void respondUnauthorized(HttpServletResponse response) throws IOException {
    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
    response.setCharacterEncoding(StandardCharsets.UTF_8.name());
    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
    response.getWriter().write("{\"error\":\"Invalid password\"}");
  }
}
