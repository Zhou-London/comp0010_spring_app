# Rules

- Use **Maven**
- Use the root package name of **uk.ac.ucl.comp0010**.
- **JDK 17** or later
- **JUnit 5** or lower
- Test coverage of **90%** or higher.
- May help: Checkstyle, Spotbugs, JaCoCo

# Style

- No tab indent.
- Indent 2 spaces.
- Method and variable name with lower camel case.
- Class name with upper camel case.
- Package name with only lower case.
- Constant variable name with screaming snake case.
- No checkstyle violation with 'Google Java Style'.

## Run Test

mvn compile test checkstyle:check spotbugs:check verify site