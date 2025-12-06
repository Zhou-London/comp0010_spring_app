package uk.ac.ucl.comp0010.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import java.time.Instant;

/**
 * Record of an administrative operation with enough data to revert it.
 */
@Entity
@Table(name = "operation_logs")
public class OperationLog {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Enumerated(EnumType.STRING)
  @Column(name = "operation_type", nullable = false)
  private OperationType operationType;

  @Enumerated(EnumType.STRING)
  @Column(name = "entity_type", nullable = false)
  private OperationEntityType entityType;

  @Column(name = "entity_id")
  private Long entityId;

  @Column(nullable = false)
  private Instant timestamp;

  private String username;

  @Column(columnDefinition = "TEXT")
  private String description;

  @Lob
  @Column(name = "previous_state")
  private String previousState;

  @Lob
  @Column(name = "new_state")
  private String newState;

  public OperationLog() {
  }

  /**
   * Construct a log entry.
   */
  public OperationLog(OperationType operationType, OperationEntityType entityType, Long entityId,
      Instant timestamp, String username, String description, String previousState,
      String newState) {
    this.operationType = operationType;
    this.entityType = entityType;
    this.entityId = entityId;
    this.timestamp = timestamp;
    this.username = username;
    this.description = description;
    this.previousState = previousState;
    this.newState = newState;
  }

  public Long getId() {
    return id;
  }

  public OperationType getOperationType() {
    return operationType;
  }

  public OperationEntityType getEntityType() {
    return entityType;
  }

  public Long getEntityId() {
    return entityId;
  }

  public Instant getTimestamp() {
    return timestamp;
  }

  public String getUsername() {
    return username;
  }

  public String getDescription() {
    return description;
  }

  public String getPreviousState() {
    return previousState;
  }

  public String getNewState() {
    return newState;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public void setOperationType(OperationType operationType) {
    this.operationType = operationType;
  }

  public void setEntityType(OperationEntityType entityType) {
    this.entityType = entityType;
  }

  public void setEntityId(Long entityId) {
    this.entityId = entityId;
  }

  public void setTimestamp(Instant timestamp) {
    this.timestamp = timestamp;
  }

  public void setUsername(String username) {
    this.username = username;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public void setPreviousState(String previousState) {
    this.previousState = previousState;
  }

  public void setNewState(String newState) {
    this.newState = newState;
  }
}
