package uk.ac.ucl.comp0010.config;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.util.StreamUtils;

/**
 * Unit tests for {@link ApiPasswordFilter} covering all validation branches.
 */
class ApiPasswordFilterTest {

  private static final String PASSWORD = "secret";

  private ApiPasswordFilter filter;
  private ObjectMapper objectMapper;

  @BeforeEach
  void setUp() {
    objectMapper = new ObjectMapper();
    filter = new ApiPasswordFilter(PASSWORD, objectMapper);
  }

  @Test
  void allowsGetRequestsToPassThrough() throws ServletException, IOException {
    MockHttpServletRequest request = new MockHttpServletRequest("GET", "/students");
    MockHttpServletResponse response = new MockHttpServletResponse();

    TrackingFilterChain chain = new TrackingFilterChain();
    filter.doFilter(request, response, chain);

    assertThat(chain.wasInvoked()).isTrue();
    assertThat(response.getStatus()).isEqualTo(200);
  }

  @Test
  void rejectsMissingPasswordPayload() throws ServletException, IOException {
    MockHttpServletRequest request = new MockHttpServletRequest("POST", "/students");
    request.setContent(new byte[0]);
    MockHttpServletResponse response = new MockHttpServletResponse();

    filter.doFilter(request, response, new TrackingFilterChain());

    assertThat(response.getStatus()).isEqualTo(401);
    assertThat(response.getContentAsString()).contains("Invalid password");
    assertThat(response.getCharacterEncoding()).isEqualTo(StandardCharsets.UTF_8.name());
  }

  @Test
  void rejectsInvalidPasswordValue() throws ServletException, IOException {
    MockHttpServletRequest request = new MockHttpServletRequest("POST", "/students");
    request.setContent("{\"password\":\"wrong\"}".getBytes(StandardCharsets.UTF_8));
    MockHttpServletResponse response = new MockHttpServletResponse();

    filter.doFilter(request, response, new TrackingFilterChain());

    assertThat(response.getStatus()).isEqualTo(401);
    assertThat(response.getContentAsString()).contains("Invalid password");
  }

  @Test
  void passesThroughWhenPasswordValidAndBodyCached() throws ServletException, IOException {
    MockHttpServletRequest request = new MockHttpServletRequest("POST", "/students");
    request.setContent(("{\"password\":\"" + PASSWORD + "\",\"name\":\"Test\"}")
        .getBytes(StandardCharsets.UTF_8));
    MockHttpServletResponse response = new MockHttpServletResponse();

    TrackingFilterChain chain = new TrackingFilterChain();
    filter.doFilter(request, response, chain);

    assertThat(chain.wasInvoked()).isTrue();
    assertThat(chain.getRequestBody()).contains("Test");
    assertThat(chain.getRequestBodyReadTwice()).isTrue();
    assertThat(response.getStatus()).isEqualTo(200);
  }

  /**
   * Captures whether the filter chain executed and validates the cached request body can be read
   * multiple times.
   */
  private static class TrackingFilterChain implements FilterChain {

    private boolean invoked;
    private String requestBody = "";
    private boolean requestBodyReadTwice;

    @Override
    public void doFilter(ServletRequest request, ServletResponse response)
        throws IOException, ServletException {
      invoked = true;

      String firstRead = StreamUtils.copyToString(request.getInputStream(),
          StandardCharsets.UTF_8);
      String secondRead = StreamUtils.copyToString(request.getInputStream(),
          StandardCharsets.UTF_8);

      requestBody = firstRead;
      requestBodyReadTwice = firstRead.equals(secondRead);
    }

    boolean wasInvoked() {
      return invoked;
    }

    String getRequestBody() {
      return requestBody;
    }

    boolean getRequestBodyReadTwice() {
      return requestBodyReadTwice;
    }
  }
}

