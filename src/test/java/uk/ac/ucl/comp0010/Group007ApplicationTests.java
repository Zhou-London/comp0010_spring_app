package uk.ac.ucl.comp0010;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class Group007ApplicationTests {

	@Autowired
	private MockMvc mockMvc;

	@Test
	void contextLoads() {}

	@Test
	void testGetGrade() throws Exception {
		mockMvc.perform(get("/grade")).andExpect(status().isOk())
				.andExpect(jsonPath("$.score").value(50));
	}
}
