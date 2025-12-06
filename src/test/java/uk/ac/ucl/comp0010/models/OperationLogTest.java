package uk.ac.ucl.comp0010.models;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import org.junit.jupiter.api.Test;

class OperationLogTest {

  @Test
  void storesProvidedValues() {
    Instant timestamp = Instant.now();
    OperationLog log = new OperationLog(OperationType.UPDATE, OperationEntityType.MODULE, 3L,
        timestamp, "admin", "Updated module", "before", "after");

    assertThat(log.getOperationType()).isEqualTo(OperationType.UPDATE);
    assertThat(log.getEntityType()).isEqualTo(OperationEntityType.MODULE);
    assertThat(log.getEntityId()).isEqualTo(3L);
    assertThat(log.getTimestamp()).isEqualTo(timestamp);
    assertThat(log.getUsername()).isEqualTo("admin");
    assertThat(log.getDescription()).contains("Updated");
    assertThat(log.getPreviousState()).isEqualTo("before");
    assertThat(log.getNewState()).isEqualTo("after");
  }

  @Test
  void defaultConstructorAndSettersPopulateFields() {
    Instant timestamp = Instant.now();
    OperationLog log = new OperationLog();

    log.setId(10L);
    log.setOperationType(OperationType.DELETE);
    log.setEntityType(OperationEntityType.STUDENT);
    log.setEntityId(8L);
    log.setTimestamp(timestamp);
    log.setUsername("tester");
    log.setDescription("Removed student");
    log.setPreviousState("prev");
    log.setNewState("next");

    assertThat(log.getId()).isEqualTo(10L);
    assertThat(log.getOperationType()).isEqualTo(OperationType.DELETE);
    assertThat(log.getEntityType()).isEqualTo(OperationEntityType.STUDENT);
    assertThat(log.getEntityId()).isEqualTo(8L);
    assertThat(log.getTimestamp()).isEqualTo(timestamp);
    assertThat(log.getUsername()).isEqualTo("tester");
    assertThat(log.getDescription()).contains("Removed");
    assertThat(log.getPreviousState()).isEqualTo("prev");
    assertThat(log.getNewState()).isEqualTo("next");
  }
}
