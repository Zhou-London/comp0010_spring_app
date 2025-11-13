package uk.ac.ucl.comp0010;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import com.fasterxml.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
class Group007ApplicationTests {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private ObjectMapper objectMapper;

  /**
   * Students Test: Create John.
   *
   * @throws Exception
   */
  @Test
  void testPostStudent() throws Exception {
    Map<String, Object> req = Map.of("firstName", "John", "lastName", "Doe", "userName", "johndoe",
        "email", "hello@world.com", "password", "team007");

    mockMvc.perform(post("/students").contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(req))).andExpect(status().isCreated());
  }

  /**
   * Students Test: Get John and all students.
   *
   * @throws Exception
   */
  @Test
  void testGetStudent() throws Exception {
    mockMvc.perform(get("/students")).andExpect(status().isOk());

    mockMvc.perform(get("/students/1")).andExpect(status().isOk())
        .andExpect(jsonPath("$.userName").value("johndoe"));
  }

  /**
   * Students Test: Update John and check.
   *
   * @throws Exception
   */
  @Test
  void testPutStudent() throws Exception {
    Map<String, Object> req = Map.of("firstName", "JohnNew", "lastName", "DoeNew", "userName",
        "johndoeNew", "email", "hello@world.com", "password", "team007");

    mockMvc.perform(put("/students/1").contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(req))).andExpect(status().isOk());

    mockMvc.perform(get("/students/1")).andExpect(status().isOk())
        .andExpect(jsonPath("$.userName").value("johndoeNew"));
  }

  /* Grade */
  @Test
  void testGetGrade() throws Exception {
    mockMvc.perform(get("/grades")).andExpect(status().isOk());
  }
}
