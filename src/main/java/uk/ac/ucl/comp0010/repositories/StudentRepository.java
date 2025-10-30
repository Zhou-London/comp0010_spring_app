package uk.ac.ucl.comp0010.repositories;

import java.util.Optional;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;
import uk.ac.ucl.comp0010.models.Student;

/**
 * Repository for student.
 *
 * @author YUNQ
 */
@Repository
public interface StudentRepository extends CrudRepository<Student, Long> {
  Optional<Student> findByUserName(String userName);

  Optional<Student> findByEmail(String email);

  boolean existsByUserName(String userName);

  boolean existsByEmail(String email);
}
