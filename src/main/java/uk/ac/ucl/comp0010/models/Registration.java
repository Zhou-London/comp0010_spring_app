package uk.ac.ucl.comp0010.models;

import jakarta.persistence.*;


/**
 * Represents the registration record between a student and a module. Each registration may
 * optionally have a corresponding grade.
 */
@Entity
@Table(name = "registrations")
public class Registration {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id_;

  // --- Attributes ---
  @ManyToOne
  @JoinColumn(name = "student_id")
  private Student student;
  @ManyToOne
  @JoinColumn(name = "Module_id")
  private Module module;
  @ManyToOne
  @JoinColumn(name = "Grade_id")
  private Grade grade;

  public void setStudent(Student student) {
    this.student = student;
  }

  /**
   * Constructors.
   *
   * @param student student
   * @param module  module
   * @param grade grade
   */
  public Registration(Student student, Module module, Grade grade) {
    this.student = student;
    this.module = module;
    this.grade = grade;
  }

  public Registration() {

  }

  // --- Getters and Setters ---
  public Student getStudent() {
    return student;
  }

  public Module getModule() {
    return module;
  }

  public Grade getGrade() {
    return grade;
  }

  public void setGrade(Grade grade) {
    this.grade = grade;
  }

  public Long getId() {
    return id_;
  }

  public void setId(Long id) {
    this.id_ = id;
  }

  // --- Utility Methods ---
  @Override
  public boolean equals(Object o) {
    // TODO: define equality logic
    return false;
  }

  @Override
  public int hashCode() {
    // TODO: generate hash code
    return 0;
  }

  @Override
  public String toString() {
    // TODO: return a string representation
    return null;
  }
}
