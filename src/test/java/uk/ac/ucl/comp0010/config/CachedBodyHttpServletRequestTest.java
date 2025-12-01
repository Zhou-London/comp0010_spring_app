package uk.ac.ucl.comp0010.config;

import static org.assertj.core.api.Assertions.assertThat;

import jakarta.servlet.ServletInputStream;
import java.io.BufferedReader;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

/**
 * Tests for {@link CachedBodyHttpServletRequest} ensuring the request body can be consumed safely
 * multiple times.
 */
class CachedBodyHttpServletRequestTest {

  @Test
  void wrapsRequestAndCachesBodyForMultipleReads() throws IOException {
    MockHttpServletRequest original = new MockHttpServletRequest();
    original.setContent("cached-body".getBytes(StandardCharsets.UTF_8));

    CachedBodyHttpServletRequest wrapped = new CachedBodyHttpServletRequest(original);

    try (BufferedReader reader = wrapped.getReader()) {
      assertThat(reader.readLine()).isEqualTo("cached-body");
    }

    try (BufferedReader reader = wrapped.getReader()) {
      assertThat(reader.readLine()).isEqualTo("cached-body");
    }

    ServletInputStream inputStream = wrapped.getInputStream();
    assertThat(inputStream.isReady()).isTrue();
    assertThat(inputStream.read()).isEqualTo('c');
    assertThat(inputStream.isFinished()).isFalse();
  }
}

