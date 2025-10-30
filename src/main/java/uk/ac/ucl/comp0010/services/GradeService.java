package uk.ac.ucl.comp0010.services;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uk.ac.ucl.comp0010.exceptions.NoRegistrationException;
import uk.ac.ucl.comp0010.exceptions.ResourceNotFoundException;
import uk.ac.ucl.comp0010.models.Grade;
import uk.ac.ucl.comp0010.models.Module;
import uk.ac.ucl.comp0010.models.Student;
import uk.ac.ucl.comp0010.repositories.GradeRepository;
import uk.ac.ucl.comp0010.repositories.ModuleRepository;
import uk.ac.ucl.comp0010.repositories.RegistrationRepository;
import uk.ac.ucl.comp0010.repositories.StudentRepository;

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

  public GradeService(
      GradeRepository gradeRepository,
      StudentRepository studentRepository,
      ModuleRepository moduleRepository,
      RegistrationRepository registrationRepository) {
    this.gradeRepository = gradeRepository;
    this.studentRepository = studentRepository;
    this.moduleRepository = moduleRepository;
    this.registrationRepository = registrationRepository;
  }

  @Transactional(readOnly = true)
  public List<Grade> getAllGrades() {
    return (List<Grade>) gradeRepository.findAll();
  }

  @Transactional(readOnly = true)
  public Grade getGrade(Long id) {
    return gradeRepository
        .findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Grade not found with id " + id));
  }

  public Grade createGrade(Long studentId, Long moduleId, int score) throws NoRegistrationException {
    Student student = studentRepository
        .findById(studentId)
        .orElseThrow(() -> new ResourceNotFoundException("Student not found with id " + studentId));
    Module module = moduleRepository
        .findById(moduleId)
        .orElseThrow(() -> new ResourceNotFoundException("Module not found with id " + moduleId));

    if (!registrationRepository.existsByStudentAndModule(student, module)) {
      throw new NoRegistrationException("Student must be registered before receiving a grade");
    }

    Grade grade = new Grade(student, module, score);
    return gradeRepository.save(grade);
  }

  public Grade updateGrade(Long id, int score) {
    Grade grade = getGrade(id);
    grade.setScore(score);
    return gradeRepository.save(grade);
  }

  public void deleteGrade(Long id) {
    Grade grade = getGrade(id);
    gradeRepository.delete(grade);
  }

  @Transactional(readOnly = true)
  public List<Grade> getGradesForStudent(Long studentId) {
    Student student = studentRepository
        .findById(studentId)
        .orElseThrow(() -> new ResourceNotFoundException("Student not found with id " + studentId));
    return gradeRepository.findAllByStudent(student);
  }

  @Transactional(readOnly = true)
  public List<Grade> getGradesForModule(Long moduleId) {
    Module module = moduleRepository
        .findById(moduleId)
        .orElseThrow(() -> new ResourceNotFoundException("Module not found with id " + moduleId));
    return gradeRepository.findAllByModule(module);
  }

  public Grade upsertGrade(Long studentId, Long moduleId, int score) throws NoRegistrationException {
    Student student = studentRepository
        .findById(studentId)
        .orElseThrow(() -> new ResourceNotFoundException("Student not found with id " + studentId));
    Module module = moduleRepository
        .findById(moduleId)
        .orElseThrow(() -> new ResourceNotFoundException("Module not found with id " + moduleId));

    if (!registrationRepository.existsByStudentAndModule(student, module)) {
      throw new NoRegistrationException("Student must be registered before receiving a grade");
    }

    Grade grade = gradeRepository
        .findByStudentAndModule(student, module)
        .orElse(new Grade(student, module, score));
    grade.setScore(score);
    return gradeRepository.save(grade);
  }
}
