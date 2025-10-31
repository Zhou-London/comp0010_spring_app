package uk.ac.ucl.comp0010.controllers.requests;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Request payload for creating or upserting a grade.
 */
@Schema(name = "GradeCreateRequest")
public class GradeCreateRequest {

    @JsonProperty("studentId")
    @Schema(description = "Student ID", example = "123", type = "integer", format = "int64")
    private Long studentId;

    @JsonProperty("moduleId")
    @Schema(description = "Module ID", example = "456", type = "integer", format = "int64")
    private Long moduleId;

    @JsonProperty("score")
    @Schema(description = "Score", example = "90", type = "integer", format = "int32")
    private int score;

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public Long getModuleId() {
        return moduleId;
    }

    public void setModuleId(Long moduleId) {
        this.moduleId = moduleId;
    }

    public int getScore() {
        return score;
    }

    public void setScore(int score) {
        this.score = score;
    }

}
