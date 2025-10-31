# 1.0 Src

https://moodle.ucl.ac.uk/pluginfile.php/8828541/mod_resource/content/9/CW.html

## 1.1 Rules

- Use **Maven**
- Use the root package name of **uk.ac.ucl.comp0010**.
- **JDK 17** or laters
- **JUnit 5** or lower
- Test coverage of **90%** or higher.
- May help: Checkstyle, Spotbugs, JaCoCo

## 1.2 Style

- No tab indent.
- Indent 2 spaces.
- Method and variable name with lower camel case.
- Class name with upper camel case.
- Package name with only lower case.
- Constant variable name with screaming snake case.
- No checkstyle violation with 'Google Java Style'.

## 1.3 Run Test

Use the following command to run test. Make sure there is "Build Success" before making any PR.

```bash
mvn compile test checkstyle:check spotbugs:check verify site
```

The test results can be found:

- CheckStyle: /target/site/checkstyle/checkstyle.html
- Jacoco: /target/site/jacoco/index.html

# 2.0 Other Useful Tips

Some practice I suggested to follow.

## 2.1 Git

Commit/Push.

- Use VSCode built-in Git support to commit/push/solve conflict.

- Use Http if you are not familiar with ssh.

- Don't commit all your code at once. Think about what have you done on each file and group them before commiting.

- Commit message must start with a verb(s) (E.g. Commits, Updates, Creates...)

- Check your changes before any commit. (E.g. I've once pissed up my mentor through commiting a space.)

Use Git CLI to control version.

- Head back to last n commit.

  git reset --hard HEAD~n
  git reset --hard HEAD~1
  ...

- Create your own branch.

  git checkout -b your-branch

- Pull updates from other branch.

  git checkout origin/your-branch
  git fetch origin
  git merge origin/target-pull-branch

Manage your .gitignore. Here are some useful rules.

- .cache
- build
- \*.env

## 2.2 Formatter

For consistency of code style, we better use a formatter.

- VSCode: Red Hat Java Support provides a default formatter. ".vscode" file includes the configuration.

- IntelliJ: Built-in Formatter should work well.

## 2.3 Editor

For VSCode, press alt+z or option+z to enable "visual new line". This is **super important**. The "real new line" is managed by formatter and we are gonna keep it consistent.

For IntelliJ, this is not default hotkey. But you can right‑click on the blank area to the right of the line numbers, as shown in the figure. Then check Soft‑Wrap, and the script will automatically wrap lines

## 2.4 JavaDoc

When there is an empty line, do not even type space.

```
    /**
    * Type someting...
    *(Do NOT even type a single space!)
    * @param
    * @return
    */
```
