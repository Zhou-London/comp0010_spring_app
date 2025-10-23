package uk.ac.ucl.comp0010.models;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;


/**
 * Represents the registration record between a student and a module. Each registration may
 * optionally have a corresponding grade.
 */
@Entity
@Table(name = "registrations")
public class Registration {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long dataId;

  // --- Attributes ---
  @ManyToOne
  @JoinColumn(name = "student_refID")
  private Student student;
  @ManyToOne
  @JoinColumn(name = "Module_refID")
  private Module module;
  @ManyToOne
  @JoinColumn(name = "Grade_refID")
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

  public Long getDataId() {
    return dataId;
  }

  public void setDataId(Long refId) {
    this.dataId = refId;
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
