package uk.ac.ucl.comp0010.services;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uk.ac.ucl.comp0010.exceptions.ResourceConflictException;
import uk.ac.ucl.comp0010.exceptions.ResourceNotFoundException;
import uk.ac.ucl.comp0010.models.Module;
import uk.ac.ucl.comp0010.repositories.ModuleRepository;

/**
 * Provides module related business behaviour.
 */
@Service
@Transactional
public class ModuleService {
  private final ModuleRepository moduleRepository;

  public ModuleService(ModuleRepository moduleRepository) {
    this.moduleRepository = moduleRepository;
  }

  @Transactional(readOnly = true)
  public List<Module> getAllModules() {
    return (List<Module>) moduleRepository.findAll();
  }

  @Transactional(readOnly = true)
  public Module getModule(Long id) {
    return moduleRepository
        .findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Module not found with id " + id));
  }

  public Module createModule(Module module) {
    if (moduleRepository.existsByCode(module.getCode())) {
      throw new ResourceConflictException("Module code already exists: " + module.getCode());
    }
    return moduleRepository.save(module);
  }

  public Module updateModule(Long id, Module updated) {
    Module existing = getModule(id);
    if (!existing.getCode().equals(updated.getCode())
        && moduleRepository.existsByCode(updated.getCode())) {
      throw new ResourceConflictException("Module code already exists: " + updated.getCode());
    }

    existing.setCode(updated.getCode());
    existing.setName(updated.getName());
    existing.setMnc(updated.getMnc());
    return moduleRepository.save(existing);
  }

  public void deleteModule(Long id) {
    Module module = getModule(id);
    moduleRepository.delete(module);
  }
}
