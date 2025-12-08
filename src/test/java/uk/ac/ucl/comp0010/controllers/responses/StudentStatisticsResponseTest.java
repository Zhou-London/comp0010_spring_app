package uk.ac.ucl.comp0010.controllers.responses;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import uk.ac.ucl.comp0010.models.Student;

class StudentStatisticsResponseTest {

  @Test
  void computesOutstandingTuitionWhenPaidProvided() {
    Student student = new Student();
    student.setId(5L);
    student.setFirstName("Nora");
    student.setLastName("Jones");
    student.setUserName("njones");
    student.setEmail("nora@example.com");
    student.setTuitionFee(new BigDecimal("15000.00"));
    student.setPaidTuitionFee(new BigDecimal("6200.50"));
    student.setEntryYear(2021);
    student.setGraduateYear(2025);
    student.setMajor("Engineering");
    student.setBirthDate(LocalDate.of(2002, 8, 15));
    student.setHomeStudent(Boolean.FALSE);
    student.setSex("Female");

    StudentStatisticsResponse response = StudentStatisticsResponse.fromStudent(student, 78.5);

    assertThat(response.getId()).isEqualTo(5L);
    assertThat(response.getFirstName()).isEqualTo("Nora");
    assertThat(response.getLastName()).isEqualTo("Jones");
    assertThat(response.getUserName()).isEqualTo("njones");
    assertThat(response.getEmail()).isEqualTo("nora@example.com");
    assertThat(response.getEntryYear()).isEqualTo(2021);
    assertThat(response.getGraduateYear()).isEqualTo(2025);
    assertThat(response.getMajor()).isEqualTo("Engineering");
    assertThat(response.getTuitionFee()).isEqualByComparingTo("15000.00");
    assertThat(response.getPaidTuitionFee()).isEqualByComparingTo("6200.50");
    assertThat(response.getOutstandingTuition()).isEqualByComparingTo("8799.50");
    assertThat(response.getBirthDate()).isEqualTo(LocalDate.of(2002, 8, 15));
    assertThat(response.getHomeStudent()).isFalse();
    assertThat(response.getSex()).isEqualTo("Female");
    assertThat(response.getAverageScore()).isEqualTo(78.5);
  }

  @Test
  void handlesNullTuitionValuesGracefully() {
    Student student = new Student();
    student.setTuitionFee(null);
    student.setPaidTuitionFee(null);

    StudentStatisticsResponse response = StudentStatisticsResponse.fromStudent(student, null);

    assertThat(response.getOutstandingTuition()).isNull();
    assertThat(response.getAverageScore()).isNull();
  }

  @Test
  void returnsTuitionWhenNoPaymentRecorded() {
    Student student = new Student();
    student.setTuitionFee(new BigDecimal("8000.00"));
    student.setPaidTuitionFee(null);

    StudentStatisticsResponse response = StudentStatisticsResponse.fromStudent(student, 50.0);

    assertThat(response.getOutstandingTuition()).isEqualByComparingTo("8000.00");
  }
}
