package uk.ac.ucl.comp0010.controllers;

import java.util.HashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import uk.ac.ucl.comp0010.exceptions.NoGradeAvailableException;
import uk.ac.ucl.comp0010.exceptions.NoRegistrationException;
import uk.ac.ucl.comp0010.exceptions.ResourceConflictException;
import uk.ac.ucl.comp0010.exceptions.ResourceNotFoundException;

/**
 * Centralised handler for translating exceptions into API error responses.
 */
@RestControllerAdvice
public class ApiExceptionHandler {

  @ExceptionHandler(ResourceNotFoundException.class)
  public ResponseEntity<Map<String, String>> handleResourceNotFound(
      ResourceNotFoundException ex) {
    return buildResponse(HttpStatus.NOT_FOUND, ex);
  }

  @ExceptionHandler(ResourceConflictException.class)
  public ResponseEntity<Map<String, String>> handleResourceConflict(
      ResourceConflictException ex) {
    return buildResponse(HttpStatus.CONFLICT, ex);
  }

  @ExceptionHandler({NoRegistrationException.class, NoGradeAvailableException.class})
  public ResponseEntity<Map<String, String>> handleBadRequest(Exception ex) {
    return buildResponse(HttpStatus.BAD_REQUEST, ex);
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<Map<String, String>> handleGeneric(Exception ex) {
    return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, ex);
  }

  private ResponseEntity<Map<String, String>> buildResponse(HttpStatus status, Exception ex) {
    Map<String, String> body = new HashMap<>();
    body.put("error", ex.getMessage());
    return ResponseEntity.status(status).body(body);
  }
}
