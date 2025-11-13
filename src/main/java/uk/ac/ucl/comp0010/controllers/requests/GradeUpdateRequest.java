package uk.ac.ucl.comp0010.controllers.requests;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Request payload for updating a grade.
 */
@Schema(name = "GradeUpdateRequest")
public class GradeUpdateRequest {

    @JsonProperty("score")
    @Schema(description = "Score", example = "100", type = "integer", format = "int32")
    private int score;

    public int getScore() {
        return score;
    }

    public void setScore(int score) {
        this.score = score;
    }
}
