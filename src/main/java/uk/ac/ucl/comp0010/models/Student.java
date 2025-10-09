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

  /**
   * This api is used to get the first name.
   *
   * @return {@link String }
   */
  public String getFirstName() {
    return firstName;
  }

  /**
   * This api is used to set the first name.
   *
   * @param firstName student's first name
   */
  public void setFirstName(String firstName) {
    this.firstName = firstName;
  }

  /**
   * This api is used to get ID.
   *
   * @return {@link Long }
   */
  public Long getId() {
    return id;
  }

  /**
   * This api is used to set the ID.
   *
   * @param id ID
   */
  public void setId(Long id) {
    this.id = id;
  }

  /**
   * This api is used to get the last name.
   *
   * @return {@link String }
   */
  public String getLastName() {
    return lastName;
  }

  /**
   * This api is used to set the last name.
   *
   * @param lastName Last name
   */
  public void setLastName(String lastName) {
    this.lastName = lastName;
  }

  /**
   * This api is used to get username.
   *
   * @return {@link String }
   */
  public String getUserName() {
    return userName;
  }

  /**
   * This api is used to set the username.
   *
   * @param userName username
   */
  public void setUserName(String userName) {
    this.userName = userName;
  }

  /**
   * This api is used to get the email.
   *
   * @return {@link String }
   */
  public String getEmail() {
    return email;
  }

  /**
   * This api is used to set the email.
   *
   * @param email email
   */
  public void setEmail(String email) {
    this.email = email;
  }

}
