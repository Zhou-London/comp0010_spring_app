package uk.ac.ucl.comp0010.config;

import static org.assertj.core.api.Assertions.assertThat;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.PathItem;
import io.swagger.v3.oas.models.media.ComposedSchema;
import io.swagger.v3.oas.models.media.Content;
import io.swagger.v3.oas.models.media.MediaType;
import io.swagger.v3.oas.models.media.ObjectSchema;
import io.swagger.v3.oas.models.media.Schema;
import io.swagger.v3.oas.models.media.StringSchema;
import io.swagger.v3.oas.models.parameters.RequestBody;
import java.util.Map;
import org.junit.jupiter.api.Test;

/**
 * Tests for {@link OpenApiPasswordConfig} to ensure password schemas are injected as expected.
 */
class OpenApiPasswordConfigTest {

  private final OpenApiPasswordConfig config = new OpenApiPasswordConfig();

  @Test
  void addsPasswordRequestBodyWhenMissing() {
    OpenAPI openApi = new OpenAPI();
    PathItem pathItem = new PathItem();
    pathItem.post(new io.swagger.v3.oas.models.Operation());
    openApi.path("/students", pathItem);

    config.passwordFieldCustomiser().customise(openApi);

    RequestBody requestBody = openApi.getPaths().get("/students")
        .getPost().getRequestBody();

    assertThat(requestBody.getRequired()).isTrue();
    Schema<?> schema = requestBody.getContent()
        .get(org.springframework.http.MediaType.APPLICATION_JSON_VALUE).getSchema();
    assertThat(schema.getProperties()).containsKey("password");
  }

  @Test
  void enrichesExistingContentAndSchemas() {
    OpenAPI openApi = new OpenAPI();
    PathItem pathItem = new PathItem();

    MediaType mediaType = new MediaType();
    mediaType.setSchema(new ObjectSchema());
    RequestBody requestBody = new RequestBody();
    Content content = new Content();
    content.addMediaType(org.springframework.http.MediaType.APPLICATION_JSON_VALUE, mediaType);
    requestBody.setContent(content);

    io.swagger.v3.oas.models.Operation putOperation = new io.swagger.v3.oas.models.Operation();
    putOperation.setRequestBody(requestBody);
    pathItem.put(putOperation);
    openApi.path("/modules", pathItem);

    config.passwordFieldCustomiser().customise(openApi);

    Schema<?> schema = openApi.getPaths().get("/modules").getPut().getRequestBody()
        .getContent().get(org.springframework.http.MediaType.APPLICATION_JSON_VALUE).getSchema();
    assertThat(schema.getProperties()).containsKey("password");
    assertThat(schema.getRequired()).contains("password");
  }

  @Test
  void wrapsReferencedSchemasWithPasswordMixin() {
    OpenAPI openApi = new OpenAPI();
    PathItem pathItem = new PathItem();

    MediaType mediaType = new MediaType();
    Schema<Object> referenced = new Schema<>();
    referenced.set$ref("#/components/schemas/Student");
    mediaType.setSchema(referenced);

    RequestBody requestBody = new RequestBody();
    Content content = new Content();
    content.addMediaType(org.springframework.http.MediaType.APPLICATION_JSON_VALUE, mediaType);
    requestBody.setContent(content);

    pathItem.operation(PathItem.HttpMethod.PATCH, new io.swagger.v3.oas.models.Operation()
        .requestBody(requestBody));
    openApi.path("/students/{id}", pathItem);

    config.passwordFieldCustomiser().customise(openApi);

    Schema<?> schema = openApi.getPaths().get("/students/{id}").getPatch().getRequestBody()
        .getContent().get(org.springframework.http.MediaType.APPLICATION_JSON_VALUE).getSchema();

    assertThat(schema).isInstanceOf(ComposedSchema.class);
    ComposedSchema composed = (ComposedSchema) schema;
    assertThat(composed.getAllOf()).hasSize(2);
    assertThat(composed.getAllOf().get(1).getProperties()).containsKey("password");
  }

  @Test
  void recognisesExistingPasswordMixinInComposedSchema() {
    OpenAPI openApi = new OpenAPI();
    PathItem pathItem = new PathItem();

    ObjectSchema passwordSchema = new ObjectSchema();
    passwordSchema.properties(Map.of("password", new StringSchema()));

    ComposedSchema composedSchema = new ComposedSchema();
    composedSchema.addAllOfItem(new ObjectSchema());
    composedSchema.addAllOfItem(passwordSchema);

    MediaType mediaType = new MediaType();
    mediaType.setSchema(composedSchema);

    RequestBody requestBody = new RequestBody();
    Content content = new Content();
    content.addMediaType(org.springframework.http.MediaType.APPLICATION_JSON_VALUE, mediaType);
    requestBody.setContent(content);

    pathItem.operation(PathItem.HttpMethod.POST, new io.swagger.v3.oas.models.Operation()
        .requestBody(requestBody));
    openApi.path("/registrations", pathItem);

    config.passwordFieldCustomiser().customise(openApi);

    Schema<?> schema = openApi.getPaths().get("/registrations").getPost().getRequestBody()
        .getContent().get(org.springframework.http.MediaType.APPLICATION_JSON_VALUE).getSchema();
    assertThat(schema).isInstanceOf(ComposedSchema.class);
    assertThat(((ComposedSchema) schema).getAllOf()).hasSize(2);
  }
}

