package uk.ac.ucl.comp0010.services;

import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uk.ac.ucl.comp0010.controllers.responses.ModuleStatisticsResponse;
import uk.ac.ucl.comp0010.exceptions.ResourceNotFoundException;
import uk.ac.ucl.comp0010.models.Grade;
import uk.ac.ucl.comp0010.models.Module;
import uk.ac.ucl.comp0010.models.Registration;
import uk.ac.ucl.comp0010.repositories.GradeRepository;
import uk.ac.ucl.comp0010.repositories.ModuleRepository;
import uk.ac.ucl.comp0010.repositories.RegistrationRepository;
import uk.ac.ucl.comp0010.repositories.StudentRepository;

/**
 * Computes statistics for modules.
 */
@Service
@Transactional(readOnly = true)
public class ModuleStatisticsService {
  private final ModuleRepository moduleRepository;
  private final StudentRepository studentRepository;
  private final RegistrationRepository registrationRepository;
  private final GradeRepository gradeRepository;

  /**
   * Creates a statistics service with access to module, student, registration, and grade data.
   */
  public ModuleStatisticsService(ModuleRepository moduleRepository,
      StudentRepository studentRepository, RegistrationRepository registrationRepository,
      GradeRepository gradeRepository) {
    this.moduleRepository = moduleRepository;
    this.studentRepository = studentRepository;
    this.registrationRepository = registrationRepository;
    this.gradeRepository = gradeRepository;
  }

  /**
   * Builds statistics for every module available.
   *
   * @return list of module statistics
   */
  public List<ModuleStatisticsResponse> getAllStatistics() {
    Iterable<Module> modules = moduleRepository.findAll();
    List<ModuleStatisticsResponse> responses = new ArrayList<>();
    for (Module module : modules) {
      responses.add(buildStatisticsFor(module));
    }
    return responses;
  }

  /**
   * Builds statistics for a single module.
   *
   * @param moduleId module identifier
   * @return populated statistics response
   */
  public ModuleStatisticsResponse getStatistics(Long moduleId) {
    Module module = moduleRepository.findById(moduleId).orElseThrow(
        () -> new ResourceNotFoundException("Module not found with id " + moduleId));
    return buildStatisticsFor(module);
  }

  private ModuleStatisticsResponse buildStatisticsFor(Module module) {
    long totalStudents = studentRepository.count();
    List<Registration> registrations = registrationRepository.findAllByModule(module);
    double selectionRate = totalStudents == 0 ? 0.0
        : (double) registrations.size() / (double) totalStudents;

    List<Grade> grades = gradeRepository.findAllByModule(module);
    long totalGrades = grades.size();
    long passingGrades = grades.stream().filter(grade -> grade.getScore() >= 60).count();
    Double passRate = totalGrades == 0 ? null : (double) passingGrades / (double) totalGrades;
    Double averageGrade = totalGrades == 0 ? null
        : grades.stream().mapToInt(Grade::getScore).average().orElse(0.0);

    return ModuleStatisticsResponse.from(module, (long) registrations.size(), totalStudents,
        selectionRate, totalGrades, passingGrades, passRate, averageGrade);
  }
}
