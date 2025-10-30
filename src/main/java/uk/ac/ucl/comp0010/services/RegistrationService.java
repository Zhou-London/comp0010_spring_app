package uk.ac.ucl.comp0010.services;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uk.ac.ucl.comp0010.exceptions.NoRegistrationException;
import uk.ac.ucl.comp0010.exceptions.ResourceConflictException;
import uk.ac.ucl.comp0010.exceptions.ResourceNotFoundException;
import uk.ac.ucl.comp0010.models.Module;
import uk.ac.ucl.comp0010.models.Registration;
import uk.ac.ucl.comp0010.models.Student;
import uk.ac.ucl.comp0010.repositories.ModuleRepository;
import uk.ac.ucl.comp0010.repositories.RegistrationRepository;
import uk.ac.ucl.comp0010.repositories.StudentRepository;

/**
 * Registration specific service logic.
 */
@Service
@Transactional
public class RegistrationService {
  private final RegistrationRepository registrationRepository;
  private final StudentRepository studentRepository;
  private final ModuleRepository moduleRepository;

  public RegistrationService(
      RegistrationRepository registrationRepository,
      StudentRepository studentRepository,
      ModuleRepository moduleRepository) {
    this.registrationRepository = registrationRepository;
    this.studentRepository = studentRepository;
    this.moduleRepository = moduleRepository;
  }

  @Transactional(readOnly = true)
  public List<Registration> getAllRegistrations() {
    return (List<Registration>) registrationRepository.findAll();
  }

  @Transactional(readOnly = true)
  public Registration getRegistration(Long id) {
    return registrationRepository
        .findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Registration not found with id " + id));
  }

  public Registration register(Long studentId, Long moduleId) {
    Student student = studentRepository
        .findById(studentId)
        .orElseThrow(() -> new ResourceNotFoundException("Student not found with id " + studentId));
    Module module = moduleRepository
        .findById(moduleId)
        .orElseThrow(() -> new ResourceNotFoundException("Module not found with id " + moduleId));

    if (registrationRepository.existsByStudentAndModule(student, module)) {
      throw new ResourceConflictException("Student already registered for module");
    }

    return registrationRepository.save(new Registration(student, module));
  }

  public void unregister(Long studentId, Long moduleId) throws NoRegistrationException {
    Student student = studentRepository
        .findById(studentId)
        .orElseThrow(() -> new ResourceNotFoundException("Student not found with id " + studentId));
    Module module = moduleRepository
        .findById(moduleId)
        .orElseThrow(() -> new ResourceNotFoundException("Module not found with id " + moduleId));

    Registration registration = registrationRepository
        .findByStudentAndModule(student, module)
        .orElseThrow(() -> new NoRegistrationException("Student is not registered for module"));

    registrationRepository.delete(registration);
  }

  @Transactional(readOnly = true)
  public List<Registration> getRegistrationsForStudent(Long studentId) {
    Student student = studentRepository
        .findById(studentId)
        .orElseThrow(() -> new ResourceNotFoundException("Student not found with id " + studentId));
    return registrationRepository.findAllByStudent(student);
  }

  @Transactional(readOnly = true)
  public List<Registration> getRegistrationsForModule(Long moduleId) {
    Module module = moduleRepository
        .findById(moduleId)
        .orElseThrow(() -> new ResourceNotFoundException("Module not found with id " + moduleId));
    return registrationRepository.findAllByModule(module);
  }
}
