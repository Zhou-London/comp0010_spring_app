package uk.ac.ucl.comp0010.services;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uk.ac.ucl.comp0010.exceptions.ResourceConflictException;
import uk.ac.ucl.comp0010.exceptions.ResourceNotFoundException;
import uk.ac.ucl.comp0010.models.Module;
import uk.ac.ucl.comp0010.models.OperationEntityType;
import uk.ac.ucl.comp0010.repositories.ModuleRepository;

/**
 * Provides module related business behaviour.
 */
@Service
@Transactional
public class ModuleService {
  private final ModuleRepository moduleRepository;
  private final OperationLogService operationLogService;

  public ModuleService(ModuleRepository moduleRepository, OperationLogService operationLogService) {
    this.moduleRepository = moduleRepository;
    this.operationLogService = operationLogService;
  }

  @Transactional(readOnly = true)
  public List<Module> getAllModules() {
    return (List<Module>) moduleRepository.findAll();
  }

  /**
   * Retrieves a module by id.
   *
   * @param id module identity
   * @return Module
   */
  @Transactional(readOnly = true)
  public Module getModule(Long id) {
    return moduleRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Module not found with id " + id));
  }

  /**
   * Creates a new module.
   *
   * @param module module entity
   * @return Module
   */
  public Module createModule(Module module) {
    if (module.getId() != null) {
      throw new ResourceConflictException("Module ID must be null for new module creation");
    }

    if (moduleRepository.existsByCode(module.getCode())) {
      throw new ResourceConflictException("Module code already exists: " + module.getCode());
    }

    ensureDepartmentProvided(module);
    Module saved = moduleRepository.save(module);
    operationLogService.logCreation(OperationEntityType.MODULE, saved.getId(), saved,
        String.format("Created module %s", saved.getCode()));
    return saved;
  }

  /**
   * Updates an existing module by id.
   *
   * @param id module identity
   * @param updated module entity
   * @return Module
   */
  public Module updateModule(Long id, Module updated) {
    Module existing = getModule(id);
    if (!existing.getCode().equals(updated.getCode())
        && moduleRepository.existsByCode(updated.getCode())) {
      throw new ResourceConflictException("Module code already exists: " + updated.getCode());
    }

    ensureDepartmentProvided(updated);
    Module snapshot = operationLogService.copyOf(existing, Module.class);
    applyUpdatedFields(existing, updated);
    Module saved = moduleRepository.save(existing);
    operationLogService.logUpdate(OperationEntityType.MODULE, saved.getId(), snapshot, saved,
        String.format("Updated module %s", saved.getCode()));
    return saved;
  }

  /**
   * Deletes a module and records the operation log.
   *
   * @param id module identifier
   */
  public void deleteModule(Long id) {
    Module module = getModule(id);
    Module snapshot = operationLogService.copyOf(module, Module.class);
    moduleRepository.delete(module);
    operationLogService.logDeletion(OperationEntityType.MODULE, id, snapshot,
        String.format("Deleted module %s", module.getCode()));
  }

  private void ensureDepartmentProvided(Module module) {
    if (module.getDepartment() == null || module.getDepartment().isBlank()) {
      throw new ResourceConflictException("Module department is required");
    }
    module.setDepartment(module.getDepartment().trim());
  }

  private void applyUpdatedFields(Module existing, Module updated) {
    existing.setCode(updated.getCode());
    existing.setName(updated.getName());
    existing.setMnc(updated.getMnc());
    existing.setDepartment(updated.getDepartment());
  }
}
