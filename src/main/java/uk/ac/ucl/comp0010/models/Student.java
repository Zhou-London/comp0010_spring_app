package uk.ac.ucl.comp0010.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

/**
 * Student model.
 */
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Entity
@Table(name = "students")
public class Student {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Schema(accessMode = Schema.AccessMode.WRITE_ONLY, description = "Auto-generated Student ID",
      example = "-1", type = "integer", format = "int64")
  private Long id;

  @Column(nullable = false)
  @Schema(description = "Student's first name", example = "John", type = "string")
  private String firstName;

  @Column(nullable = false)
  @Schema(description = "Student's last name", example = "Doe", type = "string")
  private String lastName;

  @Column(unique = true, nullable = false)
  @Schema(description = "Student's login username", example = "johndoe", type = "string")
  private String userName;

  @Column(unique = true, nullable = false)
  @Schema(description = "Student's email", example = "hello@world.com", type = "string")
  private String email;

  @Column(name = "entry_year")
  @Schema(
      description = "Year the student started their studies",
      example = "2023",
      type = "integer")
  private Integer entryYear;

  @Column(name = "graduate_year")
  @Schema(description = "Expected graduation year", example = "2026", type = "integer")
  private Integer graduateYear;

  @Column
  @Schema(
      description = "Primary major or programme",
      example = "Computer Science",
      type = "string")
  private String major;

  @Column(name = "tuition_fee", precision = 10, scale = 2)
  @Schema(
      description = "Total tuition fee for the course",
      example = "9250.00",
      type = "number",
      format = "double")
  private BigDecimal tuitionFee;

  @Column(name = "paid_tuition_fee", precision = 10, scale = 2)
  @Schema(
      description = "Tuition fee already paid",
      example = "4500.00",
      type = "number",
      format = "double")
  private BigDecimal paidTuitionFee;

  @Column(name = "birth_date")
  @Schema(
      description = "Student birth date",
      example = "2002-04-12",
      type = "string",
      format = "date")
  private LocalDate birthDate;

  @Column(name = "home_student")
  @Schema(
      description = "Whether the student is considered a home student",
      example = "true",
      type = "boolean")
  private Boolean homeStudent;

  @Column
  @Schema(description = "Student's sex", example = "Female", type = "string")
  private String sex;

  @OneToMany(mappedBy = "student", cascade = CascadeType.ALL, orphanRemoval = true)
  @JsonIgnore
  private Set<Registration> registrations = new HashSet<>();

  @OneToMany(mappedBy = "student", cascade = CascadeType.ALL, orphanRemoval = true)
  @JsonIgnore
  private Set<Grade> grades = new HashSet<>();

  /**
   * Constructor without parameters.
   */
  public Student() {}

  /**
   * Constructor.
   *
   * @param firstName student's first name
   * @param lastName student's last name
   * @param userName student's username
   * @param email student's email
   */
  public Student(String firstName, String lastName, String userName, String email) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.userName = userName;
    this.email = email;
  }

  /**
   * Constructor with all fields.
   */
  public Student(String firstName, String lastName, String userName, String email,
      Integer entryYear, Integer graduateYear, String major, BigDecimal tuitionFee,
      BigDecimal paidTuitionFee, LocalDate birthDate, Boolean homeStudent, String sex) {
    this(firstName, lastName, userName, email);
    this.entryYear = entryYear;
    this.graduateYear = graduateYear;
    this.major = major;
    this.tuitionFee = tuitionFee;
    this.paidTuitionFee = paidTuitionFee;
    this.birthDate = birthDate;
    this.homeStudent = homeStudent;
    this.sex = sex;
  }

  // --- Getters and Setters ---
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

  public LocalDate getBirthDate() {
    return birthDate;
  }

  public Boolean getHomeStudent() {
    return homeStudent;
  }

  public String getSex() {
    return sex;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public void setFirstName(String firstName) {
    this.firstName = firstName;
  }

  public void setLastName(String lastName) {
    this.lastName = lastName;
  }

  public void setUserName(String userName) {
    this.userName = userName;
  }

  public void setEmail(String email) {
    this.email = email;
  }

  public void setEntryYear(Integer entryYear) {
    this.entryYear = entryYear;
  }

  public void setGraduateYear(Integer graduateYear) {
    this.graduateYear = graduateYear;
  }

  public void setMajor(String major) {
    this.major = major;
  }

  public void setTuitionFee(BigDecimal tuitionFee) {
    this.tuitionFee = tuitionFee;
  }

  public void setPaidTuitionFee(BigDecimal paidTuitionFee) {
    this.paidTuitionFee = paidTuitionFee;
  }

  public void setBirthDate(LocalDate birthDate) {
    this.birthDate = birthDate;
  }

  public void setHomeStudent(Boolean homeStudent) {
    this.homeStudent = homeStudent;
  }

  public void setSex(String sex) {
    this.sex = sex;
  }

  public Set<Registration> getRegistrations() {
    return registrations;
  }

  public void setRegistrations(Set<Registration> registrations) {
    this.registrations = registrations;
  }

  public Set<Grade> getGrades() {
    return grades;
  }

  public void setGrades(Set<Grade> grades) {
    this.grades = grades;
  }
}
