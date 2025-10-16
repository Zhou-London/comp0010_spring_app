package uk.ac.ucl.comp0010.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Module model.
 */
@Entity
@Table(name = "modules")
public class Module {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private String code;

  @Column(nullable = false)
  private String name;

  @Column(nullable = false)
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

  // JPA requires no parameters constructor.
  public Module() {}

  // --- Getters and Setters ---
  public void setId(Long id) {
    this.id = id;
  }

  public void setCode(String code) {
    this.code = code;
  }

  public void setName(String name) {
    this.name = name;
  }

  public void setMnc(Boolean mnc) {
    this.mnc = mnc;
  }
  public Long getId() {
    return id;
  }

  public String getCode() {
    return code;
  }

  public String getName() {
    return name;
  }

  public Boolean getMnc() {
    return mnc;
  }



}
