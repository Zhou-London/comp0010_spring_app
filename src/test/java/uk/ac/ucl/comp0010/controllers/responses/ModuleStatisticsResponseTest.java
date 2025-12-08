package uk.ac.ucl.comp0010.controllers.responses;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import uk.ac.ucl.comp0010.models.Module;

class ModuleStatisticsResponseTest {

  @Test
  void exposesModuleStatistics() {
    Module module = new Module("CS", "Computer Science", true, "Engineering");
    module.setId(7L);

    ModuleStatisticsResponse response = ModuleStatisticsResponse.from(module, 4, 12, 0.333,
        3, 2, 2d / 3d, 71.5);

    assertThat(response.getId()).isEqualTo(7L);
    assertThat(response.getCode()).isEqualTo("CS");
    assertThat(response.getName()).isEqualTo("Computer Science");
    assertThat(response.getMnc()).isTrue();
    assertThat(response.getDepartment()).isEqualTo("Engineering");
    assertThat(response.getRegistrationCount()).isEqualTo(4);
    assertThat(response.getTotalStudents()).isEqualTo(12);
    assertThat(response.getSelectionRate()).isEqualTo(0.333);
    assertThat(response.getTotalGrades()).isEqualTo(3);
    assertThat(response.getPassingGrades()).isEqualTo(2);
    assertThat(response.getPassRate()).isEqualTo(2d / 3d);
    assertThat(response.getAverageGrade()).isEqualTo(71.5);
  }

  @Test
  void includesPrerequisiteCodeWhenPresent() {
    Module prerequisite = new Module("PRE", "Prereq", true, "Dept");
    prerequisite.setId(1L);
    Module module = new Module("CS2", "Advanced", true, "Engineering");
    module.setId(8L);
    module.setPrerequisiteModule(prerequisite);

    ModuleStatisticsResponse response = ModuleStatisticsResponse.from(module, 0, 0, 0.0,
        0L, 0L, 0.0, 0.0);

    assertThat(response.getPrerequisiteCode()).isEqualTo("PRE");
  }
}
