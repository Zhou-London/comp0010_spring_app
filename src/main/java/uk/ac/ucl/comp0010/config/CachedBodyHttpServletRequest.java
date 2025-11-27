package uk.ac.ucl.comp0010.config;

import jakarta.servlet.ReadListener;
import jakarta.servlet.ServletInputStream;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import org.springframework.util.StreamUtils;

/**
 * Wrapper to cache the body of an HttpServletRequest so it can be read multiple times.
 */
public class CachedBodyHttpServletRequest extends HttpServletRequestWrapper {
  private final byte[] cachedBody;

  public CachedBodyHttpServletRequest(HttpServletRequest request) throws IOException {
    super(request);
    this.cachedBody = StreamUtils.copyToByteArray(request.getInputStream());
  }

  @Override
  public ServletInputStream getInputStream() {
    return new CachedServletInputStream(this.cachedBody);
  }

  @Override
  public BufferedReader getReader() {
    return new BufferedReader(new InputStreamReader(getInputStream(), StandardCharsets.UTF_8));
  }

  private static class CachedServletInputStream extends ServletInputStream {
    private final ByteArrayInputStream inputStream;

    CachedServletInputStream(byte[] cachedBody) {
      this.inputStream = new ByteArrayInputStream(cachedBody);
    }

    @Override
    public boolean isFinished() {
      return inputStream.available() == 0;
    }

    @Override
    public boolean isReady() {
      return true;
    }

    @Override
    public void setReadListener(ReadListener readListener) {
      // No-op. As the full body is already cached, we do not need to support async reads.
    }

    @Override
    public int read() {
      return inputStream.read();
    }
  }
}
