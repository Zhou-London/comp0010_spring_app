package uk.ac.ucl.comp0010.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Thrown when a requested registration does not exist.
 */
@ResponseStatus(HttpStatus.NOT_FOUND)
public class NoRegistrationException extends Exception {
  public NoRegistrationException(String message) {
    super(message);
  }
}
