package uk.ac.ucl.comp0010.repositories;
import org.springframework.data.repository.CrudRepository;
import uk.ac.ucl.comp0010.models.Module;

/**
 * Repository for module.
 *
 * @author Rain Zhao
 */
public interface ModuleRepository extends CrudRepository<Module, Long> {
  // Custom query methods can be defined here
}