package uk.ac.ucl.comp0010.models;

/**
 * Represents the registration record between a student and a module. Each registration may
 * optionally have a corresponding grade.
 */
public class Registration {

  // --- Attributes ---
  private Student student;
  private Module module;
  private Grade grade;

  // --- Constructors ---
  public Registration(Student student, Module module) {
    // TODO: initialize attributes
  }

  // --- Getters and Setters ---
  public Student getStudent() {
    // TODO: return student
    return null;
  }

  public Module getModule() {
    // TODO: return module
    return null;
  }

  public Grade getGrade() {
    // TODO: return grade
    return null;
  }

  public void setGrade(Grade grade) {
    // TODO: set grade
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
