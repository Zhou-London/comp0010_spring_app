package uk.ac.ucl.comp0010;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import uk.ac.ucl.comp0010.models.Module;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import uk.ac.ucl.comp0010.repositories.ModuleRepository;

@SpringBootTest
@AutoConfigureMockMvc
class Group007ApplicationTests {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private ModuleRepository moduleRepository;

  @Test
  void contextLoads() {}

  @Test
  void testGetGrade() throws Exception {
    mockMvc.perform(get("/grade")).andExpect(status().isOk())
        .andExpect(jsonPath("$.score").value(50));
  }

  @Test
  void testModuleRepository() {
    Module module = new Module();
    module.setName("Software Engineering");
    module.setCode("COMP0010");

    moduleRepository.save(module);
  }
}

