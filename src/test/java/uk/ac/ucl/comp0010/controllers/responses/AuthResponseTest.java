package uk.ac.ucl.comp0010.controllers.responses;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class AuthResponseTest {

  @Test
  void constructorSetsFields() {
    AuthResponse response = new AuthResponse("alice", "token123");

    assertEquals("alice", response.getUsername());
    assertEquals("token123", response.getToken());
  }

  @Test
  void settersUpdateFields() {
    AuthResponse response = new AuthResponse("bob", "token321");

    response.setUsername("charlie");
    response.setToken("newToken");

    assertEquals("charlie", response.getUsername());
    assertEquals("newToken", response.getToken());
  }
}
