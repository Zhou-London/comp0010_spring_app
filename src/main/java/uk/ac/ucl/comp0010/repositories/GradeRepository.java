package uk.ac.ucl.comp0010.repositories;

import java.util.List;
import java.util.Optional;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;
import uk.ac.ucl.comp0010.models.Grade;
import uk.ac.ucl.comp0010.models.Module;
import uk.ac.ucl.comp0010.models.Student;

/**
 * Repository for Grade.
 *
 * @author YUNQ
 */
@Repository
public interface GradeRepository extends CrudRepository<Grade, Long> {
  List<Grade> findAllByStudent(Student student);

  List<Grade> findAllByModule(Module module);

  Optional<Grade> findByStudentAndModule(Student student, Module module);

  boolean existsByStudentAndModule(Student student, Module module);
}
