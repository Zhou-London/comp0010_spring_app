package uk.ac.ucl.comp0010.repositories;

import java.util.Optional;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;
import uk.ac.ucl.comp0010.models.Module;

/**
 * Repository for module.
 *
 * @author Rain Zhao
 */
@Repository
public interface ModuleRepository extends CrudRepository<Module, Long> {
  Optional<Module> findByCode(String code);

  boolean existsByCode(String code);
}
