package uk.ac.ucl.comp0010;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import uk.ac.ucl.comp0010.models.Grade;
import uk.ac.ucl.comp0010.models.Module;
import uk.ac.ucl.comp0010.models.Registration;
import uk.ac.ucl.comp0010.models.Student;
import uk.ac.ucl.comp0010.config.ApiPasswordFilter;
import uk.ac.ucl.comp0010.config.OpenApiPasswordConfig;
import uk.ac.ucl.comp0010.config.SecurityConfig;
import uk.ac.ucl.comp0010.config.WebConfig;
import uk.ac.ucl.comp0010.exceptions.NoRegistrationException;
import uk.ac.ucl.comp0010.exceptions.ResourceConflictException;
import uk.ac.ucl.comp0010.exceptions.ResourceNotFoundException;
import uk.ac.ucl.comp0010.repositories.GradeRepository;
import uk.ac.ucl.comp0010.repositories.ModuleRepository;
import uk.ac.ucl.comp0010.repositories.RegistrationRepository;
import uk.ac.ucl.comp0010.repositories.StudentRepository;
import uk.ac.ucl.comp0010.services.GradeService;
import uk.ac.ucl.comp0010.services.ModuleService;
import uk.ac.ucl.comp0010.services.RegistrationService;
import uk.ac.ucl.comp0010.services.StudentService;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.Operation;
import io.swagger.v3.oas.models.PathItem;
import io.swagger.v3.oas.models.media.Content;
import io.swagger.v3.oas.models.media.ObjectSchema;
import io.swagger.v3.oas.models.media.Schema;
import io.swagger.v3.oas.models.parameters.RequestBody;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import jakarta.servlet.http.HttpServletResponse;

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
  private StudentService studentService;

  @Autowired
  private ModuleService moduleService;

  @Autowired
  private RegistrationService registrationService;

  @Autowired
  private GradeService gradeService;

  private static final String PASSWORD = "team007";

  private final AtomicInteger sequence = new AtomicInteger();

  /**
   * Ensure each test runs against a clean in-memory database.
   */
  @BeforeEach
  void setUp() {
    gradeRepository.deleteAll();
    registrationRepository.deleteAll();
    moduleRepository.deleteAll();
    studentRepository.deleteAll();
    sequence.set(0);
  }

  /**
   * Students Test: Create John.
   *
   * @throws Exception
   */
  @Test
  void testStudentLifecycleEndpoints() throws Exception {
    Student student = createStudent();
    Long studentId = student.getId();

    mockMvc.perform(get("/students")).andExpect(status().isOk())
        .andExpect(jsonPath("$.length()", org.hamcrest.Matchers.is(1)))
        .andExpect(jsonPath("$[0].id").value(studentId));

    mockMvc.perform(get("/students/" + studentId)).andExpect(status().isOk())
        .andExpect(jsonPath("$.userName").value(student.getUserName()));

    Map<String, Object> updatePayload =
        withPassword(Map.of("firstName", "Updated", "lastName", "Name", "userName",
            "updated" + studentId, "email", "updated" + studentId + "@example.com"));

    mockMvc
        .perform(put("/students/" + studentId).contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(updatePayload)))
        .andExpect(status().isOk()).andExpect(jsonPath("$.userName").value("updated" + studentId));

    mockMvc.perform(delete("/students/" + studentId).contentType(MediaType.APPLICATION_JSON)
        .content(passwordBody())).andExpect(status().isNoContent());

    mockMvc.perform(get("/students/" + studentId)).andExpect(status().isNotFound());
  }

  /**
   * Module lifecycle including creation, retrieval, update and deletion.
   *
   * @throws Exception
   */
  @Test
  void testModuleLifecycleEndpoints() throws Exception {
    Module module = createModule();
    Long moduleId = module.getId();

    mockMvc.perform(get("/modules")).andExpect(status().isOk())
        .andExpect(jsonPath("$.length()", org.hamcrest.Matchers.is(1)))
        .andExpect(jsonPath("$[0].code").value(module.getCode()));

    mockMvc.perform(get("/modules/" + moduleId)).andExpect(status().isOk())
        .andExpect(jsonPath("$.name").value(module.getName()));

    Map<String, Object> updatePayload = withPassword(
        Map.of("code", "NEW" + moduleId, "name", "Updated Module " + moduleId, "mnc", false));

    mockMvc
        .perform(put("/modules/" + moduleId).contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(updatePayload)))
        .andExpect(status().isOk()).andExpect(jsonPath("$.code").value("NEW" + moduleId));

    mockMvc.perform(delete("/modules/" + moduleId).contentType(MediaType.APPLICATION_JSON)
        .content(passwordBody())).andExpect(status().isNoContent());

    mockMvc.perform(get("/modules/" + moduleId)).andExpect(status().isNotFound());
  }

  /**
   * Registration workflow managed through the student endpoints.
   *
   * @throws Exception
   */
  @Test
  void testStudentRegistrationEndpoints() throws Exception {
    Student student = createStudent();
    Module module = createModule();

    Long registrationId = registerStudent(student.getId(), module.getId());

    mockMvc.perform(get("/students/" + student.getId() + "/registrations")).andExpect(status().isOk())
        .andExpect(jsonPath("$.length()", org.hamcrest.Matchers.is(1)))
        .andExpect(jsonPath("$[0].id").value(registrationId));

    mockMvc.perform(get("/modules/" + module.getId() + "/registrations")).andExpect(status().isOk())
        .andExpect(jsonPath("$.length()", org.hamcrest.Matchers.is(1)))
        .andExpect(jsonPath("$[0].student.id").value(student.getId()));

    mockMvc
        .perform(delete("/students/" + student.getId() + "/modules/" + module.getId())
            .contentType(MediaType.APPLICATION_JSON).content(passwordBody()))
        .andExpect(status().isNoContent());

    mockMvc.perform(get("/students/" + student.getId() + "/registrations")).andExpect(status().isOk())
        .andExpect(jsonPath("$.length()", org.hamcrest.Matchers.is(0)));
  }

  /**
   * Registration workflow managed through the registration controller endpoints.
   *
   * @throws Exception
   */
  @Test
  void testRegistrationControllerEndpoints() throws Exception {
    Student student = createStudent();
    Module module = createModule();

    Map<String, Object> payload =
        withPassword(Map.of("studentId", student.getId(), "moduleId", module.getId()));

    MvcResult result = mockMvc
        .perform(post("/registrations").contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(payload)))
        .andExpect(status().isCreated()).andReturn();

    Registration registration =
        objectMapper.readValue(result.getResponse().getContentAsString(), Registration.class);

    mockMvc.perform(get("/registrations")).andExpect(status().isOk())
        .andExpect(jsonPath("$.length()", org.hamcrest.Matchers.is(1)));

    mockMvc.perform(get("/registrations/" + registration.getId())).andExpect(status().isOk())
        .andExpect(jsonPath("$.student.id").value(student.getId()));

    mockMvc.perform(get("/registrations/students/" + student.getId())).andExpect(status().isOk())
        .andExpect(jsonPath("$.length()", org.hamcrest.Matchers.is(1)));

    mockMvc.perform(get("/registrations/modules/" + module.getId())).andExpect(status().isOk())
        .andExpect(jsonPath("$.length()", org.hamcrest.Matchers.is(1)));

    mockMvc.perform(delete("/registrations").param("studentId", String.valueOf(student.getId()))
        .param("moduleId", String.valueOf(module.getId())).contentType(MediaType.APPLICATION_JSON)
        .content(passwordBody())).andExpect(status().isNoContent());

    mockMvc.perform(get("/registrations")).andExpect(status().isOk())
        .andExpect(jsonPath("$.length()", org.hamcrest.Matchers.is(0)));
  }

  /**
   * Grade lifecycle including creation, retrieval, update, deletion and average computation.
   *
   * @throws Exception
   */
  @Test
  void testGradeEndpoints() throws Exception {
    Student student = createStudent();
    Module module = createModule();
    registerStudent(student.getId(), module.getId());

    Map<String, Object> gradePayload =
        withPassword(Map.of("studentId", student.getId(), "moduleId", module.getId(), "score", 75));

    MvcResult createResult = mockMvc
        .perform(post("/grades").contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(gradePayload)))
        .andExpect(status().isCreated()).andReturn();

    Grade grade =
        objectMapper.readValue(createResult.getResponse().getContentAsString(), Grade.class);

    mockMvc.perform(get("/grades")).andExpect(status().isOk())
        .andExpect(jsonPath("$.length()", org.hamcrest.Matchers.is(1)));

    mockMvc.perform(get("/grades/" + grade.getId())).andExpect(status().isOk())
        .andExpect(jsonPath("$.score").value(75));

    Map<String, Object> updatePayload = withPassword(Map.of("score", 90));
    mockMvc
        .perform(put("/grades/" + grade.getId()).contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(updatePayload)))
        .andExpect(status().isOk()).andExpect(jsonPath("$.score").value(90));

    mockMvc.perform(get("/students/" + student.getId() + "/grades")).andExpect(status().isOk())
        .andExpect(jsonPath("$.length()", org.hamcrest.Matchers.is(1)))
        .andExpect(jsonPath("$[0].score").value(90));

    mockMvc.perform(get("/modules/" + module.getId() + "/grades")).andExpect(status().isOk())
        .andExpect(jsonPath("$.length()", org.hamcrest.Matchers.is(1)));

    mockMvc.perform(get("/students/" + student.getId() + "/average")).andExpect(status().isOk())
        .andExpect(jsonPath("$.average").value(90.0));

    mockMvc.perform(delete("/grades/" + grade.getId()).contentType(MediaType.APPLICATION_JSON)
        .content(passwordBody())).andExpect(status().isNoContent());

    mockMvc.perform(get("/grades")).andExpect(status().isOk())
        .andExpect(jsonPath("$.length()", org.hamcrest.Matchers.is(0)));
  }

  /**
   * Validate grade upsert and student grade recording endpoints.
   *
   * @throws Exception
   */
  @Test
  void testGradeUpsertAndStudentGradeEndpoints() throws Exception {
    Student student = createStudent();
    Module module = createModule();
    registerStudent(student.getId(), module.getId());

    Map<String, Object> studentGradePayload =
        withPassword(Map.of("moduleId", module.getId(), "score", 50));

    MvcResult gradeResult = mockMvc
        .perform(post("/students/" + student.getId() + "/grades").contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(studentGradePayload)))
        .andExpect(status().isOk()).andReturn();

    Grade recorded =
        objectMapper.readValue(gradeResult.getResponse().getContentAsString(), Grade.class);

    Map<String, Object> upsertPayload =
        withPassword(Map.of("studentId", student.getId(), "moduleId", module.getId(), "score", 65));

    mockMvc
        .perform(post("/grades/upsert").contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(upsertPayload)))
        .andExpect(status().isOk()).andExpect(jsonPath("$.score").value(65));

    mockMvc.perform(get("/grades/" + recorded.getId())).andExpect(status().isOk())
        .andExpect(jsonPath("$.score").value(65));
  }

  /**
   * Ensure accessing a non-existent student yields a not found response.
   *
   * @throws Exception
   */
  @Test
  void testStudentNotFoundExceptionHandled() throws Exception {
    long missingId = 999L;

    mockMvc.perform(get("/students/" + missingId)).andExpect(status().isNotFound())
        .andExpect(jsonPath("$.error").value("Student not found with id " + missingId));
  }

  /**
   * Ensure creating a student with a duplicate username results in a conflict response.
   *
   * @throws Exception
   */
  @Test
  void testStudentConflictExceptionHandled() throws Exception {
    Student existingStudent = createStudent();

    Map<String, Object> duplicatePayload =
        withPassword(Map.of("firstName", "Other", "lastName", "User", "userName",
            existingStudent.getUserName(), "email", "other" + existingStudent.getId() + "@example.com"));

    mockMvc
        .perform(post("/students").contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(duplicatePayload)))
        .andExpect(status().isConflict()).andExpect(
            jsonPath("$.error").value("Username already taken: " + existingStudent.getUserName()));
  }

  /**
   * Ensure StudentService rejects creation when an id is already provided.
   */
  @Test
  void testStudentServiceRejectsPresetIdOnCreate() {
    Student student = new Student("First", "Last", "user", "a@a.com");
    student.setId(99L);

    org.assertj.core.api.Assertions
        .assertThatThrownBy(() -> studentService.createStudent(student))
        .isInstanceOf(ResourceConflictException.class)
        .hasMessageContaining("Student ID must be null");
  }

  /**
   * Verify updating a student with a duplicate email fails validation.
   */
  @Test
  void testStudentServiceUpdateEmailConflict() {
    Student existing = studentRepository.save(new Student("First", "Last", "user", "a@a.com"));
    Student other = studentRepository.save(new Student("Second", "User", "user2", "b@b.com"));

    Student updated = new Student("Second", "User", "user2", "a@a.com");

    org.assertj.core.api.Assertions
        .assertThatThrownBy(() -> studentService.updateStudent(other.getId(), updated))
        .isInstanceOf(ResourceConflictException.class)
        .hasMessageContaining("Email already registered");

    studentRepository.delete(existing);
    studentRepository.delete(other);
  }

  /**
   * Ensure attempting to unregister a student who is not registered for a module results in a bad
   * request response.
   *
   * @throws Exception
   */
  @Test
  void testNoRegistrationExceptionHandled() throws Exception {
    Student student = createStudent();
    Module module = createModule();

    mockMvc
        .perform(delete("/students/" + student.getId() + "/modules/" + module.getId())
            .contentType(MediaType.APPLICATION_JSON).content(passwordBody()))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error").value("Student is not registered for module"));
  }

  /**
   * Verify that requesting an average for a student with no grades triggers a bad request response
   * from the exception handler.
   *
   * @throws Exception
   */
  @Test
  void testAverageWithoutGradesThrowsBadRequest() throws Exception {
    Student student = createStudent();

    mockMvc.perform(get("/students/" + student.getId() + "/average")).andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error").value("Student has no grades recorded"));
  }

  /**
   * Verify that posting without the API password is blocked by the password filter.
   *
   * @throws Exception
   */
  @Test
  void testApiPasswordFilterBlocksMissingPassword() throws Exception {
    mockMvc
        .perform(post("/students").contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of("firstName", "Jane"))))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.error").value("Invalid password"));
  }

  /**
   * Ensure the password filter allows GET requests and rejects malformed or invalid payloads.
   */
  @Test
  void testApiPasswordFilterBranches() throws Exception {
    ApiPasswordFilter filter = new ApiPasswordFilter(PASSWORD, objectMapper);

    MockHttpServletRequest getRequest = new MockHttpServletRequest("GET", "/students");
    MockHttpServletResponse getResponse = new MockHttpServletResponse();
    filter.doFilter(getRequest, getResponse, new MockFilterChain());
    org.assertj.core.api.Assertions
        .assertThat(getResponse.getStatus())
        .isNotEqualTo(HttpServletResponse.SC_UNAUTHORIZED);

    MockHttpServletRequest invalidJsonRequest = new MockHttpServletRequest("POST", "/students");
    invalidJsonRequest.setContent("not-json".getBytes(StandardCharsets.UTF_8));
    MockHttpServletResponse invalidJsonResponse = new MockHttpServletResponse();
    filter.doFilter(invalidJsonRequest, invalidJsonResponse, new MockFilterChain());
    org.assertj.core.api.Assertions
        .assertThat(invalidJsonResponse.getStatus())
        .isEqualTo(HttpServletResponse.SC_UNAUTHORIZED);

    MockHttpServletRequest wrongPasswordRequest = new MockHttpServletRequest("POST", "/students");
    wrongPasswordRequest.setContent("{\"password\":\"wrong\"}".getBytes(StandardCharsets.UTF_8));
    MockHttpServletResponse wrongPasswordResponse = new MockHttpServletResponse();
    filter.doFilter(wrongPasswordRequest, wrongPasswordResponse, new MockFilterChain());
    org.assertj.core.api.Assertions
        .assertThat(wrongPasswordResponse.getStatus())
        .isEqualTo(HttpServletResponse.SC_UNAUTHORIZED);
  }

  /**
   * Validate that CORS configuration allows all origins and methods as configured.
   */
  @Test
  void testSecurityConfigCorsSetup() {
    SecurityConfig securityConfig = new SecurityConfig();
    CorsConfigurationSource source = securityConfig.corsConfigurationSource();
    CorsConfiguration config = source.getCorsConfiguration(new MockHttpServletRequest());

    org.assertj.core.api.Assertions.assertThat(config.getAllowedOriginPatterns()).contains("*");
    org.assertj.core.api.Assertions.assertThat(config.getAllowedMethods()).contains("*");
    org.assertj.core.api.Assertions.assertThat(config.getAllowedHeaders()).contains("*");
    org.assertj.core.api.Assertions.assertThat(config.getAllowCredentials()).isFalse();
  }

  /**
   * Ensure the web configuration registers expected CORS mappings.
   */
  @Test
  void testWebConfigCorsMapping() {
    WebConfig webConfig = new WebConfig();
    CorsRegistrySpy spyRegistry = new CorsRegistrySpy();
    webConfig.addCorsMappings(spyRegistry);

    org.assertj.core.api.Assertions.assertThat(spyRegistry.getMappings()).isEqualTo("/**");
    org.assertj.core.api.Assertions.assertThat(spyRegistry.getAllowedOrigins())
        .containsExactlyInAnyOrder("http://localhost:5173", "http://127.0.0.1:5173");
    org.assertj.core.api.Assertions.assertThat(spyRegistry.getAllowedMethods()).contains("GET",
        "POST", "PUT", "DELETE", "OPTIONS", "PATCH");
  }

  /**
   * Confirm OpenAPI customiser injects the password field into non-GET request schemas.
   */
  @Test
  void testOpenApiPasswordCustomizerAddsField() {
    OpenApiPasswordConfig config = new OpenApiPasswordConfig();
    OpenAPI openApi = new OpenAPI();
    Content content = new Content();
    io.swagger.v3.oas.models.media.MediaType mediaType =
        new io.swagger.v3.oas.models.media.MediaType();
    mediaType.setSchema(new ObjectSchema());
    content.addMediaType(MediaType.APPLICATION_JSON_VALUE, mediaType);
    RequestBody requestBody = new RequestBody();
    requestBody.setContent(content);

    Operation postOperation = new Operation();
    postOperation.setRequestBody(requestBody);

    PathItem pathItem = new PathItem();
    pathItem.operation(PathItem.HttpMethod.POST, postOperation);
    openApi.path("/students", pathItem);

    config.passwordFieldCustomiser().customise(openApi);

    Schema<?> schema = openApi.getPaths().get("/students").getPost().getRequestBody().getContent()
        .get(MediaType.APPLICATION_JSON_VALUE).getSchema();

    org.assertj.core.api.Assertions.assertThat(schema.getProperties()).containsKey("password");
  }

  /**
   * Ensure OpenAPI customiser handles references and null paths gracefully.
   */
  @Test
  void testOpenApiPasswordCustomizerReferenceAndNullPaths() {
    OpenApiPasswordConfig config = new OpenApiPasswordConfig();

    OpenAPI noPaths = new OpenAPI();
    config.passwordFieldCustomiser().customise(noPaths);
    org.assertj.core.api.Assertions.assertThat(noPaths.getPaths()).isNull();

    OpenAPI referencedSchemaApi = new OpenAPI();
    RequestBody requestBody = new RequestBody();
    Content content = new Content();
    io.swagger.v3.oas.models.media.MediaType mediaType =
        new io.swagger.v3.oas.models.media.MediaType();
    mediaType.setSchema(new ObjectSchema().$ref("#/components/schemas/Student"));
    content.addMediaType(MediaType.APPLICATION_JSON_VALUE, mediaType);
    requestBody.setContent(content);

    Operation patchOperation = new Operation();
    patchOperation.setRequestBody(requestBody);

    PathItem nullPathItem = new PathItem();
    nullPathItem.operation(PathItem.HttpMethod.PATCH, patchOperation);
    referencedSchemaApi.setPaths(new io.swagger.v3.oas.models.Paths());
    referencedSchemaApi.getPaths().addPathItem("/students/{id}", null);
    referencedSchemaApi.getPaths().addPathItem("/students", nullPathItem);

    config.passwordFieldCustomiser().customise(referencedSchemaApi);

    Schema<?> schema = referencedSchemaApi.getPaths().get("/students").getPatch().getRequestBody()
        .getContent().get(MediaType.APPLICATION_JSON_VALUE).getSchema();

    org.assertj.core.api.Assertions.assertThat(schema).isInstanceOf(io.swagger.v3.oas.models.media.ComposedSchema.class);
    org.assertj.core.api.Assertions.assertThat(((io.swagger.v3.oas.models.media.ComposedSchema) schema)
        .getAllOf()).hasSize(2);
  }

  /**
   * Validate model constructors and setters populate fields as expected.
   */
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

  /**
   * Ensure StudentService enforces uniqueness constraints.
   */
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

  /**
   * Validate student registration and unregistration through the service layer.
   */
  @Test
  void testStudentServiceRegistrationBranches() throws Exception {
    Student student = studentService.createStudent(new Student("First", "Last", "user", "a@a.com"));
    Module module = moduleService.createModule(new Module("CODE1", "Module", true));

    Registration registration = studentService.registerStudentToModule(student.getId(), module.getId());
    org.assertj.core.api.Assertions.assertThat(registration.getId()).isNotNull();

    org.assertj.core.api.Assertions
        .assertThatThrownBy(() -> studentService.registerStudentToModule(student.getId(), module.getId()))
        .isInstanceOf(ResourceConflictException.class)
        .hasMessageContaining("Student already registered for module");

    studentService.unregisterStudentFromModule(student.getId(), module.getId());

    org.assertj.core.api.Assertions
        .assertThatThrownBy(() -> studentService.unregisterStudentFromModule(student.getId(), module.getId()))
        .isInstanceOf(NoRegistrationException.class)
        .hasMessageContaining("Student is not registered for module");
  }

  /**
   * Validate module update rejects conflicting codes.
   */
  @Test
  void testModuleServiceUpdateConflict() {
    Module existing = moduleRepository.save(new Module("CODE1", "Name", true));
    Module other = moduleRepository.save(new Module("CODE2", "Name2", false));

    Module updated = new Module("CODE2", "Updated", false);

    org.assertj.core.api.Assertions
        .assertThatThrownBy(() -> moduleService.updateModule(existing.getId(), updated))
        .isInstanceOf(ResourceConflictException.class)
        .hasMessageContaining("Module code already exists");

    moduleRepository.delete(existing);
    moduleRepository.delete(other);
  }

  /**
   * Ensure module creation rejects preset identifiers and conflicting codes.
   */
  @Test
  void testModuleServiceCreationValidation() {
    Module presetId = new Module("CODE3", "Preset", false);
    presetId.setId(5L);

    org.assertj.core.api.Assertions
        .assertThatThrownBy(() -> moduleService.createModule(presetId))
        .isInstanceOf(ResourceConflictException.class)
        .hasMessageContaining("Module ID must be null");

    moduleRepository.save(new Module("CODE4", "Existing", true));

    org.assertj.core.api.Assertions
        .assertThatThrownBy(() -> moduleService.createModule(new Module("CODE4", "Dup", true)))
        .isInstanceOf(ResourceConflictException.class)
        .hasMessageContaining("Module code already exists");
  }

  /**
   * Validate registration service guards against missing identifiers and duplicates.
   * @throws NoRegistrationException 
   */
  @Test
  void testRegistrationServiceValidationPaths() throws NoRegistrationException {
    org.assertj.core.api.Assertions
        .assertThatThrownBy(() -> registrationService.register(null, 1L))
        .isInstanceOf(ResourceNotFoundException.class)
        .hasMessageContaining("No Student or Module provided");

    org.assertj.core.api.Assertions
        .assertThatThrownBy(() -> registrationService.register(1L, null))
        .isInstanceOf(ResourceNotFoundException.class)
        .hasMessageContaining("No Student or Module provided");

    Student student = studentRepository.save(new Student("First", "Last", "user", "a@a.com"));
    Module module = moduleRepository.save(new Module("CODEX", "Name", true));

    registrationService.register(student.getId(), module.getId());

    org.assertj.core.api.Assertions
        .assertThatThrownBy(() -> registrationService.register(student.getId(), module.getId()))
        .isInstanceOf(ResourceConflictException.class)
        .hasMessageContaining("Student already registered for module");

    org.assertj.core.api.Assertions
        .assertThatThrownBy(() -> registrationService.unregister(student.getId(), module.getId() + 1))
        .isInstanceOf(ResourceNotFoundException.class)
        .hasMessageContaining("Module not found with id");

    registrationService.unregister(student.getId(), module.getId());

    org.assertj.core.api.Assertions
        .assertThatThrownBy(() -> registrationService.unregister(student.getId(), module.getId()))
        .isInstanceOf(NoRegistrationException.class)
        .hasMessageContaining("Student is not registered for module");
  }

  /**
   * Ensure grade creation and average computation work through service layer.
   */
  @Test
  void testServiceLayerGradeAverageFlow() throws NoRegistrationException {
    Student student = studentRepository.save(new Student("First", "Last", "user", "a@a.com"));
    Module module = moduleRepository.save(new Module("CODE1", "Name", true));
    registrationService.register(student.getId(), module.getId());

    gradeService.createGrade(student.getId(), module.getId(), 70);
    gradeService.upsertGrade(student.getId(), module.getId(), 90);

    double average = 0.0;
    try {
      average = studentService.computeAverage(student.getId());
    } catch (Exception e) {
      org.assertj.core.api.Assertions.fail("Exception should not be thrown: " + e.getMessage());
    }

    org.assertj.core.api.Assertions.assertThat(average).isEqualTo(90.0);
  }

  /**
   * Ensure grade service enforces identifiers and registration checks.
   */
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

  /**
   * Helper registry spy to capture configuration performed by WebConfig.
   */
  private static class CorsRegistrySpy
      extends org.springframework.web.servlet.config.annotation.CorsRegistry {
    private String mapping;
    private String[] origins;
    private String[] methods;

    @SuppressWarnings("null")
    @Override
    public org.springframework.web.servlet.config.annotation.CorsRegistration addMapping(
        String pathPattern) {
      this.mapping = pathPattern;
      return new org.springframework.web.servlet.config.annotation.CorsRegistration(pathPattern) {
        @SuppressWarnings("null")
        @Override
        public org.springframework.web.servlet.config.annotation.CorsRegistration allowedOrigins(
            String... origins) {
          CorsRegistrySpy.this.origins = origins;
          return super.allowedOrigins(origins);
        }

        @SuppressWarnings("null")
        @Override
        public org.springframework.web.servlet.config.annotation.CorsRegistration allowedMethods(
            String... methods) {
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

  private Student createStudent() throws Exception {
    int suffix = sequence.incrementAndGet();
    Map<String, Object> req = withPassword(Map.of("firstName", "First" + suffix, "lastName",
        "Last" + suffix, "userName", "user" + suffix, "email", "user" + suffix + "@example.com"));

    MvcResult result = mockMvc
        .perform(post("/students").contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(req)))
        .andExpect(status().isCreated()).andReturn();

    return objectMapper.readValue(result.getResponse().getContentAsString(), Student.class);
  }

  private Module createModule() throws Exception {
    int suffix = sequence.incrementAndGet();
    Map<String, Object> req =
        withPassword(Map.of("code", "CODE" + suffix, "name", "Module " + suffix, "mnc", true));

    MvcResult result = mockMvc
        .perform(post("/modules").contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(req)))
        .andExpect(status().isCreated()).andReturn();

    return objectMapper.readValue(result.getResponse().getContentAsString(), Module.class);
  }

  private Long registerStudent(Long studentId, Long moduleId) throws Exception {
    MvcResult result = mockMvc
        .perform(post("/students/" + studentId + "/modules/" + moduleId)
            .contentType(MediaType.APPLICATION_JSON).content(passwordBody()))
        .andExpect(status().isOk()).andReturn();

    Registration registration = objectMapper.readValue(result.getResponse().getContentAsString(),
        new TypeReference<Registration>() {});
    return registration.getId();
  }

  private Map<String, Object> withPassword(Map<String, Object> payload) {
    Map<String, Object> merged = new HashMap<>(payload);
    merged.put("password", PASSWORD);
    return merged;
  }

  private String passwordBody() throws Exception {
    return objectMapper.writeValueAsString(Map.of("password", PASSWORD));
  }
}
