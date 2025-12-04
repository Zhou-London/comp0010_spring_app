package uk.ac.ucl.comp0010.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Interceptor for logging each HTTP request handled by the application.
 */
@Component
public class RequestLoggingInterceptor implements HandlerInterceptor {

  private static final Logger LOGGER = LoggerFactory.getLogger(RequestLoggingInterceptor.class);
  private static final String START_TIME_ATTRIBUTE = "requestStartTime";

  @SuppressWarnings("null")
  @Override
  public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
      throws Exception {
    request.setAttribute(START_TIME_ATTRIBUTE, System.currentTimeMillis());
    return true;
  }

  @SuppressWarnings("null")
  @Override
  public void afterCompletion(
      HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex)
      throws Exception {
    Object startTimeAttribute = request.getAttribute(START_TIME_ATTRIBUTE);
    if (startTimeAttribute instanceof Long startTime) {
      long duration = System.currentTimeMillis() - startTime;
      LOGGER.info(
          "Handled {} request in {} ms with status {}",
          request.getMethod(),
          duration,
          response.getStatus());
    }
  }
}
