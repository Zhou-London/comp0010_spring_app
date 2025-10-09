package uk.ac.ucl.comp0010.models;

/**
 * Student model.
 */
public class Student {
  private Long id;
  private String firstName;
  private String lastName;
  private String userName;
  private String email;

  public Student(Long id, String firstName, String lastName, String userName, String email) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.userName = userName;
    this.email = email;
  }

  public float computeAverage() {
    // TBD
    return 0.111F;
  }

  public void addGrade(Grade g) {
    // TBD
  }

  public Grade getGrades(Module m) {
    Grade g = new Grade();
    return g;
  }

  public void registerModule(Module m) {}

  public String getFirstName() {
    return firstName;
  }

  public void setFirstName(String firstName) {
    this.firstName = firstName;
  }

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public String getLastName() {
    return lastName;
  }

  public void setLastName(String lastName) {
    this.lastName = lastName;
  }

  public String getUserName() {
    return userName;
  }

  public void setUserName(String userName) {
    this.userName = userName;
  }

  public String getEmail() {
    return email;
  }

  public void setEmail(String email) {
    this.email = email;
  }

}
