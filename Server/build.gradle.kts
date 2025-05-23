plugins {
    id("java")
    id ("org.springframework.boot") version "3.4.5"
    id ("io.spring.dependency-management") version "1.1.7"
}

group = "de.dhbwka.java.exercise.packages"
version = "1.0-SNAPSHOT"

repositories {
    mavenCentral()
}

dependencies {
    testImplementation(platform("org.junit:junit-bom:5.10.0"))
    testImplementation("org.junit.jupiter:junit-jupiter")
    implementation ("org.springframework.boot:spring-boot-starter-thymeleaf")
    implementation ("org.springframework.boot:spring-boot-starter-web")
    implementation ("org.springframework.boot:spring-boot-starter-web-services")
    testImplementation ("org.springframework.boot:spring-boot-starter-test")
    testRuntimeOnly ("org.junit.platform:junit-platform-launcher")
    implementation ("org.springframework.boot:spring-boot-starter-security")
//  Temporary explicit version to fix Thymeleaf bug
    implementation ("org.thymeleaf.extras:thymeleaf-extras-springsecurity6:3.1.2.RELEASE")
    testImplementation ("org.springframework.security:spring-security-test")
}

tasks.test {
    useJUnitPlatform()
}