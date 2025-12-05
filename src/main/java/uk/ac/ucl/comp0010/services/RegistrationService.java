package uk.ac.ucl.comp0010.services;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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
import java.time.LocalDate;
import java.util.Optional;

/**
 * Registration specific service logic.
 */
@Service
@Transactional
public class RegistrationService {
  private final RegistrationRepository registrationRepository;
  private final StudentRepository studentRepository;
  private final ModuleRepository moduleRepository;
  private final GradeRepository gradeRepository;

  /**
   * CTR for Registration Service.
   *
   * @param registrationRepository Deps inj
   * @param studentRepository Deps inj
   * @param moduleRepository Deps inj
   */
  public RegistrationService(RegistrationRepository registrationRepository,
      StudentRepository studentRepository, ModuleRepository moduleRepository,
      GradeRepository gradeRepository) {
    this.registrationRepository = registrationRepository;
    this.studentRepository = studentRepository;
    this.moduleRepository = moduleRepository;
    this.gradeRepository = gradeRepository;
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

    enforceModuleEligibility(student, module);

    return registrationRepository.save(new Registration(student, module));
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

    registrationRepository.delete(registration);
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

  private void enforceModuleEligibility(Student student, Module module) {
    if (module.getRequiredYear() != null) {
      int studentYear = resolveStudentYear(student);
      if (studentYear < module.getRequiredYear()) {
        throw new ResourceConflictException(
            "Student year " + studentYear + " is below required year " + module.getRequiredYear());
      }
    }

    if (module.getPrerequisite() != null) {
      Module prerequisite = module.getPrerequisite();
      Optional<Grade> prereqGrade =
          gradeRepository.findByStudentAndModule(student, prerequisite);
      if (prereqGrade.isEmpty() || prereqGrade.get().getScore() < 40) {
        throw new ResourceConflictException("Student must complete prerequisite module "
            + prerequisite.getCode() + " with a passing grade");
      }
    }
  }

  private int resolveStudentYear(Student student) {
    if (student.getEntryYear() == null) {
      throw new ResourceConflictException("Student entry year is missing for year validation");
    }
    int currentYear = LocalDate.now().getYear();
    int studentYear = currentYear - student.getEntryYear() + 1;
    return Math.max(studentYear, 1);
  }
}
