package uk.ac.ucl.comp0010.services;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uk.ac.ucl.comp0010.exceptions.NoRegistrationException;
import uk.ac.ucl.comp0010.exceptions.ResourceConflictException;
import uk.ac.ucl.comp0010.exceptions.ResourceNotFoundException;
import uk.ac.ucl.comp0010.models.Module;
import uk.ac.ucl.comp0010.models.OperationEntityType;
import uk.ac.ucl.comp0010.models.Registration;
import uk.ac.ucl.comp0010.models.Student;
import uk.ac.ucl.comp0010.repositories.ModuleRepository;
import uk.ac.ucl.comp0010.repositories.RegistrationRepository;
import uk.ac.ucl.comp0010.repositories.StudentRepository;
import uk.ac.ucl.comp0010.services.OperationLogService.RegistrationSnapshot;

/**
 * Registration specific service logic.
 */
@Service
@Transactional
public class RegistrationService {
  private final RegistrationRepository registrationRepository;
  private final StudentRepository studentRepository;
  private final ModuleRepository moduleRepository;
  private final OperationLogService operationLogService;

  /**
   * CTR for Registration Service.
   *
   * @param registrationRepository Deps inj
   * @param studentRepository Deps inj
   * @param moduleRepository Deps inj
   */
  public RegistrationService(RegistrationRepository registrationRepository,
      StudentRepository studentRepository, ModuleRepository moduleRepository,
      OperationLogService operationLogService) {
    this.registrationRepository = registrationRepository;
    this.studentRepository = studentRepository;
    this.moduleRepository = moduleRepository;
    this.operationLogService = operationLogService;
  }

  /**
   * Retrieves all registrations.
   *
   * @return Registrations
   */
  @Transactional(readOnly = true)
  public List<Registration> getAllRegistrations() {
    return (List<Registration>) registrationRepository.findAll();
  }

  /**
   * Retrieves a single registration.
   *
   * @param id identity
   * @return Registration
   */
  @Transactional(readOnly = true)
  public Registration getRegistration(Long id) {
    return registrationRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Registration not found with id " + id));
  }

  /**
   * Creates a new registration.
   *
   * @param studentId student identity
   * @param moduleId module identity
   * @return Registration
   */
  public Registration register(Long studentId, Long moduleId) {
    if (studentId == null || moduleId == null) {
      throw new ResourceNotFoundException("No Student or Module provided");
    }

    Student student = studentRepository.findById(studentId)
        .orElseThrow(() -> new ResourceNotFoundException("Student not found with id " + studentId));
    Module module = moduleRepository.findById(moduleId)
        .orElseThrow(() -> new ResourceNotFoundException("Module not found with id " + moduleId));

    if (registrationRepository.existsByStudentAndModule(student, module)) {
      throw new ResourceConflictException("Student already registered for module");
    }

    Registration saved = registrationRepository.save(new Registration(student, module));
    operationLogService.logCreation(OperationEntityType.REGISTRATION, saved.getId(),
        new OperationLogService.RegistrationSnapshot(saved.getId(), studentId, moduleId),
        String.format("Registered %s to %s", student.getUserName(), module.getCode()));
    return saved;
  }

  /**
   * Removes a registration.
   *
   * @param studentId student identity
   * @param moduleId module identity
   * @throws NoRegistrationException if no registration
   */
  public void unregister(Long studentId, Long moduleId) throws NoRegistrationException {
    Student student = studentRepository.findById(studentId)
        .orElseThrow(() -> new ResourceNotFoundException("Student not found with id " + studentId));
    Module module = moduleRepository.findById(moduleId)
        .orElseThrow(() -> new ResourceNotFoundException("Module not found with id " + moduleId));

    Registration registration = registrationRepository.findByStudentAndModule(student, module)
        .orElseThrow(() -> new NoRegistrationException("Student is not registered for module"));

    RegistrationSnapshot snapshot = new RegistrationSnapshot(registration.getId(), studentId,
        moduleId);
    registrationRepository.delete(registration);
    operationLogService.logDeletion(OperationEntityType.REGISTRATION, registration.getId(),
        snapshot,
        String.format("Unregistered %s from %s", student.getUserName(), module.getCode()));
  }

  /**
   * Retrieves all registrations for a student.
   *
   * @param studentId student identity
   * @return Registrations.
   */
  @Transactional(readOnly = true)
  public List<Registration> getRegistrationsForStudent(Long studentId) {
    Student student = studentRepository.findById(studentId)
        .orElseThrow(() -> new ResourceNotFoundException("Student not found with id " + studentId));
    return registrationRepository.findAllByStudent(student);
  }

  /**
   * Retrieves all registrations for a module.
   *
   * @param moduleId module identity
   * @return Registrations
   */
  @Transactional(readOnly = true)
  public List<Registration> getRegistrationsForModule(Long moduleId) {
    Module module = moduleRepository.findById(moduleId)
        .orElseThrow(() -> new ResourceNotFoundException("Module not found with id " + moduleId));
    return registrationRepository.findAllByModule(module);
  }
}
