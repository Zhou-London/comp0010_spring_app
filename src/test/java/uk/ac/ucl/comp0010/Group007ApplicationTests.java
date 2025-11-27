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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import uk.ac.ucl.comp0010.models.Grade;
import uk.ac.ucl.comp0010.models.Module;
import uk.ac.ucl.comp0010.models.Registration;
import uk.ac.ucl.comp0010.models.Student;
import uk.ac.ucl.comp0010.repositories.GradeRepository;
import uk.ac.ucl.comp0010.repositories.ModuleRepository;
import uk.ac.ucl.comp0010.repositories.RegistrationRepository;
import uk.ac.ucl.comp0010.repositories.StudentRepository;

@SpringBootTest
@AutoConfigureMockMvc
class Group007ApplicationTests {

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
  }

  /**
   * Students Test: Create John.
   *
   * @throws Exception
   */
  @Test
  void testStudentLifecycleEndpoints() throws Exception {
    Long studentId = createStudent();

    mockMvc.perform(get("/students")).andExpect(status().isOk())
        .andExpect(jsonPath("$.length()", org.hamcrest.Matchers.is(1)))
        .andExpect(jsonPath("$[0].id").value(studentId));

    mockMvc.perform(get("/students/" + studentId)).andExpect(status().isOk())
        .andExpect(jsonPath("$.userName").value("user" + studentId));

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
    Long moduleId = createModule();

    mockMvc.perform(get("/modules")).andExpect(status().isOk())
        .andExpect(jsonPath("$.length()", org.hamcrest.Matchers.is(1)))
        .andExpect(jsonPath("$[0].code").value("CODE" + moduleId));

    mockMvc.perform(get("/modules/" + moduleId)).andExpect(status().isOk())
        .andExpect(jsonPath("$.name").value("Module " + moduleId));

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
    Long studentId = createStudent();
    Long moduleId = createModule();

    Long registrationId = registerStudent(studentId, moduleId);

    mockMvc.perform(get("/students/" + studentId + "/registrations")).andExpect(status().isOk())
        .andExpect(jsonPath("$.length()", org.hamcrest.Matchers.is(1)))
        .andExpect(jsonPath("$[0].id").value(registrationId));

    mockMvc.perform(get("/modules/" + moduleId + "/registrations")).andExpect(status().isOk())
        .andExpect(jsonPath("$.length()", org.hamcrest.Matchers.is(1)))
        .andExpect(jsonPath("$[0].student.id").value(studentId));

    mockMvc
        .perform(delete("/students/" + studentId + "/modules/" + moduleId)
            .contentType(MediaType.APPLICATION_JSON).content(passwordBody()))
        .andExpect(status().isNoContent());

    mockMvc.perform(get("/students/" + studentId + "/registrations")).andExpect(status().isOk())
        .andExpect(jsonPath("$.length()", org.hamcrest.Matchers.is(0)));
  }

  /**
   * Registration workflow managed through the registration controller endpoints.
   *
   * @throws Exception
   */
  @Test
  void testRegistrationControllerEndpoints() throws Exception {
    Long studentId = createStudent();
    Long moduleId = createModule();

    Map<String, Object> payload =
        withPassword(Map.of("studentId", studentId, "moduleId", moduleId));

    MvcResult result = mockMvc
        .perform(post("/registrations").contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(payload)))
        .andExpect(status().isCreated()).andReturn();

    Registration registration =
        objectMapper.readValue(result.getResponse().getContentAsString(), Registration.class);

    mockMvc.perform(get("/registrations")).andExpect(status().isOk())
        .andExpect(jsonPath("$.length()", org.hamcrest.Matchers.is(1)));

    mockMvc.perform(get("/registrations/" + registration.getId())).andExpect(status().isOk())
        .andExpect(jsonPath("$.student.id").value(studentId));

    mockMvc.perform(get("/registrations/students/" + studentId)).andExpect(status().isOk())
        .andExpect(jsonPath("$.length()", org.hamcrest.Matchers.is(1)));

    mockMvc.perform(get("/registrations/modules/" + moduleId)).andExpect(status().isOk())
        .andExpect(jsonPath("$.length()", org.hamcrest.Matchers.is(1)));

    mockMvc.perform(delete("/registrations").param("studentId", String.valueOf(studentId))
        .param("moduleId", String.valueOf(moduleId)).contentType(MediaType.APPLICATION_JSON)
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
    Long studentId = createStudent();
    Long moduleId = createModule();
    registerStudent(studentId, moduleId);

    Map<String, Object> gradePayload =
        withPassword(Map.of("studentId", studentId, "moduleId", moduleId, "score", 75));

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

    mockMvc.perform(get("/students/" + studentId + "/grades")).andExpect(status().isOk())
        .andExpect(jsonPath("$.length()", org.hamcrest.Matchers.is(1)))
        .andExpect(jsonPath("$[0].score").value(90));

    mockMvc.perform(get("/modules/" + moduleId + "/grades")).andExpect(status().isOk())
        .andExpect(jsonPath("$.length()", org.hamcrest.Matchers.is(1)));

    mockMvc.perform(get("/students/" + studentId + "/average")).andExpect(status().isOk())
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
    Long studentId = createStudent();
    Long moduleId = createModule();
    registerStudent(studentId, moduleId);

    Map<String, Object> studentGradePayload =
        withPassword(Map.of("moduleId", moduleId, "score", 50));

    MvcResult gradeResult = mockMvc
        .perform(post("/students/" + studentId + "/grades").contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(studentGradePayload)))
        .andExpect(status().isOk()).andReturn();

    Grade recorded =
        objectMapper.readValue(gradeResult.getResponse().getContentAsString(), Grade.class);

    Map<String, Object> upsertPayload =
        withPassword(Map.of("studentId", studentId, "moduleId", moduleId, "score", 65));

    mockMvc
        .perform(post("/grades/upsert").contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(upsertPayload)))
        .andExpect(status().isOk()).andExpect(jsonPath("$.score").value(65));

    mockMvc.perform(get("/grades/" + recorded.getId())).andExpect(status().isOk())
        .andExpect(jsonPath("$.score").value(65));
  }

  private Long createStudent() throws Exception {
    int suffix = sequence.incrementAndGet();
    Map<String, Object> req = withPassword(Map.of("firstName", "First" + suffix, "lastName",
        "Last" + suffix, "userName", "user" + suffix, "email", "user" + suffix + "@example.com"));

    MvcResult result = mockMvc
        .perform(post("/students").contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(req)))
        .andExpect(status().isCreated()).andReturn();

    Student student =
        objectMapper.readValue(result.getResponse().getContentAsString(), Student.class);
    return student.getId();
  }

  private Long createModule() throws Exception {
    int suffix = sequence.incrementAndGet();
    Map<String, Object> req =
        withPassword(Map.of("code", "CODE" + suffix, "name", "Module " + suffix, "mnc", true));

    MvcResult result = mockMvc
        .perform(post("/modules").contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(req)))
        .andExpect(status().isCreated()).andReturn();

    Module module = objectMapper.readValue(result.getResponse().getContentAsString(), Module.class);
    return module.getId();
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
