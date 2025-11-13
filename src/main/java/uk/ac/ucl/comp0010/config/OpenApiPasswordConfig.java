package uk.ac.ucl.comp0010.config;

import static org.springframework.http.MediaType.APPLICATION_JSON_VALUE;

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
import java.util.Objects;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.CollectionUtils;

/**
 * Ensures that the generated OpenAPI documentation reflects the required password field for non-GET
 * requests enforced by {@link ApiPasswordFilter}.
 */
@Configuration
public class OpenApiPasswordConfig {

  private static final String PASSWORD_FIELD = "password";

  @Bean
  public OpenApiCustomizer passwordFieldCustomiser() {
    return this::customiseOpenApi;
  }

  private void customiseOpenApi(OpenAPI openApi) {
    if (openApi.getPaths() == null) {
      return;
    }

    for (Map.Entry<String, PathItem> entry : openApi.getPaths().entrySet()) {
      PathItem pathItem = entry.getValue();
      if (pathItem == null) {
        continue;
      }

      pathItem.readOperationsMap().forEach((method, operation) -> {
        if (method == null || method == PathItem.HttpMethod.GET
            || method == PathItem.HttpMethod.OPTIONS || operation == null) {
          return;
        }

        RequestBody requestBody = operation.getRequestBody();
        if (requestBody == null) {
          operation.setRequestBody(newPasswordOnlyRequestBody());
          return;
        }

        Content content = requestBody.getContent();
        if (content == null || content.isEmpty()) {
          requestBody.setContent(newPasswordOnlyContent());
          return;
        }

        content.forEach((mediaTypeKey, mediaTypeValue) -> {
          if (mediaTypeValue == null) {
            return;
          }

          if (Objects.equals(mediaTypeKey, APPLICATION_JSON_VALUE) || Objects.equals(mediaTypeKey,
              org.springframework.http.MediaType.APPLICATION_JSON_VALUE)) {
            ensurePasswordSchema(mediaTypeValue);
          }
        });
      });
    }
  }

  private void ensurePasswordSchema(MediaType mediaType) {
    Schema<?> schema = mediaType.getSchema();
    if (schema == null) {
      mediaType.setSchema(passwordOnlySchema());
      return;
    }

    if (schema instanceof ComposedSchema composedSchema) {
      if (!hasPasswordSchema(composedSchema)) {
        composedSchema.addAllOfItem(passwordMixinSchema());
      }
      return;
    }

    if (schema.get$ref() != null) {
      ComposedSchema composedSchema = new ComposedSchema();
      composedSchema.addAllOfItem(schema);
      composedSchema.addAllOfItem(passwordMixinSchema());
      mediaType.setSchema(composedSchema);
      return;
    }

    addPasswordProperty(schema);
  }

  private boolean hasPasswordSchema(ComposedSchema composedSchema) {
    if (CollectionUtils.isEmpty(composedSchema.getAllOf())) {
      return false;
    }

    return composedSchema.getAllOf().stream().anyMatch(this::schemaContainsPasswordField);
  }

  private boolean schemaContainsPasswordField(Schema<?> schema) {
    if (schema == null || CollectionUtils.isEmpty(schema.getProperties())) {
      return false;
    }
    return schema.getProperties().containsKey(PASSWORD_FIELD);
  }

  private void addPasswordProperty(Schema<?> schema) {
    if (schemaContainsPasswordField(schema)) {
      return;
    }

    schema.properties(Map.of(PASSWORD_FIELD, passwordSchema()));
    schema.addRequiredItem(PASSWORD_FIELD);
  }

  private Schema<?> passwordOnlySchema() {
    return passwordMixinSchema();
  }

  private ObjectSchema passwordMixinSchema() {
    ObjectSchema schema = new ObjectSchema();

    schema.setProperties(Map.of(PASSWORD_FIELD, passwordSchema()));

    return schema;
  }

  private StringSchema passwordSchema() {
    StringSchema passwordSchema = new StringSchema();
    passwordSchema.setDescription("Shared API password.");
    passwordSchema.setExample("team007");
    return passwordSchema;
  }

  private RequestBody newPasswordOnlyRequestBody() {
    RequestBody requestBody = new RequestBody();
    requestBody.setRequired(true);
    requestBody.setContent(newPasswordOnlyContent());
    return requestBody;
  }

  private Content newPasswordOnlyContent() {
    Content content = new Content();
    MediaType mediaType = new MediaType();
    mediaType.setSchema(passwordOnlySchema());
    content.addMediaType(APPLICATION_JSON_VALUE, mediaType);
    return content;
  }
}
