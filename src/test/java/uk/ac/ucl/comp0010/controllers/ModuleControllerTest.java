package uk.ac.ucl.comp0010.controllers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import uk.ac.ucl.comp0010.models.Module;
import uk.ac.ucl.comp0010.services.ModuleService;
import uk.ac.ucl.comp0010.services.RegistrationService;
import uk.ac.ucl.comp0010.services.GradeService;

@ExtendWith(MockitoExtension.class)
class ModuleControllerTest {

  @Mock
  private ModuleService moduleService;

  @Mock
  private RegistrationService registrationService;

  @Mock
  private GradeService gradeService;

  private ModuleController moduleController;

  @BeforeEach
  void setUp() {
    moduleController = new ModuleController(moduleService, registrationService, gradeService);
  }

  @Test
  void crudEndpointsDelegateToService() {
    Module module = new Module();
    when(moduleService.getAllModules()).thenReturn(List.of(module));
    when(moduleService.getModule(1L)).thenReturn(module);
    when(moduleService.createModule(module)).thenReturn(module);
    when(moduleService.updateModule(1L, module)).thenReturn(module);

    assertThat(moduleController.getModules()).containsExactly(module);
    assertThat(moduleController.getModule(1L)).isEqualTo(module);
    assertThat(moduleController.createModule(module)).isEqualTo(module);
    assertThat(moduleController.updateModule(1L, module)).isEqualTo(module);

    moduleController.deleteModule(1L);
    verify(moduleService).deleteModule(1L);
  }

  @Test
  void relatedQueriesDelegateToServices() {
    when(registrationService.getRegistrationsForModule(1L)).thenReturn(List.of());
    when(gradeService.getGradesForModule(1L)).thenReturn(List.of());

    assertThat(moduleController.getRegistrations(1L)).isEmpty();
    assertThat(moduleController.getGrades(1L)).isEmpty();
  }
}
