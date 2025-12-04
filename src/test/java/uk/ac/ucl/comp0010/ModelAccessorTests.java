package uk.ac.ucl.comp0010;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.LocalDate;
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
    student.setEntryYear(2022);
    student.setGraduateYear(2025);
    student.setMajor("Mathematics");
    student.setTuitionFee(new BigDecimal("12000.50"));
    student.setPaidTuitionFee(new BigDecimal("6000.25"));
    student.setBirthDate(LocalDate.of(2003, 5, 12));
    student.setHomeStudent(Boolean.TRUE);
    student.setSex("Female");

    student.setRegistrations(new HashSet<Registration>());
    student.setGrades(new HashSet<Grade>());

    assertThat(student.getId()).isEqualTo(10L);
    assertThat(student.getFirstName()).isEqualTo("Alice");
    assertThat(student.getLastName()).isEqualTo("Smith");
    assertThat(student.getUserName()).isEqualTo("alice");
    assertThat(student.getEmail()).isEqualTo("alice@example.com");
    assertThat(student.getEntryYear()).isEqualTo(2022);
    assertThat(student.getGraduateYear()).isEqualTo(2025);
    assertThat(student.getMajor()).isEqualTo("Mathematics");
    assertThat(student.getTuitionFee()).isEqualByComparingTo("12000.50");
    assertThat(student.getPaidTuitionFee()).isEqualByComparingTo("6000.25");
    assertThat(student.getBirthDate()).isEqualTo(LocalDate.of(2003, 5, 12));
    assertThat(student.getHomeStudent()).isTrue();
    assertThat(student.getSex()).isEqualTo("Female");
    assertThat(student.getRegistrations()).isEmpty();
    assertThat(student.getGrades()).isEmpty();
  }

  @Test
  void studentFullConstructorPopulatesFields() {
    LocalDate birthDate = LocalDate.of(2001, 4, 3);
    Student student = new Student("Bella", "Brown", "bbrown", "bella@example.com", 2020, 2024,
        "History", new BigDecimal("9000"), new BigDecimal("4500"), birthDate, false, "Female");

    assertThat(student.getFirstName()).isEqualTo("Bella");
    assertThat(student.getLastName()).isEqualTo("Brown");
    assertThat(student.getUserName()).isEqualTo("bbrown");
    assertThat(student.getEmail()).isEqualTo("bella@example.com");
    assertThat(student.getEntryYear()).isEqualTo(2020);
    assertThat(student.getGraduateYear()).isEqualTo(2024);
    assertThat(student.getMajor()).isEqualTo("History");
    assertThat(student.getTuitionFee()).isEqualByComparingTo("9000");
    assertThat(student.getPaidTuitionFee()).isEqualByComparingTo("4500");
    assertThat(student.getBirthDate()).isEqualTo(birthDate);
    assertThat(student.getHomeStudent()).isFalse();
    assertThat(student.getSex()).isEqualTo("Female");
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
