package uk.ac.ucl.comp0010.services;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.argThat;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import uk.ac.ucl.comp0010.models.OperationEntityType;
import uk.ac.ucl.comp0010.models.OperationLog;
import uk.ac.ucl.comp0010.models.OperationType;
import uk.ac.ucl.comp0010.models.Module;
import uk.ac.ucl.comp0010.models.Registration;
import uk.ac.ucl.comp0010.models.Student;
import uk.ac.ucl.comp0010.repositories.GradeRepository;
import uk.ac.ucl.comp0010.repositories.ModuleRepository;
import uk.ac.ucl.comp0010.repositories.OperationLogRepository;
import uk.ac.ucl.comp0010.repositories.RegistrationRepository;
import uk.ac.ucl.comp0010.repositories.StudentRepository;

@ExtendWith(MockitoExtension.class)
class OperationLogServiceTest {

  @Mock
  private OperationLogRepository operationLogRepository;

  @Mock
  private StudentRepository studentRepository;

  @Mock
  private ModuleRepository moduleRepository;

  @Mock
  private RegistrationRepository registrationRepository;

  @Mock
  private GradeRepository gradeRepository;

  private OperationLogService operationLogService;

  @BeforeEach
  void setUp() {
    operationLogService = new OperationLogService(operationLogRepository, new ObjectMapper(),
        studentRepository, moduleRepository, registrationRepository, gradeRepository);
    SecurityContextHolder.clearContext();
  }

  @AfterEach
  void tearDown() {
    SecurityContextHolder.clearContext();
  }

  @Test
  void logCreationCapturesUsername() {
    SecurityContextHolder.getContext().setAuthentication(
        UsernamePasswordAuthenticationToken.authenticated("admin", null, List.of()));
    Student student = new Student("Ada", "Lovelace", "ada", "ada@example.com");
    student.setId(1L);
    when(operationLogRepository.save(any(OperationLog.class))).thenAnswer(invocation ->
        invocation.getArgument(0, OperationLog.class));

    OperationLog log = operationLogService.logCreation(OperationEntityType.STUDENT, 1L, student,
        "Created student");

    assertThat(log.getUsername()).isEqualTo("admin");
    assertThat(log.getOperationType()).isEqualTo(OperationType.CREATE);
    assertThat(log.getDescription()).contains("Created");
  }

  @Test
  void revertCreateDeletesEntityAndRecordsRevert() {
    OperationLog creationLog = new OperationLog(OperationType.CREATE, OperationEntityType.STUDENT,
        5L, Instant.now(), "admin", "Created student", null, null);
    Student student = new Student("Ada", "Lovelace", "ada", "ada@example.com");
    student.setId(5L);

    when(operationLogRepository.findById(99L)).thenReturn(Optional.of(creationLog));
    when(operationLogRepository.save(any(OperationLog.class))).thenAnswer(invocation ->
        invocation.getArgument(0, OperationLog.class));
    when(studentRepository.findById(5L)).thenReturn(Optional.of(student));

    OperationLog revertLog = operationLogService.revertOperation(99L);

    verify(studentRepository).delete(student);
    assertThat(revertLog.getOperationType()).isEqualTo(OperationType.REVERT);
  }

  @Test
  void revertUpdateRestoresSnapshot() throws JsonProcessingException {
    Student snapshot = new Student("Alan", "Turing", "alan", "alan@example.com");
    snapshot.setId(3L);
    String previousJson = new ObjectMapper().writeValueAsString(snapshot);
    OperationLog updateLog = new OperationLog(OperationType.UPDATE, OperationEntityType.STUDENT,
        3L, Instant.now(), "admin", "Updated student", previousJson, null);

    when(operationLogRepository.findById(2L)).thenReturn(Optional.of(updateLog));
    when(operationLogRepository.save(any(OperationLog.class))).thenAnswer(invocation ->
        invocation.getArgument(0, OperationLog.class));

    operationLogService.revertOperation(2L);

    verify(studentRepository).save(any(Student.class));
  }

  @Test
  void logUpdateSerializesSnapshots() {
    Student before = new Student("Grace", "Hopper", "grace", "grace@example.com");
    before.setId(7L);
    Student after = new Student("Grace", "Hopper", "grace", "new@example.com");
    after.setId(7L);
    when(operationLogRepository.save(any(OperationLog.class))).thenAnswer(invocation ->
        invocation.getArgument(0, OperationLog.class));

    OperationLog log = operationLogService.logUpdate(OperationEntityType.STUDENT, 7L, before,
        after, "Updated student");

    assertThat(log.getPreviousState()).contains("grace@example.com");
    assertThat(log.getNewState()).contains("new@example.com");
  }

  @Test
  void revertDeleteRestoresGradeFromSnapshot() throws JsonProcessingException {
    Student student = new Student("Test", "Student", "test", "test@example.com");
    student.setId(4L);
    Module module = new Module("COMP", "Module", true, "CS");
    module.setId(9L);
    OperationLogService.GradeSnapshot snapshot = new OperationLogService.GradeSnapshot(11L,
        student.getId(), module.getId(), 85);
    String previousJson = new ObjectMapper().writeValueAsString(snapshot);
    OperationLog deleteLog = new OperationLog(OperationType.DELETE, OperationEntityType.GRADE,
        11L, Instant.now(), "admin", "Deleted grade", previousJson, null);

    when(operationLogRepository.findById(12L)).thenReturn(Optional.of(deleteLog));
    when(operationLogRepository.save(any(OperationLog.class))).thenAnswer(invocation ->
        invocation.getArgument(0, OperationLog.class));
    when(studentRepository.findById(student.getId())).thenReturn(Optional.of(student));
    when(moduleRepository.findById(module.getId())).thenReturn(Optional.of(module));

    operationLogService.revertOperation(12L);

    verify(gradeRepository).save(argThat(grade -> grade.getScore() == 85
        && grade.getStudent().getId().equals(student.getId())
        && grade.getModule().getId().equals(module.getId())));
  }

  @Test
  void copyOfReturnsNullForNullInput() {
    assertThat(operationLogService.copyOf(null, Student.class)).isNull();
  }

  @Test
  void revertDeleteRestoresRegistration() throws JsonProcessingException {
    Student student = new Student("Test", "Student", "reguser", "reg@example.com");
    student.setId(22L);
    Module module = new Module("REG1", "Registration", true, "Dept");
    module.setId(33L);
    OperationLogService.RegistrationSnapshot snapshot = new OperationLogService.RegistrationSnapshot(
        44L, student.getId(), module.getId());
    String previousJson = new ObjectMapper().writeValueAsString(snapshot);
    OperationLog deleteLog = new OperationLog(OperationType.DELETE, OperationEntityType.REGISTRATION,
        44L, Instant.now(), "admin", "Deleted registration", previousJson, null);

    when(operationLogRepository.findById(50L)).thenReturn(Optional.of(deleteLog));
    when(operationLogRepository.save(any(OperationLog.class))).thenAnswer(invocation ->
        invocation.getArgument(0, OperationLog.class));
    when(studentRepository.findById(student.getId())).thenReturn(Optional.of(student));
    when(moduleRepository.findById(module.getId())).thenReturn(Optional.of(module));

    operationLogService.revertOperation(50L);

    verify(registrationRepository).save(any(Registration.class));
  }

  @Test
  void logCreationDefaultsUsernameToAnonymous() {
    Student student = new Student("Anon", "User", "anon", "anon@example.com");
    student.setId(99L);
    when(operationLogRepository.save(any(OperationLog.class))).thenAnswer(invocation ->
        invocation.getArgument(0, OperationLog.class));

    OperationLog log = operationLogService.logCreation(OperationEntityType.STUDENT, 99L, student,
        "Created student");

    assertThat(log.getUsername()).isEqualTo("anonymous");
    assertThat(log.getNewState()).contains("anon@example.com");
  }
}
