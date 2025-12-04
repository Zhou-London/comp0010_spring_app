package uk.ac.ucl.comp0010.controllers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import uk.ac.ucl.comp0010.controllers.requests.GradeCreateRequest;
import uk.ac.ucl.comp0010.controllers.requests.GradeUpdateRequest;
import uk.ac.ucl.comp0010.models.Grade;
import uk.ac.ucl.comp0010.services.GradeService;

@ExtendWith(MockitoExtension.class)
class GradeControllerTest {

  @Mock
  private GradeService gradeService;

  private GradeController gradeController;

  @BeforeEach
  void setUp() {
    gradeController = new GradeController(gradeService);
  }

  @Test
  void getAndDeleteDelegatesToService() {
    when(gradeService.getAllGrades()).thenReturn(List.of(new Grade()));
    Grade grade = new Grade();
    when(gradeService.getGrade(1L)).thenReturn(grade);

    assertThat(gradeController.getGrades()).hasSize(1);
    assertThat(gradeController.getGrade(1L)).isEqualTo(grade);

    gradeController.deleteGrade(1L);
    verify(gradeService).deleteGrade(1L);
  }

  @Test
  void createAndUpdateAndUpsertDelegateToService() throws Exception {
    GradeCreateRequest createRequest = new GradeCreateRequest();
    createRequest.setStudentId(1L);
    createRequest.setModuleId(2L);
    createRequest.setScore(90);

    GradeUpdateRequest updateRequest = new GradeUpdateRequest();
    updateRequest.setScore(75);

    Grade grade = new Grade();
    when(gradeService.createGrade(1L, 2L, 90)).thenReturn(grade);
    when(gradeService.updateGrade(3L, 75)).thenReturn(grade);
    when(gradeService.upsertGrade(1L, 2L, 90)).thenReturn(grade);

    assertThat(gradeController.createGrade(createRequest)).isEqualTo(grade);
    assertThat(gradeController.updateGrade(3L, updateRequest)).isEqualTo(grade);
    assertThat(gradeController.upsertGrade(createRequest)).isEqualTo(grade);
  }
}
