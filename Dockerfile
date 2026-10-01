# Stage 1: compile Java and run JUnit tests. No host JDK or Maven is needed.
FROM maven:3.9.11-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
# Cache dependencies separately: code edits do not need a fresh download of everything.
RUN mvn -B dependency:go-offline
COPY src src
RUN mvn -B -ntp package

# Stage 2: keep only Java's runtime and the finished application.
FROM eclipse-temurin:17-jre
WORKDIR /app
# The app must not run as root. New named volumes inherit this directory's owner.
RUN groupadd --gid 10001 veloura \
    && useradd --uid 10001 --gid veloura --no-create-home veloura \
    && mkdir -p /app/server/data \
    && chown veloura:veloura /app/server/data
COPY --from=build /app/target/veloura-store-1.0.0.jar app.jar
ENV VELOURA_PRODUCTION=true \
    PORT=4000 \
    DATABASE_URL=jdbc:sqlite:/app/server/data/veloura.db
USER veloura
EXPOSE 4000
VOLUME ["/app/server/data"]
HEALTHCHECK --interval=15s --timeout=5s --start-period=45s --retries=3 \
    CMD curl --fail --silent --show-error http://127.0.0.1:4000/api/health || exit 1
ENTRYPOINT ["java", "-jar", "app.jar"]
