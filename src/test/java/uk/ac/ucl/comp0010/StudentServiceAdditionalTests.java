package uk.ac.ucl.comp0010;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.within;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import uk.ac.ucl.comp0010.exceptions.NoGradeAvailableException;
import uk.ac.ucl.comp0010.exceptions.NoRegistrationException;
import uk.ac.ucl.comp0010.models.Grade;
import uk.ac.ucl.comp0010.models.Module;
import uk.ac.ucl.comp0010.models.Student;
import uk.ac.ucl.comp0010.repositories.GradeRepository;
import uk.ac.ucl.comp0010.repositories.ModuleRepository;
import uk.ac.ucl.comp0010.repositories.RegistrationRepository;
import uk.ac.ucl.comp0010.repositories.StudentRepository;
import uk.ac.ucl.comp0010.services.ModuleService;
import uk.ac.ucl.comp0010.services.StudentService;

@SpringBootTest
class StudentServiceAdditionalTests {

  @Autowired
  private StudentService studentService;

  @Autowired
  private ModuleService moduleService;

  @Autowired
  private StudentRepository studentRepository;

  @Autowired
  private ModuleRepository moduleRepository;

  @Autowired
  private RegistrationRepository registrationRepository;

  @Autowired
  private GradeRepository gradeRepository;

  @BeforeEach
  void cleanDatabase() {
    gradeRepository.deleteAll();
    registrationRepository.deleteAll();
    moduleRepository.deleteAll();
    studentRepository.deleteAll();
  }

  @Test
  void computeGpaCoversAllScoreBands() throws NoRegistrationException, NoGradeAvailableException {
    Student student = studentService.createStudent(new Student("Ada", "Lovelace", "ada", "ada@example.com"));

    int[] scores = {75, 65, 55, 45, 30};
    for (int i = 0; i < scores.length; i++) {
      Module module = moduleService.createModule(new Module("MOD" + i, "Module " + i, true));
      studentService.registerStudentToModule(student.getId(), module.getId());
      studentService.recordGrade(student.getId(), module.getId(), scores[i]);
    }

    double gpa = studentService.computeGpa(student.getId());
    assertThat(gpa).isCloseTo(2.4, within(0.0001));
  }

  @Test
  void computeGpaThrowsWhenNoGradesPresent() {
    Student student = studentService.createStudent(new Student("Grace", "Hopper", "grace", "grace@example.com"));

    assertThatThrownBy(() -> studentService.computeGpa(student.getId()))
        .isInstanceOf(NoGradeAvailableException.class)
        .hasMessageContaining("Student has no grades recorded");
  }

  @Test
  void recordGradeUpdatesExistingRecord() throws NoRegistrationException {
    Student student = studentService.createStudent(new Student("Linus", "Torvalds", "linus", "linus@example.com"));
    Module module = moduleService.createModule(new Module("LINUX", "Kernel", true));
    studentService.registerStudentToModule(student.getId(), module.getId());

    Grade initial = studentService.recordGrade(student.getId(), module.getId(), 60);
    Grade updated = studentService.recordGrade(student.getId(), module.getId(), 95);

    assertThat(updated.getId()).isEqualTo(initial.getId());
    assertThat(updated.getScore()).isEqualTo(95);
  }
}
