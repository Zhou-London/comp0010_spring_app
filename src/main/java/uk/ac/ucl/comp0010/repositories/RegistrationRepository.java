package uk.ac.ucl.comp0010.repositories;

import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;
import uk.ac.ucl.comp0010.models.Registration;

/**
 * Repository for Registration.
 *
 * @author YUNQ
 */
@Repository
public interface RegistrationRepository extends CrudRepository<Registration, Long> {
}
