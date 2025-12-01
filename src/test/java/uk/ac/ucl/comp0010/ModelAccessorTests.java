package uk.ac.ucl.comp0010;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashSet;
import org.junit.jupiter.api.Test;
import uk.ac.ucl.comp0010.models.Grade;
import uk.ac.ucl.comp0010.models.Module;
import uk.ac.ucl.comp0010.models.Registration;
import uk.ac.ucl.comp0010.models.Student;

class ModelAccessorTests {

  @Test
  void studentAccessorsCoverAllFields() {
    Student student = new Student();
    student.setId(10L);
    student.setFirstName("Alice");
    student.setLastName("Smith");
    student.setUserName("alice");
    student.setEmail("alice@example.com");

    student.setRegistrations(new HashSet<Registration>());
    student.setGrades(new HashSet<Grade>());

    assertThat(student.getId()).isEqualTo(10L);
    assertThat(student.getFirstName()).isEqualTo("Alice");
    assertThat(student.getLastName()).isEqualTo("Smith");
    assertThat(student.getUserName()).isEqualTo("alice");
    assertThat(student.getEmail()).isEqualTo("alice@example.com");
    assertThat(student.getRegistrations()).isEmpty();
    assertThat(student.getGrades()).isEmpty();
  }

  @Test
  void moduleAccessorsCoverAllFields() {
    Module module = new Module();
    module.setId(20L);
    module.setCode("CS101");
    module.setName("Computer Science");
    module.setMnc(Boolean.TRUE);

    module.setRegistrations(new HashSet<Registration>());
    module.setGrades(new HashSet<Grade>());

    assertThat(module.getId()).isEqualTo(20L);
    assertThat(module.getCode()).isEqualTo("CS101");
    assertThat(module.getName()).isEqualTo("Computer Science");
    assertThat(module.getMnc()).isTrue();
    assertThat(module.getRegistrations()).isEmpty();
    assertThat(module.getGrades()).isEmpty();
  }
}
