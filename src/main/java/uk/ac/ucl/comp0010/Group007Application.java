package uk.ac.ucl.comp0010;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Spring Boot application entry point.
 */
@SpringBootApplication
public class Group007Application implements CommandLineRunner {

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
    System.out.println("Application Initialized");
  }
}
