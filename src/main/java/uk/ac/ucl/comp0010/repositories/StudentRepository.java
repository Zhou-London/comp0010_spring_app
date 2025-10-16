package uk.ac.ucl.comp0010.repositories;

import org.springframework.data.repository.CrudRepository;
import uk.ac.ucl.comp0010.models.Student;

/**
 * Repository for student.
 *
 * @author YUNQ
 */
public interface StudentRepository extends CrudRepository<Student, Long> {
}
