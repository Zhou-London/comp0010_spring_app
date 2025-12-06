package uk.ac.ucl.comp0010.services;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uk.ac.ucl.comp0010.exceptions.ResourceNotFoundException;
import uk.ac.ucl.comp0010.models.Grade;
import uk.ac.ucl.comp0010.models.Module;
import uk.ac.ucl.comp0010.models.OperationEntityType;
import uk.ac.ucl.comp0010.models.OperationLog;
import uk.ac.ucl.comp0010.models.OperationType;
import uk.ac.ucl.comp0010.models.Registration;
import uk.ac.ucl.comp0010.models.Student;
import uk.ac.ucl.comp0010.repositories.GradeRepository;
import uk.ac.ucl.comp0010.repositories.ModuleRepository;
import uk.ac.ucl.comp0010.repositories.OperationLogRepository;
import uk.ac.ucl.comp0010.repositories.RegistrationRepository;
import uk.ac.ucl.comp0010.repositories.StudentRepository;

/**
 * Records admin operations and provides reversion support.
 */
@Service
@Transactional
public class OperationLogService {
  private final OperationLogRepository operationLogRepository;
  private final ObjectMapper objectMapper;
  private final StudentRepository studentRepository;
  private final ModuleRepository moduleRepository;
  private final RegistrationRepository registrationRepository;
  private final GradeRepository gradeRepository;

  /**
   * Creates a service for recording and reverting admin operations.
   *
   * @param operationLogRepository repository for persisted operation logs
   * @param objectMapper object mapper for snapshot serialization
   * @param studentRepository repository for students
   * @param moduleRepository repository for modules
   * @param registrationRepository repository for registrations
   * @param gradeRepository repository for grades
   */
  public OperationLogService(OperationLogRepository operationLogRepository,
      ObjectMapper objectMapper, StudentRepository studentRepository,
      ModuleRepository moduleRepository, RegistrationRepository registrationRepository,
      GradeRepository gradeRepository) {
    this.operationLogRepository = operationLogRepository;
    this.objectMapper = objectMapper;
    this.studentRepository = studentRepository;
    this.moduleRepository = moduleRepository;
    this.registrationRepository = registrationRepository;
    this.gradeRepository = gradeRepository;
  }

  @Transactional(readOnly = true)
  public List<OperationLog> getRecentOperations() {
    return operationLogRepository.findAllByOrderByTimestampDesc();
  }

  public OperationLog logCreation(OperationEntityType entityType, Long entityId, Object newState,
      String description) {
    return saveLog(OperationType.CREATE, entityType, entityId, description, null,
        serialize(newState));
  }

  public OperationLog logUpdate(OperationEntityType entityType, Long entityId, Object previousState,
      Object newState, String description) {
    return saveLog(OperationType.UPDATE, entityType, entityId, description,
        serialize(previousState), serialize(newState));
  }

  public OperationLog logDeletion(OperationEntityType entityType, Long entityId,
      Object previousState, String description) {
    return saveLog(OperationType.DELETE, entityType, entityId, description,
        serialize(previousState), null);
  }

  /**
   * Reverts a previously recorded operation by applying the stored snapshot.
   *
   * @param logId identifier of the log entry to revert
   * @return the log entry documenting the revert
   */
  public OperationLog revertOperation(Long logId) {
    OperationLog log = operationLogRepository.findById(logId)
        .orElseThrow(() -> new ResourceNotFoundException("Operation not found with id " + logId));

    switch (log.getOperationType()) {
      case CREATE -> revertCreate(log);
      case UPDATE -> revertUpdate(log);
      case DELETE -> revertDelete(log);
      default -> throw new ResourceNotFoundException("Operation type cannot be reverted");
    }

    return saveLog(OperationType.REVERT, log.getEntityType(), log.getEntityId(),
        "Reverted: " + log.getDescription(), log.getPreviousState(), log.getNewState());
  }

  /**
   * Creates a deep copy of the provided value using JSON serialization.
   *
   * @param value the value to copy
   * @param type type of the value
   * @param <T> value type
   * @return copied value or null
   */
  public <T> T copyOf(T value, Class<T> type) {
    if (value == null) {
      return null;
    }
    try {
      return objectMapper.readValue(objectMapper.writeValueAsString(value), type);
    } catch (JsonProcessingException e) {
      throw new IllegalStateException("Unable to copy state", e);
    }
  }

  private void revertCreate(OperationLog log) {
    switch (log.getEntityType()) {
      case STUDENT -> deleteStudent(log.getEntityId());
      case MODULE -> deleteModule(log.getEntityId());
      case REGISTRATION -> deleteRegistration(log.getEntityId());
      case GRADE -> deleteGrade(log.getEntityId());
      default -> throw new ResourceNotFoundException("Unsupported entity for revert");
    }
  }

  private void revertUpdate(OperationLog log) {
    switch (log.getEntityType()) {
      case STUDENT -> studentRepository.save(readValue(log.getPreviousState(), Student.class));
      case MODULE -> moduleRepository.save(readValue(log.getPreviousState(), Module.class));
      case REGISTRATION -> registrationRepository.save(toRegistration(log.getPreviousState()));
      case GRADE -> gradeRepository.save(toGrade(log.getPreviousState()));
      default -> throw new ResourceNotFoundException("Unsupported entity for revert");
    }
  }

  private void revertDelete(OperationLog log) {
    switch (log.getEntityType()) {
      case STUDENT -> studentRepository.save(readValue(log.getPreviousState(), Student.class));
      case MODULE -> moduleRepository.save(readValue(log.getPreviousState(), Module.class));
      case REGISTRATION -> registrationRepository.save(toRegistration(log.getPreviousState()));
      case GRADE -> gradeRepository.save(toGrade(log.getPreviousState()));
      default -> throw new ResourceNotFoundException("Unsupported entity for revert");
    }
  }

  private void deleteStudent(Long id) {
    Student student = studentRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Student not found with id " + id));
    studentRepository.delete(student);
  }

  private void deleteModule(Long id) {
    Module module = moduleRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Module not found with id " + id));
    moduleRepository.delete(module);
  }

  private void deleteRegistration(Long id) {
    Registration registration = registrationRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Registration not found with id " + id));
    registrationRepository.delete(registration);
  }

  private void deleteGrade(Long id) {
    Grade grade = gradeRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Grade not found with id " + id));
    gradeRepository.delete(grade);
  }

  private Registration toRegistration(String state) {
    RegistrationSnapshot snapshot = readValue(state, RegistrationSnapshot.class);
    Student student = studentRepository.findById(snapshot.studentId())
        .orElseThrow(() -> new ResourceNotFoundException(
            "Student not found with id " + snapshot.studentId()));
    Module module = moduleRepository.findById(snapshot.moduleId())
        .orElseThrow(() -> new ResourceNotFoundException(
            "Module not found with id " + snapshot.moduleId()));
    Registration registration = new Registration(student, module);
    registration.setId(snapshot.id());
    return registration;
  }

  private Grade toGrade(String state) {
    GradeSnapshot snapshot = readValue(state, GradeSnapshot.class);
    Student student = studentRepository.findById(snapshot.studentId())
        .orElseThrow(() -> new ResourceNotFoundException(
            "Student not found with id " + snapshot.studentId()));
    Module module = moduleRepository.findById(snapshot.moduleId())
        .orElseThrow(() -> new ResourceNotFoundException(
            "Module not found with id " + snapshot.moduleId()));
    Grade grade = new Grade(student, module, snapshot.score());
    grade.setId(snapshot.id());
    return grade;
  }

  private String serialize(Object value) {
    if (value == null) {
      return null;
    }
    try {
      return objectMapper.writeValueAsString(value);
    } catch (JsonProcessingException e) {
      throw new IllegalStateException("Unable to serialize operation state", e);
    }
  }

  private <T> T readValue(String json, Class<T> type) {
    try {
      return objectMapper.readValue(json, type);
    } catch (JsonProcessingException e) {
      throw new ResourceNotFoundException("Unable to parse stored operation state");
    }
  }

  private OperationLog saveLog(OperationType type, OperationEntityType entityType, Long entityId,
      String description, String previousState, String newState) {
    OperationLog log = new OperationLog(type, entityType, entityId, Instant.now(),
        currentUsername(), description, previousState, newState);
    return operationLogRepository.save(log);
  }

  private String currentUsername() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    return authentication != null ? authentication.getName() : "anonymous";
  }

  static record RegistrationSnapshot(Long id, Long studentId, Long moduleId) {
  }

  static record GradeSnapshot(Long id, Long studentId, Long moduleId, Integer score) {
  }
}
