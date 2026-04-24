FROM eclipse-temurin:21-jdk

WORKDIR /app

COPY backend/ .

RUN chmod +x mvnw && ./mvnw clean package -DskipTests

EXPOSE 8080

CMD ["java", "-jar", "target/smartcampus-0.0.1-SNAPSHOT.jar"]