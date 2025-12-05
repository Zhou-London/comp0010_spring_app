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
import uk.ac.ucl.comp0010.models.Module;
import uk.ac.ucl.comp0010.models.Registration;
import uk.ac.ucl.comp0010.models.Student;
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

  private RegistrationService registrationService;

  @BeforeEach
  void setUp() {
    registrationService = new RegistrationService(registrationRepository, studentRepository,
        moduleRepository);
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
}
