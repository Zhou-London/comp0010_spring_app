package uk.ac.ucl.comp0010.exceptions;

/**
 * Thrown by Student class.
 */
public class NoGradeAvailableException extends Exception {
  public NoGradeAvailableException(String message) {
    super(message);
  }
}
