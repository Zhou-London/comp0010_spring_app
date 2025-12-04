package uk.ac.ucl.comp0010.controllers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import uk.ac.ucl.comp0010.controllers.requests.StudentGradeRequest;
import uk.ac.ucl.comp0010.controllers.responses.StudentStatisticsResponse;
import uk.ac.ucl.comp0010.models.Grade;
import uk.ac.ucl.comp0010.models.Registration;
import uk.ac.ucl.comp0010.models.Student;
import uk.ac.ucl.comp0010.services.StudentService;

@ExtendWith(MockitoExtension.class)
class StudentControllerTest {

  @Mock
  private StudentService studentService;

  private StudentController studentController;

  @BeforeEach
  void setUp() {
    studentController = new StudentController(studentService);
  }

  @Test
  void basicCrudEndpointsDelegateToService() {
    Student student = new Student();
    when(studentService.getAllStudents()).thenReturn(List.of(student));
    when(studentService.getStudent(1L)).thenReturn(student);
    when(studentService.createStudent(student)).thenReturn(student);
    when(studentService.updateStudent(1L, student)).thenReturn(student);

    assertThat(studentController.getStudents()).containsExactly(student);
    assertThat(studentController.getStudent(1L)).isEqualTo(student);
    assertThat(studentController.createStudent(student)).isEqualTo(student);
    assertThat(studentController.updateStudent(1L, student)).isEqualTo(student);

    studentController.deleteStudent(1L);
    verify(studentService).deleteStudent(1L);
  }

  @Test
  void registrationAndGradesDelegateToService() throws Exception {
    Registration registration = new Registration();
    when(studentService.registerStudentToModule(1L, 2L)).thenReturn(registration);
    assertThat(studentController.registerStudent(1L, 2L)).isEqualTo(registration);

    studentController.unregisterStudent(1L, 2L);
    verify(studentService).unregisterStudentFromModule(1L, 2L);

    when(studentService.getRegistrationsForStudent(1L)).thenReturn(List.of(registration));
    when(studentService.getGradesForStudent(1L)).thenReturn(List.of());

    assertThat(studentController.getRegistrations(1L)).containsExactly(registration);
    assertThat(studentController.getGrades(1L)).isEmpty();

    StudentGradeRequest request = new StudentGradeRequest();
    request.setModuleId(3L);
    request.setScore(75);
    when(studentService.recordGrade(1L, 3L, 75)).thenReturn(new Grade());
    assertThat(studentController.recordGrade(1L, request)).isNotNull();
  }

  @Test
  void computedMetricsReturnedFromService() throws Exception {
    when(studentService.computeAverage(1L)).thenReturn(70.0);
    when(studentService.computeGpa(1L)).thenReturn(3.3);

    Map<String, Double> average = studentController.getAverage(1L);
    Map<String, Double> gpa = studentController.getGpa(1L);

    assertThat(average.get("average")).isEqualTo(70.0);
    assertThat(gpa.get("gpa")).isEqualTo(3.3);

    StudentStatisticsResponse response = new StudentStatisticsResponseBuilder().build();
    when(studentService.getStudentStatistics(1L)).thenReturn(response);
    assertThat(studentController.getStatistics(1L)).isEqualTo(response);
  }
}

/**
 * Helper builder for StudentStatisticsResponse instances in tests.
 */
class StudentStatisticsResponseBuilder {
  StudentStatisticsResponse build() {
    return StudentStatisticsResponse.fromStudent(new Student(), null);
  }
}
