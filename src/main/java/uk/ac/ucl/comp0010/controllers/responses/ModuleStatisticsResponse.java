package uk.ac.ucl.comp0010.controllers.responses;

import io.swagger.v3.oas.annotations.media.Schema;
import uk.ac.ucl.comp0010.models.Module;

/**
 * Response wrapper summarising module statistics.
 */
public class ModuleStatisticsResponse {
  @Schema(description = "Module identifier")
  private final Long id;

  @Schema(description = "Module code")
  private final String code;

  @Schema(description = "Module name")
  private final String name;

  @Schema(description = "Whether the module is mandatory")
  private final Boolean mnc;

  @Schema(description = "Department responsible for the module")
  private final String department;

  @Schema(description = "Number of students registered for the module")
  private final Long registrationCount;

  @Schema(description = "Total students available for registration")
  private final Long totalStudents;

  @Schema(description = "Proportion of students who selected this module")
  private final Double selectionRate;

  @Schema(description = "Number of grades recorded for the module")
  private final Long totalGrades;

  @Schema(description = "Number of passing grades (>=60)")
  private final Long passingGrades;

  @Schema(description = "Proportion of grades that are a pass")
  private final Double passRate;

  @Schema(description = "Average grade for the module")
  private final Double averageGrade;

  private ModuleStatisticsResponse(Module module, Long registrationCount, Long totalStudents,
      Double selectionRate, Long totalGrades, Long passingGrades, Double passRate,
      Double averageGrade) {
    this.id = module.getId();
    this.code = module.getCode();
    this.name = module.getName();
    this.mnc = module.getMnc();
    this.department = module.getDepartment();
    this.registrationCount = registrationCount;
    this.totalStudents = totalStudents;
    this.selectionRate = selectionRate;
    this.totalGrades = totalGrades;
    this.passingGrades = passingGrades;
    this.passRate = passRate;
    this.averageGrade = averageGrade;
  }

  public Long getId() {
    return id;
  }

  public String getCode() {
    return code;
  }

  public String getName() {
    return name;
  }

  public Boolean getMnc() {
    return mnc;
  }

  public String getDepartment() {
    return department;
  }

  public Long getRegistrationCount() {
    return registrationCount;
  }

  public Long getTotalStudents() {
    return totalStudents;
  }

  public Double getSelectionRate() {
    return selectionRate;
  }

  public Long getTotalGrades() {
    return totalGrades;
  }

  public Long getPassingGrades() {
    return passingGrades;
  }

  public Double getPassRate() {
    return passRate;
  }

  public Double getAverageGrade() {
    return averageGrade;
  }

  /**
   * Factory for module statistics responses.
   */
  public static ModuleStatisticsResponse from(Module module, long registrationCount,
      long totalStudents, double selectionRate, long totalGrades, long passingGrades,
      Double passRate, Double averageGrade) {
    return new ModuleStatisticsResponse(module, registrationCount, totalStudents, selectionRate,
        totalGrades, passingGrades, passRate, averageGrade);
  }
}
