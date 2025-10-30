package uk.ac.ucl.comp0010.controllers;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import uk.ac.ucl.comp0010.exceptions.NoRegistrationException;
import uk.ac.ucl.comp0010.models.Grade;
import uk.ac.ucl.comp0010.services.GradeService;

/**
 * Controller for Grade.
 */
@RestController
@RequestMapping("/grades")
public class GradeController {
  private final GradeService gradeService;

  public GradeController(GradeService gradeService) {
    this.gradeService = gradeService;
  }

  @GetMapping
  public List<Grade> getGrades() {
    return gradeService.getAllGrades();
  }

  @GetMapping("/{id}")
  public Grade getGrade(@PathVariable Long id) {
    return gradeService.getGrade(id);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public Grade createGrade(@RequestBody GradeRequest request) throws NoRegistrationException {
    return gradeService.createGrade(request.getStudentId(), request.getModuleId(), request.getScore());
  }

  @PutMapping("/{id}")
  public Grade updateGrade(@PathVariable Long id, @RequestBody GradeUpdateRequest request) {
    return gradeService.updateGrade(id, request.getScore());
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteGrade(@PathVariable Long id) {
    gradeService.deleteGrade(id);
  }

  @PostMapping("/upsert")
  public Grade upsertGrade(@RequestBody GradeRequest request) throws NoRegistrationException {
    return gradeService.upsertGrade(request.getStudentId(), request.getModuleId(), request.getScore());
  }

  /**
   * Request payload for creating or upserting a grade.
   */
  public static class GradeRequest {
    private Long studentId;
    private Long moduleId;
    private int score;

    public Long getStudentId() {
      return studentId;
    }

    public void setStudentId(Long studentId) {
      this.studentId = studentId;
    }

    public Long getModuleId() {
      return moduleId;
    }

    public void setModuleId(Long moduleId) {
      this.moduleId = moduleId;
    }

    public int getScore() {
      return score;
    }

    public void setScore(int score) {
      this.score = score;
    }
  }

  /**
   * Request payload for updating a grade.
   */
  public static class GradeUpdateRequest {
    private int score;

    public int getScore() {
      return score;
    }

    public void setScore(int score) {
      this.score = score;
    }
  }
}
