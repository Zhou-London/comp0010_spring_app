package uk.ac.ucl.comp0010.repositories;

import org.springframework.data.repository.CrudRepository;
import uk.ac.ucl.comp0010.models.Grade;

/**
 * Repository for Grade
 *
 * @author Zhouzhou
 */
public interface GradeRepository extends CrudRepository<Grade, Long>{
    
}
