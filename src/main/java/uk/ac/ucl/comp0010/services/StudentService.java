package uk.ac.ucl.comp0010.services;

import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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

/**
 * Encapsulates student focused business operations.
 */
@Service
@Transactional
public class StudentService {
  private final StudentRepository studentRepository;
  private final ModuleRepository moduleRepository;
  private final RegistrationRepository registrationRepository;
  private final GradeRepository gradeRepository;

  public StudentService(
      StudentRepository studentRepository,
      ModuleRepository moduleRepository,
      RegistrationRepository registrationRepository,
      GradeRepository gradeRepository) {
    this.studentRepository = studentRepository;
    this.moduleRepository = moduleRepository;
    this.registrationRepository = registrationRepository;
    this.gradeRepository = gradeRepository;
  }

  /**
   * Retrieves every student in the system.
   *
   * @return the students ordered as returned by the repository
   */
  @Transactional(readOnly = true)
  public List<Student> getAllStudents() {
    return (List<Student>) studentRepository.findAll();
  }

  /**
   * Loads a single student.
   *
   * @param id student id
   * @return the student if one exists
   */
  @Transactional(readOnly = true)
  public Student getStudent(Long id) {
    return studentRepository
        .findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Student not found with id " + id));
  }

  /**
   * Persists a new student.
   *
   * @param student the student to persist
   * @return the stored entity
   */
  public Student createStudent(Student student) {
    validateUniqueness(student);
    return studentRepository.save(student);
  }

  /**
   * Updates the basic properties of a student.
   *
   * @param id student id to update
   * @param updated updated student data
   * @return the stored entity
   */
  public Student updateStudent(Long id, Student updated) {
    Student existing = getStudent(id);

    if (!existing.getUserName().equals(updated.getUserName())
        && studentRepository.existsByUserName(updated.getUserName())) {
      throw new ResourceConflictException("Username already taken: " + updated.getUserName());
    }

    if (!existing.getEmail().equals(updated.getEmail())
        && studentRepository.existsByEmail(updated.getEmail())) {
      throw new ResourceConflictException("Email already registered: " + updated.getEmail());
    }

    existing.setFirstName(updated.getFirstName());
    existing.setLastName(updated.getLastName());
    existing.setUserName(updated.getUserName());
    existing.setEmail(updated.getEmail());
    return studentRepository.save(existing);
  }

  /**
   * Removes a student.
   *
   * @param id the student identifier
   */
  public void deleteStudent(Long id) {
    Student student = getStudent(id);
    studentRepository.delete(student);
  }

  /**
   * Registers the student to the supplied module.
   *
   * @param studentId identifier of the student
   * @param moduleId identifier of the module
   * @return the persisted registration
   */
  public Registration registerStudentToModule(Long studentId, Long moduleId) {
    Student student = getStudent(studentId);
    Module module = moduleRepository
        .findById(moduleId)
        .orElseThrow(() -> new ResourceNotFoundException("Module not found with id " + moduleId));

    if (registrationRepository.existsByStudentAndModule(student, module)) {
      throw new ResourceConflictException("Student already registered for module");
    }

    Registration registration = new Registration(student, module);
    return registrationRepository.save(registration);
  }

  /**
   * Removes the registration between a student and a module.
   *
   * @param studentId identifier of the student
   * @param moduleId identifier of the module
   * @throws NoRegistrationException if the student was not registered for the module
   */
  public void unregisterStudentFromModule(Long studentId, Long moduleId)
      throws NoRegistrationException {
    Student student = getStudent(studentId);
    Module module = moduleRepository
        .findById(moduleId)
        .orElseThrow(() -> new ResourceNotFoundException("Module not found with id " + moduleId));

    Registration registration = registrationRepository
        .findByStudentAndModule(student, module)
        .orElseThrow(() -> new NoRegistrationException("Student is not registered for module"));

    registrationRepository.delete(registration);
  }

  /**
   * Returns registrations for a student.
   */
  @Transactional(readOnly = true)
  public List<Registration> getRegistrationsForStudent(Long studentId) {
    Student student = getStudent(studentId);
    return registrationRepository.findAllByStudent(student);
  }

  /**
   * Records or updates a student's grade for a module.
   *
   * @param studentId student identifier
   * @param moduleId module identifier
   * @param score grade score
   * @return persisted grade
   * @throws NoRegistrationException if the student is not registered for the module
   */
  public Grade recordGrade(Long studentId, Long moduleId, int score) throws NoRegistrationException {
    Student student = getStudent(studentId);
    Module module = moduleRepository
        .findById(moduleId)
        .orElseThrow(() -> new ResourceNotFoundException("Module not found with id " + moduleId));

    Optional<Registration> registration = registrationRepository.findByStudentAndModule(student, module);
    if (registration.isEmpty()) {
      throw new NoRegistrationException("Student must be registered before receiving a grade");
    }

    Grade grade = gradeRepository
        .findByStudentAndModule(student, module)
        .orElse(new Grade(student, module, score));
    grade.setScore(score);
    return gradeRepository.save(grade);
  }

  /**
   * Fetches every grade for the student.
   */
  @Transactional(readOnly = true)
  public List<Grade> getGradesForStudent(Long studentId) {
    Student student = getStudent(studentId);
    return gradeRepository.findAllByStudent(student);
  }

  /**
   * Computes the average grade for a student.
   *
   * @param studentId student identifier
   * @return average score
   * @throws NoGradeAvailableException if the student has no grades
   */
  @Transactional(readOnly = true)
  public double computeAverage(Long studentId) throws NoGradeAvailableException {
    List<Grade> grades = getGradesForStudent(studentId);
    if (grades.isEmpty()) {
      throw new NoGradeAvailableException("Student has no grades recorded");
    }
    return grades.stream().mapToInt(Grade::getScore).average().orElse(0.0);
  }

  private void validateUniqueness(Student student) {
    if (studentRepository.existsByUserName(student.getUserName())) {
      throw new ResourceConflictException("Username already taken: " + student.getUserName());
    }

    if (studentRepository.existsByEmail(student.getEmail())) {
      throw new ResourceConflictException("Email already registered: " + student.getEmail());
    }
  }
}
