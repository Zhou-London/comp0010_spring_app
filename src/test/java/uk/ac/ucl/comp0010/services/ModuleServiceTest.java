package uk.ac.ucl.comp0010.services;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import uk.ac.ucl.comp0010.exceptions.ResourceConflictException;
import uk.ac.ucl.comp0010.exceptions.ResourceNotFoundException;
import uk.ac.ucl.comp0010.models.Module;
import uk.ac.ucl.comp0010.repositories.ModuleRepository;
import uk.ac.ucl.comp0010.services.OperationLogService;

@ExtendWith(MockitoExtension.class)
class ModuleServiceTest {

  @Mock
  private ModuleRepository moduleRepository;

  @Mock
  private OperationLogService operationLogService;

  private ModuleService moduleService;

  @BeforeEach
  void setUp() {
    moduleService = new ModuleService(moduleRepository, operationLogService);
  }

  @Test
  void getModuleThrowsWhenMissing() {
    when(moduleRepository.findById(1L)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> moduleService.getModule(1L))
        .isInstanceOf(ResourceNotFoundException.class);
  }

  @Test
  void createModuleValidatesIdAndUniqueness() {
    Module module = new Module("CS", "Computer Science", true, "Engineering");
    module.setId(null);
    when(moduleRepository.existsByCode("CS")).thenReturn(false);
    when(moduleRepository.save(module)).thenReturn(module);

    assertThat(moduleService.createModule(module)).isEqualTo(module);

    module.setId(2L);
    assertThatThrownBy(() -> moduleService.createModule(module))
        .isInstanceOf(ResourceConflictException.class);
  }

  @Test
  void createModuleThrowsOnDuplicateCode() {
    Module module = new Module("CS", "Computer Science", true, "Engineering");
    when(moduleRepository.existsByCode("CS")).thenReturn(true);

    assertThatThrownBy(() -> moduleService.createModule(module))
        .isInstanceOf(ResourceConflictException.class);
  }

  @Test
  void createModuleRequiresDepartment() {
    Module module = new Module("CS", "Computer Science", true, "");
    when(moduleRepository.existsByCode("CS")).thenReturn(false);

    assertThatThrownBy(() -> moduleService.createModule(module))
        .isInstanceOf(ResourceConflictException.class)
        .hasMessageContaining("department");
  }

  @Test
  void updateModulePersistsChanges() {
    Module existing = new Module("CS", "Computer Science", true, "Engineering");
    Module updated = new Module("CS2", "Advanced", false, "Mathematics");

    when(moduleRepository.findById(1L)).thenReturn(Optional.of(existing),
        Optional.of(new Module("CS", "Computer Science", true, "Engineering")));
    when(moduleRepository.existsByCode("CS2")).thenReturn(false);
    when(moduleRepository.save(existing)).thenReturn(existing);

    Module result = moduleService.updateModule(1L, updated);
    assertThat(result.getName()).isEqualTo("Advanced");

    when(moduleRepository.existsByCode("CS2")).thenReturn(true);
    assertThatThrownBy(() -> moduleService.updateModule(1L, updated))
        .isInstanceOf(ResourceConflictException.class);
  }

  @Test
  void deleteModuleDelegatesToRepository() {
    Module module = new Module();
    when(moduleRepository.findById(1L)).thenReturn(Optional.of(module));

    moduleService.deleteModule(1L);
    verify(moduleRepository).delete(module);
  }

  @Test
  void updateModuleRejectsSelfPrerequisite() {
    Module existing = new Module("CS", "Computer Science", true, "Engineering");
    existing.setId(1L);

    Module updated = new Module("CS", "Computer Science", true, "Engineering");
    updated.setId(1L);
    updated.setPrerequisiteModule(existing);

    when(moduleRepository.findById(1L)).thenReturn(Optional.of(existing));

    assertThatThrownBy(() -> moduleService.updateModule(1L, updated))
        .isInstanceOf(ResourceConflictException.class)
        .hasMessageContaining("prerequisite");
  }

  @Test
  void createModuleAllowsDifferentPrerequisite() {
    Module prerequisite = new Module("PRE", "Prereq", true, "Dept");
    prerequisite.setId(5L);
    Module module = new Module("CS3", "Computer Science", true, "Engineering");
    module.setPrerequisiteModule(prerequisite);

    when(moduleRepository.existsByCode("CS3")).thenReturn(false);
    when(moduleRepository.save(module)).thenReturn(module);

    Module saved = moduleService.createModule(module);
    assertThat(saved.getPrerequisiteModule()).isEqualTo(prerequisite);
  }

  @Test
  void getAllModulesDelegatesToRepository() {
    when(moduleRepository.findAll()).thenReturn(List.of(new Module()));

    assertThat(moduleService.getAllModules()).hasSize(1);
    verify(moduleRepository).findAll();
  }
}
