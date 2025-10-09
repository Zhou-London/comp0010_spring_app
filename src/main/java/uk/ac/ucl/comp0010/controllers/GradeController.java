package uk.ac.ucl.comp0010.controllers;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import uk.ac.ucl.comp0010.models.Grade;

/**
 * Controller for Grade.
 */
@RestController
public class GradeController {

  /**
   * GET for "/grade" to get a Grade JSON.
   *
   * @return Return a Grade JSON.
   */
  @GetMapping("/grade")
  public Grade getGrade() {
    return new Grade(50);
  }
}
