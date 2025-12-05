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
 * Module model.
 */
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Entity
@Table(name = "modules")
public class Module {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Schema(accessMode = Schema.AccessMode.WRITE_ONLY, description = "Auto-generated Module ID",
      example = "-1", type = "integer", format = "int64")
  private Long id;

  @Column(nullable = false, unique = true)
  @Schema(description = "Module's code", example = "COMP0010", type = "string")
  private String code;

  @Column(nullable = false)
  @Schema(description = "Module's name", example = "Software Engineering", type = "string")
  private String name;

  @Column(nullable = false)
  @Schema(description = "Is module mandatory", example = "true", type = "boolean")
  private Boolean mnc;

  @OneToMany(mappedBy = "module", cascade = CascadeType.ALL, orphanRemoval = true)
  @JsonIgnore
  private Set<Registration> registrations = new HashSet<>();

  @OneToMany(mappedBy = "module", cascade = CascadeType.ALL, orphanRemoval = true)
  @JsonIgnore
  private Set<Grade> grades = new HashSet<>();

  /**
   * Constructor for Class Module without parameters.
   */
  public Module() {}

  /**
   * Constructor for Class Module.
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

  // --- Getters and Setters ---
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
