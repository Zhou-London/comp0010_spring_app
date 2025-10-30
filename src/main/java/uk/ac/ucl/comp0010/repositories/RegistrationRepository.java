package uk.ac.ucl.comp0010.repositories;

import java.util.List;
import java.util.Optional;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;
import uk.ac.ucl.comp0010.models.Module;
import uk.ac.ucl.comp0010.models.Registration;
import uk.ac.ucl.comp0010.models.Student;

/**
 * Repository for Registration.
 *
 * @author YUNQ
 */
@Repository
public interface RegistrationRepository extends CrudRepository<Registration, Long> {
  List<Registration> findAllByStudent(Student student);

  List<Registration> findAllByModule(Module module);

  Optional<Registration> findByStudentAndModule(Student student, Module module);

  boolean existsByStudentAndModule(Student student, Module module);
}
