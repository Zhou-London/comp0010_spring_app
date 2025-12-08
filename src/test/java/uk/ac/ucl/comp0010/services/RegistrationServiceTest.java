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
import uk.ac.ucl.comp0010.services.OperationLogService;

@ExtendWith(MockitoExtension.class)
class RegistrationServiceTest {

  @Mock
  private RegistrationRepository registrationRepository;

  @Mock
  private StudentRepository studentRepository;

  @Mock
  private ModuleRepository moduleRepository;

  @Mock
  private GradeRepository gradeRepository;

  @Mock
  private OperationLogService operationLogService;

  private RegistrationService registrationService;

  @BeforeEach
  void setUp() {
    registrationService = new RegistrationService(registrationRepository, studentRepository,
        moduleRepository, gradeRepository, operationLogService);
  }

  @Test
  void getRegistrationThrowsWhenMissing() {
    when(registrationRepository.findById(1L)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> registrationService.getRegistration(1L))
        .isInstanceOf(ResourceNotFoundException.class);
  }

  @Test
  void registerValidatesInputsAndDuplicates() {
    Student student = new Student();
    Module module = new Module();
    Registration saved = new Registration(student, module);

    when(studentRepository.findById(1L)).thenReturn(Optional.of(student));
    when(moduleRepository.findById(2L)).thenReturn(Optional.of(module));
    when(registrationRepository.existsByStudentAndModule(student, module)).thenReturn(false);
    when(registrationRepository.save(any(Registration.class))).thenReturn(saved);

    assertThat(registrationService.register(1L, 2L)).isEqualTo(saved);

    when(registrationRepository.existsByStudentAndModule(student, module)).thenReturn(true);
    assertThatThrownBy(() -> registrationService.register(1L, 2L))
        .isInstanceOf(ResourceConflictException.class);
  }

  @Test
  void registerThrowsWhenIdsMissingOrEntitiesNotFound() {
    assertThatThrownBy(() -> registrationService.register(null, 2L))
        .isInstanceOf(ResourceNotFoundException.class);

    when(studentRepository.findById(1L)).thenReturn(Optional.empty());
    assertThatThrownBy(() -> registrationService.register(1L, 2L))
        .isInstanceOf(ResourceNotFoundException.class);
  }

  @Test
  void unregisterDeletesExistingRegistration() throws NoRegistrationException {
    Student student = new Student();
    Module module = new Module();
    Registration registration = new Registration(student, module);
    when(studentRepository.findById(1L)).thenReturn(Optional.of(student));
    when(moduleRepository.findById(2L)).thenReturn(Optional.of(module));
    when(registrationRepository.findByStudentAndModule(student, module))
        .thenReturn(Optional.of(registration));

    registrationService.unregister(1L, 2L);

    verify(registrationRepository).delete(registration);
  }

  @Test
  void unregisterThrowsWhenNoRegistration() {
    Student student = new Student();
    Module module = new Module();
    when(studentRepository.findById(1L)).thenReturn(Optional.of(student));
    when(moduleRepository.findById(2L)).thenReturn(Optional.of(module));
    when(registrationRepository.findByStudentAndModule(student, module))
        .thenReturn(Optional.empty());

    assertThatThrownBy(() -> registrationService.unregister(1L, 2L))
        .isInstanceOf(NoRegistrationException.class);
  }

  @Test
  void queriesDelegateToRepositories() {
    Student student = new Student();
    Module module = new Module();
    when(studentRepository.findById(1L)).thenReturn(Optional.of(student));
    when(moduleRepository.findById(2L)).thenReturn(Optional.of(module));
    when(registrationRepository.findAllByStudent(student)).thenReturn(List.of());
    when(registrationRepository.findAllByModule(module)).thenReturn(List.of());
    when(registrationRepository.findAll()).thenReturn(List.of());

    assertThat(registrationService.getRegistrationsForStudent(1L)).isEmpty();
    assertThat(registrationService.getRegistrationsForModule(2L)).isEmpty();
    assertThat(registrationService.getAllRegistrations()).isEmpty();

    verify(registrationRepository).findAllByStudent(student);
    verify(registrationRepository).findAllByModule(module);
    verify(registrationRepository).findAll();
  }

  @Test
  void registerThrowsWhenRequiredYearNotMet() {
    Student student = new Student();
    student.setEntryYear(1);
    Module module = new Module();
    module.setRequiredYear(2);

    when(studentRepository.findById(1L)).thenReturn(Optional.of(student));
    when(moduleRepository.findById(2L)).thenReturn(Optional.of(module));
    when(registrationRepository.existsByStudentAndModule(student, module)).thenReturn(false);

    assertThatThrownBy(() -> registrationService.register(1L, 2L))
        .isInstanceOf(ResourceConflictException.class)
        .hasMessageContaining("required year");
  }

  @Test
  void registerThrowsWhenPrerequisiteNotCompleted() {
    Student student = new Student();
    Module prerequisite = new Module("PRE", "Prereq", true, "Dept");
    prerequisite.setId(10L);
    Module module = new Module("MOD", "Main", true, "Dept");
    module.setPrerequisiteModule(prerequisite);

    when(studentRepository.findById(1L)).thenReturn(Optional.of(student));
    when(moduleRepository.findById(2L)).thenReturn(Optional.of(module));
    when(registrationRepository.existsByStudentAndModule(student, module)).thenReturn(false);
    when(gradeRepository.findByStudentAndModule(student, prerequisite)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> registrationService.register(1L, 2L))
        .isInstanceOf(ResourceConflictException.class)
        .hasMessageContaining("Prerequisite");

    Grade failing = new Grade(student, prerequisite, 50);
    when(gradeRepository.findByStudentAndModule(student, prerequisite))
        .thenReturn(Optional.of(failing));

    assertThatThrownBy(() -> registrationService.register(1L, 2L))
        .isInstanceOf(ResourceConflictException.class);
  }

  @Test
  void registerAllowsNullYearAndSatisfiedPrerequisite() {
    Student student = new Student();
    student.setEntryYear(null);

    Module prerequisite = new Module("PRE", "Prereq", true, "Dept");
    prerequisite.setId(10L);
    Module module = new Module("MOD", "Main", true, "Dept");
    module.setRequiredYear(2);
    module.setPrerequisiteModule(prerequisite);

    when(studentRepository.findById(1L)).thenReturn(Optional.of(student));
    when(moduleRepository.findById(2L)).thenReturn(Optional.of(module));
    when(registrationRepository.existsByStudentAndModule(student, module)).thenReturn(false);
    Grade passing = new Grade(student, prerequisite, 75);
    when(gradeRepository.findByStudentAndModule(student, prerequisite)).thenReturn(Optional.of(passing));
    Registration saved = new Registration(student, module);
    when(registrationRepository.save(any(Registration.class))).thenReturn(saved);

    assertThat(registrationService.register(1L, 2L)).isEqualTo(saved);
  }
}
