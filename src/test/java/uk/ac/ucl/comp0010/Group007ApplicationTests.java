package uk.ac.ucl.comp0010;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import uk.ac.ucl.comp0010.models.Grade;
import uk.ac.ucl.comp0010.repositories.GradeRepository;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class Group007ApplicationTests {

	@Autowired
	private MockMvc mockMvc;
	private GradeRepository grade_repo;
	
	@Test
	void contextLoads() {}

	@Test
	void testRepository() {
		Grade grade = new Grade(10);
		grade_repo.save(grade);
	}
}

