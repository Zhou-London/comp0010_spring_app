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
