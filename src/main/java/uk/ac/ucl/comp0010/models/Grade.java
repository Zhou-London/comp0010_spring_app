package uk.ac.ucl.comp0010.models;

/**
 * Grade model.
 */
public class Grade {
  private int score;

  /**
   * Create a new grade without parameters.
   */
  public Grade() {}

  /**
   * Create a new grade with the given score.
   *
   * @param score The score of the grade.
   */
  public Grade(int score) {
    this.score = score;
  }

  /**
   * Get the score of the grade.
   *
   * @return The score of the grade.
   */
  public int getScore() {
    return score;
  }

  /**
   * Set the score of the grade.
   *
   * @param score The score to set.
   */
  public void setScore(int score) {
    this.score = score;
  }
}
