package uk.ac.ucl.comp0010.services;

import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uk.ac.ucl.comp0010.controllers.responses.StudentStatisticsResponse;
import uk.ac.ucl.comp0010.exceptions.NoGradeAvailableException;
import uk.ac.ucl.comp0010.exceptions.NoRegistrationException;
import uk.ac.ucl.comp0010.exceptions.ResourceConflictException;
import uk.ac.ucl.comp0010.exceptions.ResourceNotFoundException;
import uk.ac.ucl.comp0010.models.Grade;
import uk.ac.ucl.comp0010.models.Module;
import uk.ac.ucl.comp0010.models.OperationEntityType;
import uk.ac.ucl.comp0010.models.Registration;
import uk.ac.ucl.comp0010.models.Student;
import uk.ac.ucl.comp0010.repositories.GradeRepository;
import uk.ac.ucl.comp0010.repositories.ModuleRepository;
import uk.ac.ucl.comp0010.repositories.RegistrationRepository;
import uk.ac.ucl.comp0010.repositories.StudentRepository;
import uk.ac.ucl.comp0010.services.OperationLogService.GradeSnapshot;
import uk.ac.ucl.comp0010.services.OperationLogService.RegistrationSnapshot;

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
  private final OperationLogService operationLogService;

  /**
   * CTR for Student Service.
   *
   * @param studentRepository repository for student entities
   * @param moduleRepository repository for module entities
   * @param registrationRepository repository for registrations
   * @param gradeRepository repository for grades
   */
  public StudentService(StudentRepository studentRepository, ModuleRepository moduleRepository,
      RegistrationRepository registrationRepository, GradeRepository gradeRepository,
      OperationLogService operationLogService) {
    this.studentRepository = studentRepository;
    this.moduleRepository = moduleRepository;
    this.registrationRepository = registrationRepository;
    this.gradeRepository = gradeRepository;
    this.operationLogService = operationLogService;
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
   * @return Student
   */
  @Transactional(readOnly = true)
  public Student getStudent(Long id) {
    return studentRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Student not found with id " + id));
  }

  /**
   * Persists a new student.
   *
   * @param student the student to persist
   * @return Student
   */
  public Student createStudent(Student student) {
    if (student.getId() != null) {
      throw new ResourceConflictException("Student ID must be null for new student creation");
    }

    validateUniqueness(student);
    Student saved = studentRepository.save(student);
    operationLogService.logCreation(OperationEntityType.STUDENT, saved.getId(), saved,
        String.format("Created student %s %s", saved.getFirstName(), saved.getLastName()));
    return saved;
  }

  /**
   * Updates the basic properties of a student.
   *
   * @param id student id to update
   * @param updated updated student data
   * @return Student
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

    Student beforeUpdate = operationLogService.copyOf(existing, Student.class);
    applyUpdatedFields(existing, updated);
    Student saved = studentRepository.save(existing);
    operationLogService.logUpdate(OperationEntityType.STUDENT, saved.getId(), beforeUpdate, saved,
        String.format("Updated student %s", saved.getUserName()));
    return saved;
  }

  /**
   * Removes a student.
   *
   * @param id the student identifier
   */
  public void deleteStudent(Long id) {
    Student student = getStudent(id);
    Student snapshot = operationLogService.copyOf(student, Student.class);
    studentRepository.delete(student);
    operationLogService.logDeletion(OperationEntityType.STUDENT, id, snapshot,
        String.format("Deleted student %s", student.getUserName()));
  }

  /**
   * Registers the student to the supplied module.
   *
   * @param studentId identifier of the student
   * @param moduleId identifier of the module
   * @return Registration
   */
  public Registration registerStudentToModule(Long studentId, Long moduleId) {
    Student student = getStudent(studentId);
    Module module = moduleRepository.findById(moduleId)
        .orElseThrow(() -> new ResourceNotFoundException("Module not found with id " + moduleId));

    if (registrationRepository.existsByStudentAndModule(student, module)) {
      throw new ResourceConflictException("Student already registered for module");
    }

    Registration registration = new Registration(student, module);
    Registration saved = registrationRepository.save(registration);
    operationLogService.logCreation(OperationEntityType.REGISTRATION, saved.getId(),
        new OperationLogService.RegistrationSnapshot(saved.getId(), studentId, moduleId),
        String.format("Registered %s to %s", student.getUserName(), module.getCode()));
    return saved;
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
   * @return Grade
   * @throws NoRegistrationException if the student is not registered for the module
   */
  public Grade recordGrade(Long studentId, Long moduleId, int score)
      throws NoRegistrationException {
    Student student = getStudent(studentId);
    Module module = moduleRepository.findById(moduleId)
        .orElseThrow(() -> new ResourceNotFoundException("Module not found with id " + moduleId));

    Optional<Registration> registration =
        registrationRepository.findByStudentAndModule(student, module);
    if (registration.isEmpty()) {
      throw new NoRegistrationException("Student must be registered before receiving a grade");
    }

    Grade grade = gradeRepository.findByStudentAndModule(student, module).orElse(null);
    GradeSnapshot previous = grade == null
        ? null
        : new GradeSnapshot(grade.getId(), studentId, moduleId, grade.getScore());
    Grade target = grade == null ? new Grade(student, module, score) : grade;
    target.setScore(score);
    Grade saved = gradeRepository.save(target);
    if (previous == null) {
      operationLogService.logCreation(OperationEntityType.GRADE, saved.getId(),
          new GradeSnapshot(saved.getId(), studentId, moduleId, saved.getScore()),
          String.format("Created grade for %s in %s", student.getUserName(), module.getCode()));
    } else {
      operationLogService.logUpdate(OperationEntityType.GRADE, saved.getId(), previous,
          new GradeSnapshot(saved.getId(), studentId, moduleId, saved.getScore()),
          String.format("Updated grade for %s in %s", student.getUserName(), module.getCode()));
    }
    return saved;
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

  /**
   * Computes the GPA for a student on a 4.0 scale using common UK bands.
   * 70+ -> 4.0, 60-69 -> 3.3, 50-59 -> 2.7, 40-49 -> 2.0, else 0.0.
   *
   * @param studentId student identifier
   * @return GPA between 0.0 and 4.0
   * @throws NoGradeAvailableException if the student has no grades
   */
  @Transactional(readOnly = true)
  public double computeGpa(Long studentId) throws NoGradeAvailableException {
    List<Grade> grades = getGradesForStudent(studentId);
    if (grades.isEmpty()) {
      throw new NoGradeAvailableException("Student has no grades recorded");
    }

    double totalPoints = grades.stream()
        .mapToDouble(grade -> {
          int score = grade.getScore();
          if (score >= 70) {
            return 4.0;
          } else if (score >= 60) {
            return 3.3;
          } else if (score >= 50) {
            return 2.7;
          } else if (score >= 40) {
            return 2.0;
          }
          return 0.0;
        })
        .sum();

    return totalPoints / grades.size();
  }

  /**
   * Builds a statistics view for the given student including personal data and average score.
   *
   * @param studentId student identifier
   * @return StudentStatisticsResponse containing profile and average score information
   */
  @Transactional(readOnly = true)
  public StudentStatisticsResponse getStudentStatistics(Long studentId) {
    Student student = getStudent(studentId);
    List<Grade> grades = gradeRepository.findAllByStudent(student);
    Double average = grades.isEmpty()
        ? null
        : grades.stream().mapToInt(Grade::getScore).average().orElse(0.0);
    return StudentStatisticsResponse.fromStudent(student, average);
  }

  private void applyUpdatedFields(Student target, Student source) {
    target.setFirstName(source.getFirstName());
    target.setLastName(source.getLastName());
    target.setUserName(source.getUserName());
    target.setEmail(source.getEmail());
    target.setEntryYear(source.getEntryYear());
    target.setGraduateYear(source.getGraduateYear());
    target.setMajor(source.getMajor());
    target.setTuitionFee(source.getTuitionFee());
    target.setPaidTuitionFee(source.getPaidTuitionFee());
    target.setBirthDate(source.getBirthDate());
    target.setHomeStudent(source.getHomeStudent());
    target.setSex(source.getSex());
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
