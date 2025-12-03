package uk.ac.ucl.comp0010.controllers.responses;

import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;
import java.time.LocalDate;
import uk.ac.ucl.comp0010.models.Student;

/**
 * Response wrapper for summarising student statistics.
 */
public class StudentStatisticsResponse {
  @Schema(description = "Student identifier")
  private final Long id;

  @Schema(description = "Student first name")
  private final String firstName;

  @Schema(description = "Student last name")
  private final String lastName;

  @Schema(description = "Username used to log in")
  private final String userName;

  @Schema(description = "Student email")
  private final String email;

  @Schema(description = "Year of entry")
  private final Integer entryYear;

  @Schema(description = "Expected graduation year")
  private final Integer graduateYear;

  @Schema(description = "Declared major")
  private final String major;

  @Schema(description = "Total tuition fee")
  private final BigDecimal tuitionFee;

  @Schema(description = "Tuition fee already paid")
  private final BigDecimal paidTuitionFee;

  @Schema(description = "Outstanding tuition fee")
  private final BigDecimal outstandingTuition;

  @Schema(description = "Birth date")
  private final LocalDate birthDate;

  @Schema(description = "Home student flag")
  private final Boolean homeStudent;

  @Schema(description = "Sex of the student")
  private final String sex;

  @Schema(description = "Average score across recorded grades")
  private final Double averageScore;

  /**
   * Builds a response based on a student entity and pre-computed average.
   */
  private StudentStatisticsResponse(Student student, Double averageScore) {
    this.id = student.getId();
    this.firstName = student.getFirstName();
    this.lastName = student.getLastName();
    this.userName = student.getUserName();
    this.email = student.getEmail();
    this.entryYear = student.getEntryYear();
    this.graduateYear = student.getGraduateYear();
    this.major = student.getMajor();
    this.tuitionFee = student.getTuitionFee();
    this.paidTuitionFee = student.getPaidTuitionFee();
    this.outstandingTuition = calculateOutstanding(student);
    this.birthDate = student.getBirthDate();
    this.homeStudent = student.getHomeStudent();
    this.sex = student.getSex();
    this.averageScore = averageScore;
  }

  private BigDecimal calculateOutstanding(Student student) {
    if (student.getTuitionFee() == null) {
      return null;
    }
    if (student.getPaidTuitionFee() == null) {
      return student.getTuitionFee();
    }
    return student.getTuitionFee().subtract(student.getPaidTuitionFee());
  }

  public Long getId() {
    return id;
  }

  public String getFirstName() {
    return firstName;
  }

  public String getLastName() {
    return lastName;
  }

  public String getUserName() {
    return userName;
  }

  public String getEmail() {
    return email;
  }

  public Integer getEntryYear() {
    return entryYear;
  }

  public Integer getGraduateYear() {
    return graduateYear;
  }

  public String getMajor() {
    return major;
  }

  public BigDecimal getTuitionFee() {
    return tuitionFee;
  }

  public BigDecimal getPaidTuitionFee() {
    return paidTuitionFee;
  }

  public BigDecimal getOutstandingTuition() {
    return outstandingTuition;
  }

  public LocalDate getBirthDate() {
    return birthDate;
  }

  public Boolean getHomeStudent() {
    return homeStudent;
  }

  public String getSex() {
    return sex;
  }

  public Double getAverageScore() {
    return averageScore;
  }

  /**
   * Factory method to create a response.
   */
  public static StudentStatisticsResponse fromStudent(Student student, Double averageScore) {
    return new StudentStatisticsResponse(student, averageScore);
  }
}
