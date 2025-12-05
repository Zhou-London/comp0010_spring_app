package uk.ac.ucl.comp0010.services;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import uk.ac.ucl.comp0010.exceptions.ResourceConflictException;
import uk.ac.ucl.comp0010.models.Grade;
import uk.ac.ucl.comp0010.models.Module;
import uk.ac.ucl.comp0010.models.Registration;
import uk.ac.ucl.comp0010.models.Student;
import uk.ac.ucl.comp0010.repositories.GradeRepository;
import uk.ac.ucl.comp0010.repositories.ModuleRepository;
import uk.ac.ucl.comp0010.repositories.RegistrationRepository;
import uk.ac.ucl.comp0010.repositories.StudentRepository;

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

  private RegistrationService registrationService;

  @BeforeEach
  void setUp() {
    registrationService = new RegistrationService(registrationRepository, studentRepository,
        moduleRepository, gradeRepository);
  }

  @Test
  void registerRejectsInsufficientYear() {
    int currentYear = LocalDate.now().getYear();
    Student student = new Student();
    student.setId(1L);
    student.setEntryYear(currentYear); // year 1

    Module module = new Module();
    module.setId(2L);
    module.setRequiredYear(2);

    when(studentRepository.findById(1L)).thenReturn(Optional.of(student));
    when(moduleRepository.findById(2L)).thenReturn(Optional.of(module));

    assertThrows(ResourceConflictException.class, () -> registrationService.register(1L, 2L));
    verify(registrationRepository, never()).save(any());
  }

  @Test
  void registerRejectsMissingPrerequisiteGrade() {
    int currentYear = LocalDate.now().getYear();
    Student student = new Student();
    student.setId(1L);
    student.setEntryYear(currentYear - 1); // year 2

    Module prerequisite = new Module();
    prerequisite.setId(10L);
    prerequisite.setCode("PRE101");

    Module module = new Module();
    module.setId(2L);
    module.setRequiredYear(2);
    module.setPrerequisite(prerequisite);

    when(studentRepository.findById(1L)).thenReturn(Optional.of(student));
    when(moduleRepository.findById(2L)).thenReturn(Optional.of(module));
    when(registrationRepository.existsByStudentAndModule(student, module)).thenReturn(false);
    when(gradeRepository.findByStudentAndModule(student, prerequisite)).thenReturn(Optional.empty());

    assertThrows(ResourceConflictException.class, () -> registrationService.register(1L, 2L));
    verify(registrationRepository, never()).save(any());
  }

  @Test
  void registerSucceedsWhenEligible() {
    int currentYear = LocalDate.now().getYear();
    Student student = new Student();
    student.setId(1L);
    student.setEntryYear(currentYear - 1); // year 2

    Module prerequisite = new Module();
    prerequisite.setId(10L);
    prerequisite.setCode("PRE101");

    Module module = new Module();
    module.setId(2L);
    module.setRequiredYear(2);
    module.setPrerequisite(prerequisite);

    Grade prereqGrade = new Grade(student, prerequisite, 70);

    when(studentRepository.findById(1L)).thenReturn(Optional.of(student));
    when(moduleRepository.findById(2L)).thenReturn(Optional.of(module));
    when(registrationRepository.existsByStudentAndModule(student, module)).thenReturn(false);
    when(gradeRepository.findByStudentAndModule(student, prerequisite))
        .thenReturn(Optional.of(prereqGrade));
    when(registrationRepository.save(any(Registration.class)))
        .thenReturn(new Registration(student, module));

    Registration registration = registrationService.register(1L, 2L);
    assertNotNull(registration);
  }
}
