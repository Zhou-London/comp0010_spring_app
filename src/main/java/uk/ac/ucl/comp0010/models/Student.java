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

  /**
   * Constructor.
   *
   * @param id student's id
   * @param firstName student's first name
   * @param lastName  Student's last name
   * @param userName  Student's username
   * @param email Studentship
   */
  public Student(Long id, String firstName, String lastName, String userName, String email) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.userName = userName;
    this.email = email;
  }

  /**
   * This api is used to compute the average grade of every modulus.
   *
   * @return float
   */
  public float computeAverage() {
    // TBD
    return 0.111F;
  }

  /**
   * add the grade to student's modulus.
   *
   * @param g Student's modulus grade
   */
  public void addGrade(Grade g) {
    // TBD
  }

  /**
   * This api is used to get grade.
   *
   * @param m module name
   * @return {@link Grade }
   */
  public Grade getGrades(Module m) {
    Grade g = new Grade();
    return g;
  }

  /**
   * This api is used to register module.
   *
   * @param m DataModule
   */
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
