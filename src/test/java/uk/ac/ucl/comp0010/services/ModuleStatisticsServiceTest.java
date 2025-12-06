package uk.ac.ucl.comp0010.services;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import uk.ac.ucl.comp0010.controllers.responses.ModuleStatisticsResponse;
import uk.ac.ucl.comp0010.exceptions.ResourceNotFoundException;
import uk.ac.ucl.comp0010.models.Grade;
import uk.ac.ucl.comp0010.models.Module;
import uk.ac.ucl.comp0010.models.Registration;
import uk.ac.ucl.comp0010.models.Student;
import uk.ac.ucl.comp0010.repositories.GradeRepository;
import uk.ac.ucl.comp0010.repositories.ModuleRepository;
import uk.ac.ucl.comp0010.repositories.RegistrationRepository;
import uk.ac.ucl.comp0010.repositories.StudentRepository;

@ExtendWith(MockitoExtension.class)
class ModuleStatisticsServiceTest {

  @Mock
  private ModuleRepository moduleRepository;

  @Mock
  private StudentRepository studentRepository;

  @Mock
  private RegistrationRepository registrationRepository;

  @Mock
  private GradeRepository gradeRepository;

  private ModuleStatisticsService moduleStatisticsService;

  @BeforeEach
  void setUp() {
    moduleStatisticsService = new ModuleStatisticsService(moduleRepository, studentRepository,
        registrationRepository, gradeRepository);
  }

  @Test
  void buildsStatisticsForSingleModule() {
    Module module = new Module("CS", "Computer Science", true, "Engineering");
    module.setId(1L);

    when(moduleRepository.findById(1L)).thenReturn(Optional.of(module));
    when(studentRepository.count()).thenReturn(10L);
    when(registrationRepository.findAllByModule(module)).thenReturn(
        List.of(new Registration(), new Registration(), new Registration(), new Registration()));
    Student student = new Student();
    when(gradeRepository.findAllByModule(module)).thenReturn(List.of(new Grade(student, module, 80),
        new Grade(student, module, 75), new Grade(student, module, 50)));

    ModuleStatisticsResponse response = moduleStatisticsService.getStatistics(1L);

    assertThat(response.getId()).isEqualTo(1L);
    assertThat(response.getDepartment()).isEqualTo("Engineering");
    assertThat(response.getRegistrationCount()).isEqualTo(4);
    assertThat(response.getSelectionRate()).isEqualTo(0.4);
    assertThat(response.getTotalGrades()).isEqualTo(3);
    assertThat(response.getPassingGrades()).isEqualTo(2);
    assertThat(response.getPassRate()).isEqualTo(2d / 3d);
    assertThat(response.getAverageGrade()).isEqualTo((80 + 75 + 50) / 3d);
  }

  @Test
  void throwsWhenModuleMissing() {
    when(moduleRepository.findById(99L)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> moduleStatisticsService.getStatistics(99L))
        .isInstanceOf(ResourceNotFoundException.class);
  }

  @Test
  void buildsStatisticsForAllModules() {
    Module moduleOne = new Module("CS", "Computer Science", true, "Engineering");
    Module moduleTwo = new Module("MA", "Maths", false, "Mathematics");
    when(moduleRepository.findAll()).thenReturn(List.of(moduleOne, moduleTwo));
    when(studentRepository.count()).thenReturn(0L);
    when(registrationRepository.findAllByModule(moduleOne)).thenReturn(List.of());
    when(registrationRepository.findAllByModule(moduleTwo)).thenReturn(List.of());
    when(gradeRepository.findAllByModule(moduleOne)).thenReturn(List.of());
    when(gradeRepository.findAllByModule(moduleTwo)).thenReturn(List.of());

    List<ModuleStatisticsResponse> responses = moduleStatisticsService.getAllStatistics();

    assertThat(responses).hasSize(2);
    assertThat(responses.get(0).getSelectionRate()).isZero();
    assertThat(responses.get(1).getPassRate()).isNull();
  }
}
