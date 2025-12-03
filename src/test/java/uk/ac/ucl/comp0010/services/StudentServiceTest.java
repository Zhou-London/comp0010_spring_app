package uk.ac.ucl.comp0010.services;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import uk.ac.ucl.comp0010.exceptions.NoGradeAvailableException;
import uk.ac.ucl.comp0010.exceptions.NoRegistrationException;
import uk.ac.ucl.comp0010.exceptions.ResourceConflictException;
import uk.ac.ucl.comp0010.exceptions.ResourceNotFoundException;
import uk.ac.ucl.comp0010.models.Grade;
import uk.ac.ucl.comp0010.models.Module;
import uk.ac.ucl.comp0010.models.Registration;
import uk.ac.ucl.comp0010.models.Student;
import uk.ac.ucl.comp0010.repositories.GradeRepository;
import uk.ac.ucl.comp0010.repositories.ModuleRepository;
import uk.ac.ucl.comp0010.repositories.RegistrationRepository;
import uk.ac.ucl.comp0010.repositories.StudentRepository;

@ExtendWith(MockitoExtension.class)
class StudentServiceTest {

  @Mock
  private StudentRepository studentRepository;

  @Mock
  private ModuleRepository moduleRepository;

  @Mock
  private RegistrationRepository registrationRepository;

  @Mock
  private GradeRepository gradeRepository;

  private StudentService studentService;

  @BeforeEach
  void setUp() {
    studentService = new StudentService(studentRepository, moduleRepository,
        registrationRepository, gradeRepository);
  }

  @Test
  void getStudentThrowsWhenMissing() {
    when(studentRepository.findById(1L)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> studentService.getStudent(1L))
        .isInstanceOf(ResourceNotFoundException.class);
  }

  @Test
  void createStudentValidatesIdAndUniqueness() {
    Student student = new Student("Ada", "Lovelace", "ada", "ada@example.com");
    student.setId(null);

    when(studentRepository.existsByUserName("ada")).thenReturn(false);
    when(studentRepository.existsByEmail("ada@example.com")).thenReturn(false);
    when(studentRepository.save(student)).thenReturn(student);

    Student saved = studentService.createStudent(student);
    assertThat(saved).isEqualTo(student);

    student.setId(5L);
    assertThatThrownBy(() -> studentService.createStudent(student))
        .isInstanceOf(ResourceConflictException.class);
  }

  @Test
  void createStudentThrowsWhenDuplicateUsernameOrEmail() {
    Student student = new Student("Alan", "Turing", "alan", "alan@example.com");
    when(studentRepository.existsByUserName("alan")).thenReturn(true);

    assertThatThrownBy(() -> studentService.createStudent(student))
        .isInstanceOf(ResourceConflictException.class)
        .hasMessageContaining("Username");

    when(studentRepository.existsByUserName("alan")).thenReturn(false);
    when(studentRepository.existsByEmail("alan@example.com")).thenReturn(true);

    assertThatThrownBy(() -> studentService.createStudent(student))
        .isInstanceOf(ResourceConflictException.class)
        .hasMessageContaining("Email");
  }

  @Test
  void updateStudentChecksConflictsAndSaves() {
    Student existing = new Student("Ada", "Lovelace", "ada", "ada@example.com");
    Student updated = new Student("Ada", "Lovelace", "ada2", "ada2@example.com");

    when(studentRepository.findById(1L)).thenReturn(Optional.of(existing),
        Optional.of(new Student("Ada", "Lovelace", "ada", "ada@example.com")),
        Optional.of(new Student("Ada", "Lovelace", "ada", "ada@example.com")));
    when(studentRepository.existsByUserName("ada2")).thenReturn(false);
    when(studentRepository.existsByEmail("ada2@example.com")).thenReturn(false);
    when(studentRepository.save(existing)).thenReturn(existing);

    Student result = studentService.updateStudent(1L, updated);
    assertThat(result.getUserName()).isEqualTo("ada2");

    when(studentRepository.existsByUserName("ada2")).thenReturn(true);
    assertThatThrownBy(() -> studentService.updateStudent(1L, updated))
        .isInstanceOf(ResourceConflictException.class);

    when(studentRepository.existsByUserName("ada2")).thenReturn(false);
    when(studentRepository.existsByEmail("ada2@example.com")).thenReturn(true);
    assertThatThrownBy(() -> studentService.updateStudent(1L, updated))
        .isInstanceOf(ResourceConflictException.class);
  }

  @Test
  void deleteStudentDelegatesToRepository() {
    Student student = new Student();
    when(studentRepository.findById(1L)).thenReturn(Optional.of(student));

    studentService.deleteStudent(1L);

    verify(studentRepository).delete(student);
  }

  @Test
  void registerStudentCreatesRegistrationOrThrows() {
    Student student = new Student();
    Module module = new Module();
    Registration registration = new Registration(student, module);

    when(studentRepository.findById(1L)).thenReturn(Optional.of(student));
    when(moduleRepository.findById(2L)).thenReturn(Optional.of(module));
    when(registrationRepository.existsByStudentAndModule(student, module)).thenReturn(false);
    when(registrationRepository.save(any(Registration.class))).thenReturn(registration);

    assertThat(studentService.registerStudentToModule(1L, 2L)).isEqualTo(registration);

    when(registrationRepository.existsByStudentAndModule(student, module)).thenReturn(true);
    assertThatThrownBy(() -> studentService.registerStudentToModule(1L, 2L))
        .isInstanceOf(ResourceConflictException.class);
  }

  @Test
  void unregisterStudentHandlesMissingRegistration() {
    Student student = new Student();
    Module module = new Module();
    when(studentRepository.findById(1L)).thenReturn(Optional.of(student));
    when(moduleRepository.findById(2L)).thenReturn(Optional.of(module));
    when(registrationRepository.findByStudentAndModule(student, module))
        .thenReturn(Optional.empty());

    assertThatThrownBy(() -> studentService.unregisterStudentFromModule(1L, 2L))
        .isInstanceOf(NoRegistrationException.class);
  }

  @Test
  void recordGradeCreatesOrUpdates() throws NoRegistrationException {
    Student student = new Student();
    Module module = new Module();
    Grade existing = new Grade(student, module, 40);
    when(studentRepository.findById(1L)).thenReturn(Optional.of(student));
    when(moduleRepository.findById(2L)).thenReturn(Optional.of(module));
    when(registrationRepository.findByStudentAndModule(student, module))
        .thenReturn(Optional.of(new Registration(student, module)));
    when(gradeRepository.findByStudentAndModule(student, module)).thenReturn(Optional.of(existing));
    when(gradeRepository.save(any(Grade.class))).thenAnswer(invocation -> invocation.getArgument(0));

    Grade result = studentService.recordGrade(1L, 2L, 85);
    assertThat(result.getScore()).isEqualTo(85);

    when(gradeRepository.findByStudentAndModule(student, module)).thenReturn(Optional.empty());
    Grade created = studentService.recordGrade(1L, 2L, 70);
    assertThat(created.getScore()).isEqualTo(70);
  }

  @Test
  void recordGradeThrowsWhenNotRegistered() {
    Student student = new Student();
    Module module = new Module();
    when(studentRepository.findById(1L)).thenReturn(Optional.of(student));
    when(moduleRepository.findById(2L)).thenReturn(Optional.of(module));
    when(registrationRepository.findByStudentAndModule(student, module)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> studentService.recordGrade(1L, 2L, 50))
        .isInstanceOf(NoRegistrationException.class);
  }

  @Test
  void computeAverageAndGpaCalculateAndThrowWhenEmpty() throws NoGradeAvailableException {
    Student student = new Student();
    when(studentRepository.findById(1L)).thenReturn(Optional.of(student));
    when(gradeRepository.findAllByStudent(student)).thenReturn(List.of());

    assertThatThrownBy(() -> studentService.computeAverage(1L))
        .isInstanceOf(NoGradeAvailableException.class);
    assertThatThrownBy(() -> studentService.computeGpa(1L))
        .isInstanceOf(NoGradeAvailableException.class);

    Grade high = new Grade(student, new Module(), 80);
    Grade mid = new Grade(student, new Module(), 55);
    when(gradeRepository.findAllByStudent(student)).thenReturn(List.of(high, mid));

    assertThat(studentService.computeAverage(1L)).isEqualTo(67.5);
    assertThat(studentService.computeGpa(1L)).isEqualTo((4.0 + 2.7) / 2);
  }

  @Test
  void registrationsAndGradesDelegated() {
    Student student = new Student();
    when(studentRepository.findById(1L)).thenReturn(Optional.of(student));
    when(registrationRepository.findAllByStudent(student)).thenReturn(List.of());
    when(gradeRepository.findAllByStudent(student)).thenReturn(List.of());

    assertThat(studentService.getRegistrationsForStudent(1L)).isEmpty();
    assertThat(studentService.getGradesForStudent(1L)).isEmpty();

    verify(registrationRepository).findAllByStudent(student);
    verify(gradeRepository).findAllByStudent(student);
  }

  @Test
  void getAllStudentsDelegatesToRepository() {
    when(studentRepository.findAll()).thenReturn(List.of(new Student()));

    assertThat(studentService.getAllStudents()).hasSize(1);
    verify(studentRepository).findAll();
  }
}
