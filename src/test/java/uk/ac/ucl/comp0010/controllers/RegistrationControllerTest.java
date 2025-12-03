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
import uk.ac.ucl.comp0010.controllers.requests.RegistrationCreateRequest;
import uk.ac.ucl.comp0010.models.Registration;
import uk.ac.ucl.comp0010.services.RegistrationService;

@ExtendWith(MockitoExtension.class)
class RegistrationControllerTest {

  @Mock
  private RegistrationService registrationService;

  private RegistrationController registrationController;

  @BeforeEach
  void setUp() {
    registrationController = new RegistrationController(registrationService);
  }

  @Test
  void endpointsDelegateToService() throws Exception {
    Registration registration = new Registration();
    when(registrationService.getAllRegistrations()).thenReturn(List.of(registration));
    when(registrationService.getRegistration(1L)).thenReturn(registration);
    when(registrationService.register(1L, 2L)).thenReturn(registration);

    RegistrationCreateRequest createRequest = new RegistrationCreateRequest();
    createRequest.setStudentId(1L);
    createRequest.setModuleId(2L);

    assertThat(registrationController.getRegistrations()).containsExactly(registration);
    assertThat(registrationController.getRegistration(1L)).isEqualTo(registration);
    assertThat(registrationController.register(createRequest)).isEqualTo(registration);

    registrationController.unregister(1L, 2L);
    verify(registrationService).unregister(1L, 2L);

    when(registrationService.getRegistrationsForStudent(1L)).thenReturn(List.of());
    when(registrationService.getRegistrationsForModule(2L)).thenReturn(List.of());

    assertThat(registrationController.getRegistrationsForStudent(1L)).isEmpty();
    assertThat(registrationController.getRegistrationsForModule(2L)).isEmpty();
  }
}
