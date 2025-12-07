package uk.ac.ucl.comp0010;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.core.env.Environment;

/**
 * Spring Boot application entry point.
 */
@SpringBootApplication
public class Group007Application implements CommandLineRunner {

  @Autowired
  private Environment env;

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

    String port = env.getProperty("server.port");
    if (port == null) {
      port = "Port not configured.";
    }

    System.out.println("Spring-Boot application now listens to http://localhost:" + port);
  }
}
