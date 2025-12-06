package uk.ac.ucl.comp0010.services;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import uk.ac.ucl.comp0010.exceptions.NoRegistrationException;
import uk.ac.ucl.comp0010.exceptions.ResourceNotFoundException;
import uk.ac.ucl.comp0010.models.Grade;
import uk.ac.ucl.comp0010.models.Module;
import uk.ac.ucl.comp0010.models.Student;
import uk.ac.ucl.comp0010.repositories.GradeRepository;
import uk.ac.ucl.comp0010.repositories.ModuleRepository;
import uk.ac.ucl.comp0010.repositories.RegistrationRepository;
import uk.ac.ucl.comp0010.repositories.StudentRepository;
import uk.ac.ucl.comp0010.services.OperationLogService;

@ExtendWith(MockitoExtension.class)
class GradeServiceTest {

  @Mock
  private GradeRepository gradeRepository;

  @Mock
  private StudentRepository studentRepository;

  @Mock
  private ModuleRepository moduleRepository;

  @Mock
  private RegistrationRepository registrationRepository;

  @Mock
  private OperationLogService operationLogService;

  private GradeService gradeService;

  @BeforeEach
  void setUp() {
    gradeService = new GradeService(gradeRepository, studentRepository, moduleRepository,
        registrationRepository, operationLogService);
  }

  @Test
  void createGradeThrowsWhenIdsMissing() {
    assertThatThrownBy(() -> gradeService.createGrade(null, 1L, 80))
        .isInstanceOf(NoRegistrationException.class);
    assertThatThrownBy(() -> gradeService.createGrade(1L, null, 80))
        .isInstanceOf(NoRegistrationException.class);
  }

  @Test
  void createGradePersistsWhenRegistrationExists() throws NoRegistrationException {
    Student student = new Student("Ada", "Lovelace", "ada", "ada@example.com");
    student.setId(1L);
    Module module = new Module("CS101", "Intro", true);
    module.setId(2L);
    Grade saved = new Grade(student, module, 90);

    when(studentRepository.findById(1L)).thenReturn(Optional.of(student));
    when(moduleRepository.findById(2L)).thenReturn(Optional.of(module));
    when(registrationRepository.existsByStudentAndModule(student, module)).thenReturn(true);
    when(gradeRepository.save(any(Grade.class))).thenReturn(saved);

    Grade result = gradeService.createGrade(1L, 2L, 90);

    assertThat(result).isEqualTo(saved);
    verify(gradeRepository).save(any(Grade.class));
  }

  @Test
  void createGradeThrowsWhenNotRegistered() {
    Student student = new Student("Alan", "Turing", "alan", "alan@example.com");
    Module module = new Module("CS201", "Algorithms", true);

    when(studentRepository.findById(1L)).thenReturn(Optional.of(student));
    when(moduleRepository.findById(2L)).thenReturn(Optional.of(module));
    when(registrationRepository.existsByStudentAndModule(student, module)).thenReturn(false);

    assertThatThrownBy(() -> gradeService.createGrade(1L, 2L, 70))
        .isInstanceOf(NoRegistrationException.class)
        .hasMessageContaining("must be registered");
  }

  @Test
  void getGradeThrowsWhenMissing() {
    when(gradeRepository.findById(3L)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> gradeService.getGrade(3L))
        .isInstanceOf(ResourceNotFoundException.class)
        .hasMessageContaining("3");
  }

  @Test
  void updateGradePersistsNewScore() {
    Student student = new Student("Tim", "Berners-Lee", "tim", "tim@example.com");
    Module module = new Module("WEB", "Web", true);
    Grade grade = new Grade(student, module, 60);

    when(gradeRepository.findById(4L)).thenReturn(Optional.of(grade));
    when(gradeRepository.save(grade)).thenReturn(grade);

    Grade updated = gradeService.updateGrade(4L, 95);

    assertThat(updated.getScore()).isEqualTo(95);
    verify(gradeRepository).save(grade);
  }

  @Test
  void upsertGradeCreatesAndUpdates() throws NoRegistrationException {
    Student student = new Student("Grace", "Hopper", "grace", "grace@example.com");
    student.setId(5L);
    Module module = new Module("COMP", "Computing", true);
    module.setId(6L);

    Grade existing = new Grade(student, module, 40);

    when(studentRepository.findById(5L)).thenReturn(Optional.of(student));
    when(moduleRepository.findById(6L)).thenReturn(Optional.of(module));
    when(registrationRepository.existsByStudentAndModule(student, module)).thenReturn(true);

    when(gradeRepository.findByStudentAndModule(student, module)).thenReturn(Optional.empty());
    when(gradeRepository.save(any(Grade.class))).thenAnswer(invocation -> invocation.getArgument(0));

    Grade created = gradeService.upsertGrade(5L, 6L, 50);
    assertThat(created.getScore()).isEqualTo(50);

    when(gradeRepository.findByStudentAndModule(student, module)).thenReturn(Optional.of(existing));

    Grade updated = gradeService.upsertGrade(5L, 6L, 75);
    assertThat(updated.getScore()).isEqualTo(75);
    verify(gradeRepository, times(2)).save(any(Grade.class));
  }

  @Test
  void upsertGradeThrowsWhenMissingRegistration() {
    Student student = new Student("Linus", "Torvalds", "linus", "linus@example.com");
    Module module = new Module("OS", "Operating Systems", true);

    when(studentRepository.findById(7L)).thenReturn(Optional.of(student));
    when(moduleRepository.findById(8L)).thenReturn(Optional.of(module));
    when(registrationRepository.existsByStudentAndModule(student, module)).thenReturn(false);

    assertThatThrownBy(() -> gradeService.upsertGrade(7L, 8L, 65))
        .isInstanceOf(NoRegistrationException.class);
  }

  @Test
  void findAllDelegatesToRepository() {
    List<Grade> grades = List.of(new Grade(), new Grade());
    when(gradeRepository.findAll()).thenReturn(grades);

    assertThat(gradeService.getAllGrades()).hasSize(2);
    verify(gradeRepository).findAll();
  }

  @Test
  void getGradesForStudentAndModuleUseRepositories() {
    Student student = new Student();
    Module module = new Module();
    when(studentRepository.findById(1L)).thenReturn(Optional.of(student));
    when(moduleRepository.findById(2L)).thenReturn(Optional.of(module));
    when(gradeRepository.findAllByStudent(student)).thenReturn(List.of());
    when(gradeRepository.findAllByModule(module)).thenReturn(List.of());

    assertThat(gradeService.getGradesForStudent(1L)).isEmpty();
    assertThat(gradeService.getGradesForModule(2L)).isEmpty();

    verify(gradeRepository).findAllByStudent(student);
    verify(gradeRepository).findAllByModule(module);
  }
}
