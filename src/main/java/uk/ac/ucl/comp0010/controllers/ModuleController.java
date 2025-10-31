package uk.ac.ucl.comp0010.controllers;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import uk.ac.ucl.comp0010.models.Grade;
import uk.ac.ucl.comp0010.models.Module;
import uk.ac.ucl.comp0010.models.Registration;
import uk.ac.ucl.comp0010.services.GradeService;
import uk.ac.ucl.comp0010.services.ModuleService;
import uk.ac.ucl.comp0010.services.RegistrationService;

/**
 * REST controller for module operations.
 */
@RestController
@RequestMapping("/modules")
public class ModuleController {
  private final ModuleService moduleService;
  private final RegistrationService registrationService;
  private final GradeService gradeService;

  /**
   * CTR for Module Controller.
   *
   * @param moduleService deps inj
   * @param registrationService deps inj
   * @param gradeService deps inj
   */
  public ModuleController(ModuleService moduleService, RegistrationService registrationService,
      GradeService gradeService) {
    this.moduleService = moduleService;
    this.registrationService = registrationService;
    this.gradeService = gradeService;
  }

  @GetMapping
  public List<Module> getModules() {
    return moduleService.getAllModules();
  }

  @GetMapping("/{id}")
  public Module getModule(@PathVariable Long id) {
    return moduleService.getModule(id);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public Module createModule(@RequestBody Module module) {
    return moduleService.createModule(module);
  }

  @PutMapping("/{id}")
  public Module updateModule(@PathVariable Long id, @RequestBody Module module) {
    return moduleService.updateModule(id, module);
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteModule(@PathVariable Long id) {
    moduleService.deleteModule(id);
  }

  @GetMapping("/{id}/registrations")
  public List<Registration> getRegistrations(@PathVariable Long id) {
    return registrationService.getRegistrationsForModule(id);
  }

  @GetMapping("/{id}/grades")
  public List<Grade> getGrades(@PathVariable Long id) {
    return gradeService.getGradesForModule(id);
  }
}
