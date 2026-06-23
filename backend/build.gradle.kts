import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

plugins {
    kotlin("jvm") version "1.7.10"
    base
    application
}

allprojects {
    group = "org.light"
    version = "1.0-SNAPSHOT"

    repositories {
        mavenCentral()
    }

    tasks.withType<Test> {
        useJUnitPlatform()
    }

    tasks.withType<KotlinCompile>().configureEach {
        kotlinOptions.jvmTarget = "11"
    }
}

tasks.named<JavaExec>("run") {
    group = "application"
    description = "Run the application"
    classpath = sourceSets["main"].runtimeClasspath
    args = mutableListOf("server", "config.yml")
}

application {
    mainClass.set("org.light.challenge.AppKt")
}

dependencies {
    implementation(kotlin("stdlib"))
    implementation(Libraries.microutils_logging)
    implementation(Libraries.dropwizard_core)
    implementation(Libraries.jackson_kotlin)
    implementation(Libraries.jackson_jsr310)
    testImplementation(Libraries.mockk)
    testImplementation(Libraries.junit_jupiter_api)
    testRuntimeOnly(Libraries.junit_jupiter_engine)
}
