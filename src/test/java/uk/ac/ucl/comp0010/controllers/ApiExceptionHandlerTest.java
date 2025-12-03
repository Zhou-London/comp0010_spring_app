package uk.ac.ucl.comp0010.controllers;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import uk.ac.ucl.comp0010.exceptions.NoGradeAvailableException;
import uk.ac.ucl.comp0010.exceptions.ResourceConflictException;
import uk.ac.ucl.comp0010.exceptions.ResourceNotFoundException;

class ApiExceptionHandlerTest {

  private final ApiExceptionHandler handler = new ApiExceptionHandler();

  @Test
  void handlesNotFoundAndConflictAndBadRequest() {
    ResponseEntity<Map<String, String>> notFound = handler.handleResourceNotFound(
        new ResourceNotFoundException("missing"));
    assertThat(notFound.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);

    ResponseEntity<Map<String, String>> conflict = handler.handleResourceConflict(
        new ResourceConflictException("conflict"));
    assertThat(conflict.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);

    ResponseEntity<Map<String, String>> badRequest = handler.handleBadRequest(
        new NoGradeAvailableException("bad"));
    assertThat(badRequest.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
  }
}
