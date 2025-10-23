package uk.ac.ucl.comp0010.controllers;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
import uk.ac.ucl.comp0010.exceptions.NoGradeAvailableException;
import uk.ac.ucl.comp0010.exceptions.NoRegistrationException;
import uk.ac.ucl.comp0010.models.Grade;
import uk.ac.ucl.comp0010.models.Registration;
import uk.ac.ucl.comp0010.models.Student;
import uk.ac.ucl.comp0010.services.StudentService;

/**
 * REST controller for student operations.
 */
@RestController
@RequestMapping("/students")
public class StudentController {
  private final StudentService studentService;

  public StudentController(StudentService studentService) {
    this.studentService = studentService;
  }

  @GetMapping
  public List<Student> getStudents() {
    return studentService.getAllStudents();
  }

  @GetMapping("/{id}")
  public Student getStudent(@PathVariable Long id) {
    return studentService.getStudent(id);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public Student createStudent(@RequestBody Student student) {
    return studentService.createStudent(student);
  }

  @PutMapping("/{id}")
  public Student updateStudent(@PathVariable Long id, @RequestBody Student student) {
    return studentService.updateStudent(id, student);
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteStudent(@PathVariable Long id) {
    studentService.deleteStudent(id);
  }

  @PostMapping("/{id}/modules/{moduleId}")
  public Registration registerStudent(@PathVariable Long id, @PathVariable Long moduleId) {
    return studentService.registerStudentToModule(id, moduleId);
  }

  @DeleteMapping("/{id}/modules/{moduleId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void unregisterStudent(@PathVariable Long id, @PathVariable Long moduleId)
      throws NoRegistrationException {
    studentService.unregisterStudentFromModule(id, moduleId);
  }

  @GetMapping("/{id}/registrations")
  public List<Registration> getRegistrations(@PathVariable Long id) {
    return studentService.getRegistrationsForStudent(id);
  }

  @GetMapping("/{id}/grades")
  public List<Grade> getGrades(@PathVariable Long id) {
    return studentService.getGradesForStudent(id);
  }

  @PostMapping("/{id}/grades")
  public Grade recordGrade(@PathVariable Long id, @RequestBody GradeRequest request)
      throws NoRegistrationException {
    return studentService.recordGrade(id, request.getModuleId(), request.getScore());
  }

  @GetMapping("/{id}/average")
  public Map<String, Double> getAverage(@PathVariable Long id) throws NoGradeAvailableException {
    double average = studentService.computeAverage(id);
    Map<String, Double> response = new HashMap<>();
    response.put("average", average);
    return response;
  }

  /**
   * Request payload for recording a grade.
   */
  public static class GradeRequest {
    private Long moduleId;
    private int score;

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
}
