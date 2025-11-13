package uk.ac.ucl.comp0010.controllers.requests;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Request payload for creating a registration.
 */
@Schema(name = "RegistrationRequest")
public class RegistrationRequest {
    @Schema(description = "Student ID", example = "1", type = "integer", format = "int64")
    private Long studentId;

    @Schema(description = "Module ID", example = "1", type = "integer", format = "int64")
    private Long moduleId;

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
}
