package uk.ac.ucl.comp0010.services;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

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
import uk.ac.ucl.comp0010.exceptions.ResourceNotFoundException;
import uk.ac.ucl.comp0010.models.Grade;
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

  @Test
  void revertOperationThrowsForUnsupportedType() {
    OperationLog revertLog = new OperationLog(OperationType.REVERT, OperationEntityType.STUDENT,
        1L, Instant.now(), "admin", "Already reverted", null, null);
    when(operationLogRepository.findById(77L)).thenReturn(Optional.of(revertLog));

    assertThatThrownBy(() -> operationLogService.revertOperation(77L))
        .isInstanceOf(ResourceNotFoundException.class)
        .hasMessageContaining("cannot be reverted");
  }

  @Test
  void revertCreateHandlesModuleRegistrationAndGradeDeletes() {
    Module module = new Module("DEL", "Delete me", true, "CS");
    module.setId(200L);
    Registration registration = new Registration(new Student(), module);
    registration.setId(300L);
    Grade grade = new Grade(new Student(), module, 70);
    grade.setId(400L);

    OperationLog moduleLog = new OperationLog(OperationType.CREATE, OperationEntityType.MODULE,
        module.getId(), Instant.now(), "admin", "Created module", null, null);
    OperationLog regLog = new OperationLog(OperationType.CREATE, OperationEntityType.REGISTRATION,
        registration.getId(), Instant.now(), "admin", "Created registration", null, null);
    OperationLog gradeLog = new OperationLog(OperationType.CREATE, OperationEntityType.GRADE,
        grade.getId(), Instant.now(), "admin", "Created grade", null, null);

    when(operationLogRepository.findById(1L)).thenReturn(Optional.of(moduleLog));
    when(operationLogRepository.findById(2L)).thenReturn(Optional.of(regLog));
    when(operationLogRepository.findById(3L)).thenReturn(Optional.of(gradeLog));
    when(operationLogRepository.save(any(OperationLog.class))).thenAnswer(invocation ->
        invocation.getArgument(0, OperationLog.class));

    when(moduleRepository.findById(module.getId())).thenReturn(Optional.of(module));
    when(registrationRepository.findById(registration.getId())).thenReturn(Optional.of(registration));
    when(gradeRepository.findById(grade.getId())).thenReturn(Optional.of(grade));

    operationLogService.revertOperation(1L);
    operationLogService.revertOperation(2L);
    operationLogService.revertOperation(3L);

    verify(moduleRepository).delete(module);
    verify(registrationRepository).delete(registration);
    verify(gradeRepository).delete(grade);
  }

  @Test
  void revertUpdateRestoresModuleRegistrationAndGrade() throws JsonProcessingException {
    Module moduleSnapshot = new Module("UPD", "Updated", true, "Dept");
    moduleSnapshot.setId(10L);
    OperationLog moduleUpdate = new OperationLog(OperationType.UPDATE, OperationEntityType.MODULE,
        moduleSnapshot.getId(), Instant.now(), "admin", "Update module",
        new ObjectMapper().writeValueAsString(moduleSnapshot), null);

    OperationLogService.RegistrationSnapshot regSnapshot =
        new OperationLogService.RegistrationSnapshot(20L, 1L, 2L);
    OperationLog registrationUpdate = new OperationLog(OperationType.UPDATE,
        OperationEntityType.REGISTRATION, regSnapshot.id(), Instant.now(), "admin",
        "Update registration", new ObjectMapper().writeValueAsString(regSnapshot), null);

    OperationLogService.GradeSnapshot gradeSnapshot =
        new OperationLogService.GradeSnapshot(30L, 3L, 4L, 75);
    OperationLog gradeUpdate = new OperationLog(OperationType.UPDATE, OperationEntityType.GRADE,
        gradeSnapshot.id(), Instant.now(), "admin", "Update grade",
        new ObjectMapper().writeValueAsString(gradeSnapshot), null);

    Student student = new Student();
    student.setId(1L);
    Student student2 = new Student();
    student2.setId(3L);
    Module module = new Module();
    module.setId(2L);
    Module module2 = new Module();
    module2.setId(4L);

    when(operationLogRepository.findById(10L)).thenReturn(Optional.of(moduleUpdate));
    when(operationLogRepository.findById(20L)).thenReturn(Optional.of(registrationUpdate));
    when(operationLogRepository.findById(30L)).thenReturn(Optional.of(gradeUpdate));
    when(operationLogRepository.save(any(OperationLog.class))).thenAnswer(invocation ->
        invocation.getArgument(0, OperationLog.class));

    when(studentRepository.findById(1L)).thenReturn(Optional.of(student));
    when(studentRepository.findById(3L)).thenReturn(Optional.of(student2));
    when(moduleRepository.findById(2L)).thenReturn(Optional.of(module));
    when(moduleRepository.findById(4L)).thenReturn(Optional.of(module2));

    operationLogService.revertOperation(10L);
    operationLogService.revertOperation(20L);
    operationLogService.revertOperation(30L);

    verify(moduleRepository).save(any(Module.class));
    verify(registrationRepository).save(any(Registration.class));
    verify(gradeRepository).save(any(uk.ac.ucl.comp0010.models.Grade.class));
  }

  @Test
  void revertDeleteRestoresStudentAndModule() throws JsonProcessingException {
    Student student = new Student("Restore", "Student", "rest", "rest@example.com");
    student.setId(55L);
    Module module = new Module("MDL", "Module", true, "Dept");
    module.setId(66L);

    String studentJson = new ObjectMapper().writeValueAsString(student);
    String moduleJson = new ObjectMapper().writeValueAsString(module);

    OperationLog studentDelete = new OperationLog(OperationType.DELETE, OperationEntityType.STUDENT,
        student.getId(), Instant.now(), "admin", "Deleted student", studentJson, null);
    OperationLog moduleDelete = new OperationLog(OperationType.DELETE, OperationEntityType.MODULE,
        module.getId(), Instant.now(), "admin", "Deleted module", moduleJson, null);

    when(operationLogRepository.findById(60L)).thenReturn(Optional.of(studentDelete));
    when(operationLogRepository.findById(61L)).thenReturn(Optional.of(moduleDelete));
    when(operationLogRepository.save(any(OperationLog.class))).thenAnswer(invocation ->
        invocation.getArgument(0, OperationLog.class));
    operationLogService.revertOperation(60L);
    operationLogService.revertOperation(61L);

    verify(studentRepository).save(any(Student.class));
    verify(moduleRepository).save(any(Module.class));
  }

  @Test
  void logDeletionHandlesNullSnapshot() {
    when(operationLogRepository.save(any(OperationLog.class))).thenAnswer(invocation ->
        invocation.getArgument(0, OperationLog.class));

    OperationLog log = operationLogService.logDeletion(OperationEntityType.STUDENT, 1L, null,
        "Deleted student");

    assertThat(log.getPreviousState()).isNull();
  }
}
