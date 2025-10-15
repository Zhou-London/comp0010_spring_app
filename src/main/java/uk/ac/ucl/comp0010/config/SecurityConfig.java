package uk.ac.ucl.comp0010.config;

import static org.springframework.security.config.Customizer.withDefaults;

import java.util.Arrays;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * Config to enable CORS.
 */
@Configuration
public class SecurityConfig {

  /**
   * Defines the primary security configuration and rules for the application's filter chain.
   *
   * <p>This configuration customizes the security policy by performing the following actions:
   * <ul>
   * <li>Disables CSRF protection, which is common for stateless APIs.</li>
   * <li>Enables CORS using the application's default settings.</li>
   * <li>Permits public, unauthenticated access to specific endpoints.</li>
   * <li>Requires authentication for all other requests to secure the application's endpoints.</li>
   * </ul>
   *
   * @param http the {@link HttpSecurity} object to configure.
   * @return the configured {@link SecurityFilterChain}.
   * @throws Exception if an error occurs during the configuration.
   */
  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http.csrf((csrf) -> csrf.disable()).cors(withDefaults())
        .authorizeHttpRequests(auth -> auth
        .requestMatchers("/h2-console/**", "/swagger-ui.html", "/swagger-ui/**",
          "/v3/api-docs/**").permitAll()
        .anyRequest().authenticated()
      )
        .headers(headers -> headers
        .frameOptions(options -> options.sameOrigin()));


    return http.build();
  }

  /**
   * Configure CORS source.
   *
   * <p>This method configures the CORS source.
   *
   * @return Return the source.
   */
  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOriginPatterns(Arrays.asList("*"));
    config.setAllowedHeaders(Arrays.asList("*"));
    config.setAllowedMethods(Arrays.asList("*"));
    config.setAllowCredentials(false);
    config.applyPermitDefaultValues();

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);

    return source;
  }
}
