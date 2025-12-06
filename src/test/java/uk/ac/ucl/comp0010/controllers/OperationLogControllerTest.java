package uk.ac.ucl.comp0010.controllers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import uk.ac.ucl.comp0010.models.OperationEntityType;
import uk.ac.ucl.comp0010.models.OperationLog;
import uk.ac.ucl.comp0010.models.OperationType;
import uk.ac.ucl.comp0010.services.OperationLogService;

@ExtendWith(MockitoExtension.class)
class OperationLogControllerTest {

  @Mock
  private OperationLogService operationLogService;

  private OperationLogController controller;

  @BeforeEach
  void setUp() {
    controller = new OperationLogController(operationLogService);
  }

  @Test
  void returnsRecentOperations() {
    OperationLog log = new OperationLog(OperationType.CREATE, OperationEntityType.STUDENT, 1L,
        Instant.now(), "admin", "Created", null, null);
    when(operationLogService.getRecentOperations()).thenReturn(List.of(log));

    assertThat(controller.getOperations()).containsExactly(log);
    verify(operationLogService).getRecentOperations();
  }

  @Test
  void delegatesRevert() {
    OperationLog revertLog = new OperationLog(OperationType.REVERT, OperationEntityType.STUDENT, 2L,
        Instant.now(), "admin", "Reverted", null, null);
    when(operationLogService.revertOperation(5L)).thenReturn(revertLog);

    assertThat(controller.revert(5L)).isEqualTo(revertLog);
    verify(operationLogService).revertOperation(5L);
  }
}
