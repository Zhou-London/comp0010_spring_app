# UCL COMP0010 GROUP 007

- Team: Team 007
- Authors: Rain Zhao, Junwei Liang, Zhouzhou Zhang

![Poster](assets/poster.png)

## Introduction

A simple full-stack project based on **Spring-Boot**.

## Feature

**Industrial-level architecture.**

- All of our team members have intern experience in web development. We set up authentication for all non-GET API, while making it scalable. The application is designed to be 3-Layer and ready to deploy.

**Clean, Modern UI Integration.**

- We use react + vite + react router + tailwind css to support modern UI, as well as keeping codebase simple.

**Scalable Database Design.**

- Entities are clean and elegant, which makes it easier to support more features.

**Modern CI/CD Workflow**

- Every deliver is ensured to be working well and robust.

## Get Started

Run the application. Backend port is **2800**.

```bash
mvn spring-boot:run
```

Head to **OpenAPI** Doc and start testing APIs.

    http://localhost:2800/swagger-ui/index.html#

Alternatively, use **curl**.

```bash
curl -X GET localhost:2800/grade
```

Run the frontend server. Frontend port is **5173**.

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
mvn compile test checkstyle:check spotbugs:check verify site
```