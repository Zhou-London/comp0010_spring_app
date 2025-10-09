package uk.ac.ucl.comp0010.models;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import org.springframework.boot.test.context.SpringBootTest;


@SpringBootTest
class StudentTest {

  private Student student;

  @BeforeEach
  void setUp() {
      student = new Student(100L, "Mari", "Ohara", "oharamari", "awashimaisland@qq.com" );
  }

  @Test
  void testConstructorAndGetter() {
    assertEquals(Long.valueOf(100L), student.getId());
    assertEquals("Mari", student.getFirstName());
    assertEquals("Ohara", student.getLastName());
    assertEquals("oharamari", student.getUserName());
    assertEquals("awashimaisland@qq.com", student.getEmail());
  }

  @Test
  void testComputeAverage_returnsPlaceholderValue() {
    float avg = student.computeAverage();
    // use delta for float comparison
    assertEquals(0.111F, avg);
  }


}
