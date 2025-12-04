package uk.ac.ucl.comp0010.repositories;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import uk.ac.ucl.comp0010.models.UserAccount;

/**
 * Repository for persisted users.
 */
@Repository
public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {
  Optional<UserAccount> findByUsername(String username);

  Optional<UserAccount> findByAuthToken(String authToken);
}
