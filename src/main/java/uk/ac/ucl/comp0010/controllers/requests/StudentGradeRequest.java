package uk.ac.ucl.comp0010.controllers.requests;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Request payload for recording a grade.
 */
@Schema(name = "StudentGradeRequest")
public class StudentGradeRequest {
    @Schema(description = "Module ID", example = "456", type = "integer", format = "int64")
    private Long moduleId;

    @Schema(description = "Score", example = "90", type = "integer", format = "int32")
    private int score;

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
