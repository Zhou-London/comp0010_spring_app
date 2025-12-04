package uk.ac.ucl.comp0010.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class RequestLoggingInterceptorTest {

  private RequestLoggingInterceptor interceptor;
  private ListAppender<ILoggingEvent> listAppender;

  @BeforeEach
  void setUp() {
    interceptor = new RequestLoggingInterceptor();
    Logger logger = (Logger) LoggerFactory.getLogger(RequestLoggingInterceptor.class);
    listAppender = new ListAppender<>();
    listAppender.start();
    logger.addAppender(listAppender);
  }

  @AfterEach
  void tearDown() {
    Logger logger = (Logger) LoggerFactory.getLogger(RequestLoggingInterceptor.class);
    logger.detachAppender(listAppender);
  }

  @Test
  void shouldLogRequestDetails() throws Exception {
    MockHttpServletRequest request = new MockHttpServletRequest();
    request.setMethod("GET");

    MockHttpServletResponse response = new MockHttpServletResponse();
    response.setStatus(HttpServletResponse.SC_OK);

    interceptor.preHandle(request, response, new Object());
    interceptor.afterCompletion(request, response, new Object(), null);

    assertFalse(listAppender.list.isEmpty());
    ILoggingEvent loggingEvent = listAppender.list.get(0);

    assertEquals(Level.INFO, loggingEvent.getLevel());
    assertTrue(loggingEvent.getFormattedMessage().contains("Handled GET request in"));
    assertTrue(loggingEvent.getFormattedMessage().contains("status 200"));
  }
}
