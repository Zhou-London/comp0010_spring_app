package uk.ac.ucl.comp0010.models;

/**
 * Module model.
 */
public class Module {
  private String code;
  private String name;
  private Boolean mnc;

  /**
   * constructor.
   *
   * @param code Module's code
   * @param name Module's name
   * @param mnc Is module mandatory
   */
  public Module(String code, String name, Boolean mnc) {
    this.code = code;
    this.name = name;
    this.mnc = mnc;
  }



}
