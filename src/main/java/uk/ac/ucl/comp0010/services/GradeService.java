package uk.ac.ucl.comp0010.services;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uk.ac.ucl.comp0010.exceptions.NoRegistrationException;
import uk.ac.ucl.comp0010.exceptions.ResourceNotFoundException;
import uk.ac.ucl.comp0010.models.Grade;
import uk.ac.ucl.comp0010.models.Module;
import uk.ac.ucl.comp0010.models.OperationEntityType;
import uk.ac.ucl.comp0010.models.Student;
import uk.ac.ucl.comp0010.repositories.GradeRepository;
import uk.ac.ucl.comp0010.repositories.ModuleRepository;
import uk.ac.ucl.comp0010.repositories.RegistrationRepository;
import uk.ac.ucl.comp0010.repositories.StudentRepository;
import uk.ac.ucl.comp0010.services.OperationLogService.GradeSnapshot;

/**
 * Coordinates business behaviour around grades.
 */
@Service
@Transactional
public class GradeService {
  private final GradeRepository gradeRepository;
  private final StudentRepository studentRepository;
  private final ModuleRepository moduleRepository;
  private final RegistrationRepository registrationRepository;
  private final OperationLogService operationLogService;

  /**
   * CTR for Grade Service.
   *
   * @param gradeRepository deps inj
   * @param studentRepository deps inj
   * @param moduleRepository deps inj
   * @param registrationRepository deps inj
   */
  public GradeService(GradeRepository gradeRepository, StudentRepository studentRepository,
      ModuleRepository moduleRepository, RegistrationRepository registrationRepository,
      OperationLogService operationLogService) {
    this.gradeRepository = gradeRepository;
    this.studentRepository = studentRepository;
    this.moduleRepository = moduleRepository;
    this.registrationRepository = registrationRepository;
    this.operationLogService = operationLogService;
  }

  @Transactional(readOnly = true)
  public List<Grade> getAllGrades() {
    return (List<Grade>) gradeRepository.findAll();
  }

  /**
   * Retrieves a single grade.
   *
   * @param id grade identity
   * @return grade
   */
  @Transactional(readOnly = true)
  public Grade getGrade(Long id) {
    return gradeRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Grade not found with id " + id));
  }

  /**
   * Creates a new grade for an existing student.
   *
   * @param studentId student identity
   * @param moduleId module identity
   * @param score score identity
   * @return grade
   * @throws NoRegistrationException if no registration found
   */
  public Grade createGrade(Long studentId, Long moduleId, int score)
      throws NoRegistrationException {

    if (studentId == null || moduleId == null) {
      throw new NoRegistrationException("No Student or Module provided");
    }

    Student student = studentRepository.findById(studentId)
        .orElseThrow(() -> new ResourceNotFoundException("Student not found with id " + studentId));
    Module module = moduleRepository.findById(moduleId)
        .orElseThrow(() -> new ResourceNotFoundException("Module not found with id " + moduleId));

    if (!registrationRepository.existsByStudentAndModule(student, module)) {
      throw new NoRegistrationException("Student must be registered before receiving a grade");
    }

    Grade grade = new Grade(student, module, score);
    Grade saved = gradeRepository.save(grade);
    operationLogService.logCreation(OperationEntityType.GRADE, saved.getId(),
        new GradeSnapshot(saved.getId(), studentId, moduleId, saved.getScore()),
        String.format("Created grade for %s in %s", student.getUserName(), module.getCode()));
    return saved;
  }

  /**
   * Updates the grade of an existing student.
   *
   * @param id student identity
   * @param score score entity
   * @return grade
   */
  public Grade updateGrade(Long id, int score) {
    Grade grade = getGrade(id);
    GradeSnapshot snapshot = new GradeSnapshot(grade.getId(), grade.getStudent().getId(),
        grade.getModule().getId(), grade.getScore());
    grade.setScore(score);
    Grade saved = gradeRepository.save(grade);
    operationLogService.logUpdate(OperationEntityType.GRADE, saved.getId(), snapshot,
        new GradeSnapshot(saved.getId(), grade.getStudent().getId(), grade.getModule().getId(),
            saved.getScore()), String.format("Updated grade %d", saved.getId()));
    return saved;
  }

  /**
   * Deletes a grade entry and records the operation.
   *
   * @param id grade identifier
   */
  public void deleteGrade(Long id) {
    Grade grade = getGrade(id);
    GradeSnapshot snapshot = new GradeSnapshot(grade.getId(), grade.getStudent().getId(),
        grade.getModule().getId(), grade.getScore());
    gradeRepository.delete(grade);
    operationLogService.logDeletion(OperationEntityType.GRADE, id, snapshot,
        String.format("Deleted grade %d", id));
  }

  /**
   * Retrieves all grades of an existing student.
   *
   * @param studentId student identity
   * @return grades
   */
  @Transactional(readOnly = true)
  public List<Grade> getGradesForStudent(Long studentId) {
    Student student = studentRepository.findById(studentId)
        .orElseThrow(() -> new ResourceNotFoundException("Student not found with id " + studentId));
    return gradeRepository.findAllByStudent(student);
  }

  /**
   * Retrieves all grades of an existing module.
   *
   * @param moduleId module identity
   * @return modules
   */
  @Transactional(readOnly = true)
  public List<Grade> getGradesForModule(Long moduleId) {
    Module module = moduleRepository.findById(moduleId)
        .orElseThrow(() -> new ResourceNotFoundException("Module not found with id " + moduleId));
    return gradeRepository.findAllByModule(module);
  }

  /**
   * Upserts a grade of an existing student.
   *
   * @param studentId student identity
   * @param moduleId module identity
   * @param score score entity
   * @return Grade
   * @throws NoRegistrationException if no registration found
   */
  public Grade upsertGrade(Long studentId, Long moduleId, int score)
      throws NoRegistrationException {
    if (studentId == null || moduleId == null) {
      throw new NoRegistrationException("No Student or Module provided");
    }

    Student student = studentRepository.findById(studentId)
        .orElseThrow(() -> new ResourceNotFoundException("Student not found with id " + studentId));
    Module module = moduleRepository.findById(moduleId)
        .orElseThrow(() -> new ResourceNotFoundException("Module not found with id " + moduleId));

    if (!registrationRepository.existsByStudentAndModule(student, module)) {
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
}
