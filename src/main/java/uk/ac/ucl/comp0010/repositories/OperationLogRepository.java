package uk.ac.ucl.comp0010.repositories;

import java.util.List;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;
import uk.ac.ucl.comp0010.models.OperationLog;

/**
 * Repository for operation logs.
 */
@Repository
public interface OperationLogRepository extends CrudRepository<OperationLog, Long> {

  List<OperationLog> findAllByOrderByTimestampDesc();
}
