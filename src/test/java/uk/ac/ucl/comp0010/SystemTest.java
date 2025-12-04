package uk.ac.ucl.comp0010;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import uk.ac.ucl.comp0010.config.AuthTokenFilter;
import uk.ac.ucl.comp0010.config.RequestLoggingInterceptor;
import uk.ac.ucl.comp0010.config.SecurityConfig;
import uk.ac.ucl.comp0010.config.WebConfig;
import uk.ac.ucl.comp0010.exceptions.NoRegistrationException;
import uk.ac.ucl.comp0010.exceptions.ResourceConflictException;
import uk.ac.ucl.comp0010.exceptions.ResourceNotFoundException;
import uk.ac.ucl.comp0010.models.Grade;
import uk.ac.ucl.comp0010.models.Module;
import uk.ac.ucl.comp0010.models.Registration;
import uk.ac.ucl.comp0010.models.Student;
import uk.ac.ucl.comp0010.models.UserAccount;
import uk.ac.ucl.comp0010.repositories.GradeRepository;
import uk.ac.ucl.comp0010.repositories.ModuleRepository;
import uk.ac.ucl.comp0010.repositories.RegistrationRepository;
import uk.ac.ucl.comp0010.repositories.StudentRepository;
import uk.ac.ucl.comp0010.repositories.UserAccountRepository;
import uk.ac.ucl.comp0010.services.GradeService;
import uk.ac.ucl.comp0010.services.ModuleService;
import uk.ac.ucl.comp0010.services.StudentService;
import uk.ac.ucl.comp0010.services.UserService;

/**
 * System level tests covering the primary REST workflows and authentication gate.
 */
@SpringBootTest
@AutoConfigureMockMvc
class SystemTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private ObjectMapper objectMapper;

  @Autowired
  private StudentRepository studentRepository;

  @Autowired
  private ModuleRepository moduleRepository;

  @Autowired
  private RegistrationRepository registrationRepository;

  @Autowired
  private GradeRepository gradeRepository;

  @Autowired
  private UserAccountRepository userAccountRepository;

  @Autowired
  private StudentService studentService;

  @Autowired
  private ModuleService moduleService;

  @Autowired
  private GradeService gradeService;

  @Autowired
  private UserService userService;

  private static final String PASSWORD = "hunter2";
  private static final String USERNAME = "tester";

  private final AtomicInteger sequence = new AtomicInteger();
  private String bearerToken;

  /**
   * Ensure each test runs against a clean in-memory database with a fresh user token.
   */
  @BeforeEach
  void setUp() {
    gradeRepository.deleteAll();
    registrationRepository.deleteAll();
    moduleRepository.deleteAll();
    studentRepository.deleteAll();
    userAccountRepository.deleteAll();

    UserAccount account = userService.register(USERNAME + sequence.incrementAndGet(), PASSWORD);
    bearerToken = account.getAuthToken();
  }

  @Test
  void testStudentLifecycleEndpoints() throws Exception {
    Student student = createStudent();
    Long studentId = student.getId();

    mockMvc.perform(get("/api/students")).andExpect(status().isOk())
        .andExpect(jsonPath("$.length()", org.hamcrest.Matchers.is(1)))
        .andExpect(jsonPath("$[0].id").value(studentId));

    mockMvc.perform(get("/api/students/" + studentId)).andExpect(status().isOk())
        .andExpect(jsonPath("$.userName").value(student.getUserName()));

    Map<String, Object> updatePayload = Map.of("firstName", "Updated", "lastName", "Name",
        "userName", "updated" + studentId, "email", "updated" + studentId + "@example.com");

    mockMvc
        .perform(authorized(put("/api/students/" + studentId).contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(updatePayload))))
        .andExpect(status().isOk()).andExpect(jsonPath("$.userName").value("updated" + studentId));

    mockMvc.perform(authorized(delete("/api/students/" + studentId))).andExpect(status().isNoContent());

    mockMvc.perform(get("/api/students/" + studentId)).andExpect(status().isNotFound());
  }

  @Test
  void testModuleLifecycleEndpoints() throws Exception {
    Module module = createModule();
    Long moduleId = module.getId();

    mockMvc.perform(get("/api/modules")).andExpect(status().isOk())
        .andExpect(jsonPath("$.length()", org.hamcrest.Matchers.is(1)))
        .andExpect(jsonPath("$[0].code").value(module.getCode()));

    mockMvc.perform(get("/api/modules/" + moduleId)).andExpect(status().isOk())
        .andExpect(jsonPath("$.name").value(module.getName()));

    Map<String, Object> updatePayload =
        Map.of("code", "NEW" + moduleId, "name", "Updated Module " + moduleId, "mnc", false);

    mockMvc
        .perform(authorized(put("/api/modules/" + moduleId).contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(updatePayload))))
        .andExpect(status().isOk()).andExpect(jsonPath("$.code").value("NEW" + moduleId));

    mockMvc.perform(authorized(delete("/api/modules/" + moduleId))).andExpect(status().isNoContent());

    mockMvc.perform(get("/api/modules/" + moduleId)).andExpect(status().isNotFound());
  }

  @Test
  void testRegistrationControllerEndpoints() throws Exception {
    Student student = createStudent();
    Module module = createModule();

    Map<String, Object> payload = Map.of("studentId", student.getId(), "moduleId", module.getId());

    MvcResult result = mockMvc
        .perform(authorized(post("/api/registrations").contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(payload))))
        .andExpect(status().isCreated()).andReturn();

    Registration registration =
        objectMapper.readValue(result.getResponse().getContentAsString(), Registration.class);

    mockMvc.perform(get("/api/registrations")).andExpect(status().isOk())
        .andExpect(jsonPath("$.length()", org.hamcrest.Matchers.is(1)));

    mockMvc.perform(get("/api/registrations/" + registration.getId())).andExpect(status().isOk())
        .andExpect(jsonPath("$.student.id").value(student.getId()));

    mockMvc.perform(get("/api/registrations/students/" + student.getId())).andExpect(status().isOk())
        .andExpect(jsonPath("$.length()", org.hamcrest.Matchers.is(1)));

    mockMvc.perform(get("/api/registrations/modules/" + module.getId())).andExpect(status().isOk())
        .andExpect(jsonPath("$.length()", org.hamcrest.Matchers.is(1)));

    mockMvc
        .perform(authorized(delete("/api/registrations").param("studentId", String.valueOf(student.getId()))
            .param("moduleId", String.valueOf(module.getId()))))
        .andExpect(status().isNoContent());

    mockMvc.perform(get("/api/registrations")).andExpect(status().isOk())
        .andExpect(jsonPath("$.length()", org.hamcrest.Matchers.is(0)));
  }

  @Test
  void testGradeEndpoints() throws Exception {
    Student student = createStudent();
    Module module = createModule();
    registerStudent(student.getId(), module.getId());

    Map<String, Object> gradePayload = Map.of("studentId", student.getId(), "moduleId", module.getId(),
        "score", 75);

    MvcResult createResult = mockMvc
        .perform(authorized(post("/api/grades").contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(gradePayload))))
        .andExpect(status().isCreated()).andReturn();

    Grade grade =
        objectMapper.readValue(createResult.getResponse().getContentAsString(), Grade.class);

    mockMvc.perform(get("/api/grades")).andExpect(status().isOk())
        .andExpect(jsonPath("$.length()", org.hamcrest.Matchers.is(1)));

    mockMvc.perform(get("/api/grades/" + grade.getId())).andExpect(status().isOk())
        .andExpect(jsonPath("$.score").value(75));

    Map<String, Object> updatePayload = Map.of("score", 90);
    mockMvc
        .perform(authorized(put("/api/grades/" + grade.getId()).contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(updatePayload))))
        .andExpect(status().isOk()).andExpect(jsonPath("$.score").value(90));

    mockMvc.perform(get("/api/students/" + student.getId() + "/grades")).andExpect(status().isOk())
        .andExpect(jsonPath("$.length()", org.hamcrest.Matchers.is(1)))
        .andExpect(jsonPath("$[0].score").value(90));

    mockMvc.perform(get("/api/modules/" + module.getId() + "/grades")).andExpect(status().isOk())
        .andExpect(jsonPath("$.length()", org.hamcrest.Matchers.is(1)));

    mockMvc.perform(get("/api/students/" + student.getId() + "/average")).andExpect(status().isOk())
        .andExpect(jsonPath("$.average").value(90.0));

    mockMvc.perform(authorized(delete("/api/grades/" + grade.getId()))).andExpect(status().isNoContent());

    mockMvc.perform(get("/api/grades")).andExpect(status().isOk())
        .andExpect(jsonPath("$.length()", org.hamcrest.Matchers.is(0)));
  }

  @Test
  void testAverageWithoutGradesThrowsBadRequest() throws Exception {
    Student student = createStudent();

    mockMvc.perform(get("/api/students/" + student.getId() + "/average"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error").value("Student has no grades recorded"));
  }

  @Test
  void testUnauthorizedWriteRequestsBlocked() throws Exception {
    mockMvc
        .perform(post("/api/students").contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of("firstName", "Jane"))))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.error").value("Unauthorized"));
  }

  @Test
  void testAuthEndpointsIssueTokens() throws Exception {
    Map<String, Object> registerPayload = Map.of("username", "newuser", "password", "pass123");

    mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(registerPayload))).andExpect(status().isCreated())
        .andExpect(jsonPath("$.token").isNotEmpty());

    Map<String, Object> loginPayload = Map.of("username", registerPayload.get("username"),
        "password", registerPayload.get("password"));

    mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(loginPayload))).andExpect(status().isOk())
        .andExpect(jsonPath("$.token").isNotEmpty());
  }

  @Test
  void testSecurityConfigCorsSetup() {
    AuthTokenFilter filter = new AuthTokenFilter(Mockito.mock(UserService.class));
    SecurityConfig securityConfig = new SecurityConfig(filter);
    var source = securityConfig.corsConfigurationSource();
    var config = source.getCorsConfiguration(new org.springframework.mock.web.MockHttpServletRequest());

    org.assertj.core.api.Assertions.assertThat(config.getAllowedOriginPatterns()).contains("*");
    org.assertj.core.api.Assertions.assertThat(config.getAllowedMethods()).contains("*");
    org.assertj.core.api.Assertions.assertThat(config.getAllowedHeaders()).contains("*");
    org.assertj.core.api.Assertions.assertThat(config.getAllowCredentials()).isFalse();
  }

  @Test
  void testWebConfigCorsMapping() {
    WebConfig webConfig = new WebConfig(new RequestLoggingInterceptor());
    CorsRegistrySpy spyRegistry = new CorsRegistrySpy();
    webConfig.addCorsMappings(spyRegistry);

    org.assertj.core.api.Assertions.assertThat(spyRegistry.getMappings()).isEqualTo("/**");
    org.assertj.core.api.Assertions.assertThat(spyRegistry.getAllowedOrigins())
        .containsExactlyInAnyOrder("http://localhost:5173", "http://127.0.0.1:5173");
    org.assertj.core.api.Assertions.assertThat(spyRegistry.getAllowedMethods()).contains("GET",
        "POST", "PUT", "DELETE", "OPTIONS", "PATCH");
  }

  @Test
  void testModelMutators() {
    Student student = new Student("First", "Last", "user", "email@example.com");
    student.setId(10L);
    student.setFirstName("NewFirst");
    student.setLastName("NewLast");
    student.setUserName("newUser");
    student.setEmail("new@example.com");

    Module module = new Module("CODE", "Name", true);
    module.setId(5L);
    module.setCode("NEWCODE");
    module.setName("NewName");
    module.setMnc(false);

    Registration registration = new Registration(student, module);
    registration.setId(7L);

    Grade grade = new Grade(student, module, 80);
    grade.setId(3L);
    grade.setScore(90);

    org.assertj.core.api.Assertions.assertThat(student.getId()).isEqualTo(10L);
    org.assertj.core.api.Assertions.assertThat(student.getFirstName()).isEqualTo("NewFirst");
    org.assertj.core.api.Assertions.assertThat(student.getLastName()).isEqualTo("NewLast");
    org.assertj.core.api.Assertions.assertThat(student.getUserName()).isEqualTo("newUser");
    org.assertj.core.api.Assertions.assertThat(student.getEmail()).isEqualTo("new@example.com");

    org.assertj.core.api.Assertions.assertThat(module.getId()).isEqualTo(5L);
    org.assertj.core.api.Assertions.assertThat(module.getCode()).isEqualTo("NEWCODE");
    org.assertj.core.api.Assertions.assertThat(module.getName()).isEqualTo("NewName");
    org.assertj.core.api.Assertions.assertThat(module.getMnc()).isFalse();

    org.assertj.core.api.Assertions.assertThat(registration.getId()).isEqualTo(7L);
    org.assertj.core.api.Assertions.assertThat(registration.getStudent()).isEqualTo(student);
    org.assertj.core.api.Assertions.assertThat(registration.getModule()).isEqualTo(module);

    org.assertj.core.api.Assertions.assertThat(grade.getId()).isEqualTo(3L);
    org.assertj.core.api.Assertions.assertThat(grade.getScore()).isEqualTo(90);
    org.assertj.core.api.Assertions.assertThat(grade.getStudent()).isEqualTo(student);
    org.assertj.core.api.Assertions.assertThat(grade.getModule()).isEqualTo(module);
  }

  @Test
  void testStudentServiceDuplicateUsernameThrowsConflict() {
    Student first = studentRepository.save(new Student("First", "Last", "user", "a@a.com"));
    Student duplicate = new Student("Other", "User", "user", "b@b.com");

    org.assertj.core.api.Assertions
        .assertThatThrownBy(() -> studentService.createStudent(duplicate))
        .isInstanceOf(ResourceConflictException.class)
        .hasMessageContaining("Username already taken");

    studentRepository.delete(first);
  }

  @Test
  void testStudentServiceRegistrationBranches() throws Exception {
    Student student = studentService.createStudent(new Student("First", "Last", "user", "a@a.com"));
    Module module = moduleService.createModule(new Module("CODE1", "Module", true));

    Registration registration =
        studentService.registerStudentToModule(student.getId(), module.getId());
    org.assertj.core.api.Assertions.assertThat(registration.getId()).isNotNull();

    org.assertj.core.api.Assertions
        .assertThatThrownBy(() -> studentService.registerStudentToModule(student.getId(), module.getId()))
        .isInstanceOf(ResourceConflictException.class);

    studentService.unregisterStudentFromModule(student.getId(), module.getId());

    org.assertj.core.api.Assertions
        .assertThatThrownBy(() -> studentService.unregisterStudentFromModule(student.getId(), module.getId()))
        .isInstanceOf(NoRegistrationException.class);
  }

  @Test
  void testGradeServiceValidationBranches() {
    org.assertj.core.api.Assertions
        .assertThatThrownBy(() -> gradeService.createGrade(null, null, 50))
        .isInstanceOf(NoRegistrationException.class)
        .hasMessageContaining("No Student or Module provided");

    Student student = studentRepository.save(new Student("First", "Last", "user", "a@a.com"));
    Module module = moduleRepository.save(new Module("CODE3", "Module", true));

    org.assertj.core.api.Assertions
        .assertThatThrownBy(() -> gradeService.upsertGrade(student.getId(), module.getId(), 80))
        .isInstanceOf(NoRegistrationException.class)
        .hasMessageContaining("Student must be registered before receiving a grade");
  }

  @Test
  void testUserServiceLoginValidation() {
    userService.register("demo", "secret");
    org.assertj.core.api.Assertions
        .assertThatThrownBy(() -> userService.login("demo", "wrong"))
        .isInstanceOf(ResourceConflictException.class)
        .hasMessageContaining("Invalid credentials");

    org.assertj.core.api.Assertions
        .assertThatThrownBy(() -> userService.login("missing", "secret"))
        .isInstanceOf(ResourceNotFoundException.class);
  }

  private Student createStudent() throws Exception {
    int suffix = sequence.incrementAndGet();
    Map<String, Object> req = new HashMap<>();
    req.put("firstName", "First" + suffix);
    req.put("lastName", "Last" + suffix);
    req.put("userName", "user" + suffix);
    req.put("email", "user" + suffix + "@example.com");

    MvcResult result = mockMvc
        .perform(authorized(post("/api/students").contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(req))))
        .andExpect(status().isCreated()).andReturn();

    return objectMapper.readValue(result.getResponse().getContentAsString(), Student.class);
  }

  private Module createModule() throws Exception {
    int suffix = sequence.incrementAndGet();
    Map<String, Object> req = Map.of("code", "CODE" + suffix, "name", "Module " + suffix, "mnc", true);

    MvcResult result = mockMvc
        .perform(authorized(post("/api/modules").contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(req))))
        .andExpect(status().isCreated()).andReturn();

    return objectMapper.readValue(result.getResponse().getContentAsString(), Module.class);
  }

  private Long registerStudent(Long studentId, Long moduleId) throws Exception {
    MvcResult result = mockMvc
        .perform(authorized(post("/api/students/" + studentId + "/modules/" + moduleId)))
        .andExpect(status().isOk()).andReturn();

    Registration registration = objectMapper.readValue(result.getResponse().getContentAsString(),
        new TypeReference<Registration>() {});
    return registration.getId();
  }

  private MockHttpServletRequestBuilder authorized(MockHttpServletRequestBuilder builder) {
    return builder.header("Authorization", "Bearer " + bearerToken);
  }

  /**
   * Helper registry spy to capture configuration performed by WebConfig.
   */
  private static class CorsRegistrySpy extends org.springframework.web.servlet.config.annotation.CorsRegistry {
    private String mapping;
    private String[] origins;
    private String[] methods;

    @SuppressWarnings("null")
    @Override
    public org.springframework.web.servlet.config.annotation.CorsRegistration addMapping(String pathPattern) {
      this.mapping = pathPattern;
      return new org.springframework.web.servlet.config.annotation.CorsRegistration(pathPattern) {
        @SuppressWarnings("null")
        @Override
        public org.springframework.web.servlet.config.annotation.CorsRegistration allowedOrigins(String... origins) {
          CorsRegistrySpy.this.origins = origins;
          return super.allowedOrigins(origins);
        }

        @SuppressWarnings("null")
        @Override
        public org.springframework.web.servlet.config.annotation.CorsRegistration allowedMethods(String... methods) {
          CorsRegistrySpy.this.methods = methods;
          return super.allowedMethods(methods);
        }
      };
    }

    String getMappings() {
      return mapping;
    }

    String[] getAllowedOrigins() {
      return origins;
    }

    String[] getAllowedMethods() {
      return methods;
    }
  }
}
