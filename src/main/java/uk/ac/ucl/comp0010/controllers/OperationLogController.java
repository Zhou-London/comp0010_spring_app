package uk.ac.ucl.comp0010.controllers;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import uk.ac.ucl.comp0010.models.OperationLog;
import uk.ac.ucl.comp0010.services.OperationLogService;

/**
 * Exposes the operation history and reversion API.
 */
@RestController
@RequestMapping("/api/operations")
public class OperationLogController {

  private final OperationLogService operationLogService;

  public OperationLogController(OperationLogService operationLogService) {
    this.operationLogService = operationLogService;
  }

  @GetMapping
  public List<OperationLog> getOperations() {
    return operationLogService.getRecentOperations();
  }

  @PostMapping("/{id}/revert")
  @ResponseStatus(HttpStatus.OK)
  public OperationLog revert(@PathVariable Long id) {
    return operationLogService.revertOperation(id);
  }
}
