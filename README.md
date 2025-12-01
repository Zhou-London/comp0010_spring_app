# UCL COMP0010 GROUP 007

- Team: Team 007
- Authors: Rain Zhao, Junwei Liang, Zhouzhou Zhang

![Poster](assets/poster.png)

## Introduction

A simple full-stack project based on **Spring-Boot**.

## Get Started

Run the application.

```bash
mvn spring-boot:run
```

Head to **OpenAPI** Doc and start testing APIs.

    http://localhost:2800/swagger-ui/index.html#

Alternatively, use **curl**.

```bash
curl -X GET localhost:2800/grade
```

Run the frontend server.

```bash
cd src/main/resources/static/frontend
npm run dev
```

For production use, build the static file, which shall be handled by a web server.

```bash
npm run build
```

Run the test.

```bash
mvn test
```