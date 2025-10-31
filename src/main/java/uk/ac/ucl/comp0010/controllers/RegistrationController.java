package uk.ac.ucl.comp0010.controllers;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import uk.ac.ucl.comp0010.controllers.requests.RegistrationRequest;
import uk.ac.ucl.comp0010.exceptions.NoRegistrationException;
import uk.ac.ucl.comp0010.models.Registration;
import uk.ac.ucl.comp0010.services.RegistrationService;

/**
 * REST controller for registration interactions.
 */
@RestController
@RequestMapping("/registrations")
public class RegistrationController {
  private final RegistrationService registrationService;

  public RegistrationController(RegistrationService registrationService) {
    this.registrationService = registrationService;
  }

  @GetMapping
  public List<Registration> getRegistrations() {
    return registrationService.getAllRegistrations();
  }

  @GetMapping("/{id}")
  public Registration getRegistration(@PathVariable Long id) {
    return registrationService.getRegistration(id);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public Registration register(@RequestBody RegistrationRequest request) {
    return registrationService.register(request.getStudentId(), request.getModuleId());
  }

  /**
   * API to delete a registration.
   *
   * @param studentId student identity
   * @param moduleId module identity
   * @throws NoRegistrationException if no registration found
   */
  @DeleteMapping
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void unregister(@RequestParam Long studentId, @RequestParam Long moduleId)
      throws NoRegistrationException {
    registrationService.unregister(studentId, moduleId);
  }

  @GetMapping("/students/{studentId}")
  public List<Registration> getRegistrationsForStudent(@PathVariable Long studentId) {
    return registrationService.getRegistrationsForStudent(studentId);
  }

  @GetMapping("/modules/{moduleId}")
  public List<Registration> getRegistrationsForModule(@PathVariable Long moduleId) {
    return registrationService.getRegistrationsForModule(moduleId);
  }
}
