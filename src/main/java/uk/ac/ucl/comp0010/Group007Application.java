package uk.ac.ucl.comp0010;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import uk.ac.ucl.comp0010.models.Student;
import uk.ac.ucl.comp0010.repository.StudentRepository;

/**
 * Spring Boot application entry point.
 */
@SpringBootApplication
public class Group007Application implements CommandLineRunner {
  private final StudentRepository studentRepo;

  public Group007Application(StudentRepository studentRepo) {
    this.studentRepo = studentRepo;
  }
  /**
   * The main entry point.
   *
   * @param args command-line arguments
   */
  public static void main(String[] args) {
    SpringApplication.run(Group007Application.class, args);
  }

  @Override
  public void run(String... args) throws Exception {
    studentRepo.save(new Student("Mari", "Ohara", "oharamari", "awashimaisland@qq.com"));
  }
}