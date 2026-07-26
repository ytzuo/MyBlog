---
title: "Mixing Java and Kotlin: A Small Build Failure"
description: "A lesson about Java and Kotlin compilation order in Maven"
pubDate: "Feb 10 2026"
heroImage: "../../../assets/BlogImg/Java vs Kotlin.jpg"
heroImageScale: 0.4
tags: ["Java", "Kotlin", "Notes"]
lang: "en"
translationKey: "java和kotlin的混用一次小翻车"
---

## Trying Kotlin in a Java project

One campus backend was built with Java and Spring Boot—a familiar and mature stack. Since Kotlin interoperates with Java, I decided to add a little Kotlin and enjoy some conveniences of a more modern language.

## Everything worked in IDEA

For a quick experiment, I wrote a Kotlin controller:

```kotlin
@RestController
@RequestMapping("/test")
class HelloController {
    @GetMapping("/hello")
    fun hello(): String {
        return "Hello, Kotlin!"
    }
}
```

The application started normally from IDEA, and `http://localhost:8080/test/hello` returned `Hello, Kotlin!`.

## The deployed endpoint returned 404

I pushed the branch and let CI/CD deploy it. On the server, the same endpoint returned `404 Not Found`.

The pipeline itself had succeeded, but it used `./mvnw clean package`, so I suspected that IDEA and Maven were building the mixed-language project differently.

## The Kotlin class was missing from the Maven package

I reproduced the package locally:

```shell
mvn clean package
jar tf target/xxx.jar | grep "HelloController"
```

`HelloController` was absent. I had not explicitly configured the Kotlin source path, so Maven's Kotlin compiler had not compiled the new code at all.

## Mixed compilation order is not automatic

The original Kotlin plugin configuration looked reasonable at first:

```xml
<plugin>
    <groupId>org.jetbrains.kotlin</groupId>
    <artifactId>kotlin-maven-plugin</artifactId>
    <version>2.2.21</version>
    <configuration>
        <jvmTarget>21</jvmTarget>
        <compilerPlugins><plugin>spring</plugin></compilerPlugins>
    </configuration>
    <executions>
        <execution>
            <id>compile</id>
            <goals><goal>compile</goal></goals>
            <!-- No explicit phase -->
        </execution>
    </executions>
</plugin>
```

But binding both Java and Kotlin work to `compile` can leave the order ambiguous.

`javac` can consume compiled `.class` files, but it does not understand `.kt` source files. `kotlinc`, by contrast, can inspect Java source while compiling Kotlin.

That gives mixed projects two cases:

- Kotlin references Java: Kotlin can inspect the Java source.
- Java references Kotlin: Kotlin must already have produced the required `.class` files.

To support both directions, the Maven lifecycle needs an explicit order.

## Compile Kotlin before Java

I moved Kotlin compilation to `process-sources`, kept Java compilation in `compile`, and declared both source directories:

```xml
<build>
    <sourceDirectory>${project.basedir}/src/main/java</sourceDirectory>
    <testSourceDirectory>${project.basedir}/src/test/java</testSourceDirectory>

    <plugins>
        <plugin>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-maven-plugin</artifactId>
        </plugin>

        <plugin>
            <groupId>org.jetbrains.kotlin</groupId>
            <artifactId>kotlin-maven-plugin</artifactId>
            <version>2.2.21</version>
            <configuration>
                <jvmTarget>21</jvmTarget>
                <sourceDirs>
                    <sourceDir>${project.basedir}/src/main/kotlin</sourceDir>
                    <sourceDir>${project.basedir}/src/main/java</sourceDir>
                </sourceDirs>
                <compilerPlugins>
                    <plugin>spring</plugin>
                    <plugin>lombok</plugin>
                </compilerPlugins>
            </configuration>
            <dependencies>
                <dependency>
                    <groupId>org.jetbrains.kotlin</groupId>
                    <artifactId>kotlin-maven-allopen</artifactId>
                    <version>2.2.21</version>
                </dependency>
                <dependency>
                    <groupId>org.jetbrains.kotlin</groupId>
                    <artifactId>kotlin-maven-lombok</artifactId>
                    <version>2.2.21</version>
                </dependency>
            </dependencies>
            <executions>
                <execution>
                    <id>compile</id>
                    <phase>process-sources</phase>
                    <goals><goal>compile</goal></goals>
                </execution>
                <execution>
                    <id>test-compile</id>
                    <phase>process-test-sources</phase>
                    <goals><goal>test-compile</goal></goals>
                </execution>
            </executions>
        </plugin>

        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-compiler-plugin</artifactId>
            <version>3.11.0</version>
            <configuration>
                <source>21</source>
                <target>21</target>
                <annotationProcessorPaths>
                    <path>
                        <groupId>org.projectlombok</groupId>
                        <artifactId>lombok</artifactId>
                        <version>1.18.30</version>
                    </path>
                </annotationProcessorPaths>
            </configuration>
        </plugin>
    </plugins>
</build>
```

The lifecycle now had a predictable shape:

| Phase | Broken configuration | Correct configuration |
|:--|:--|:--|
| `process-sources` | No action | Kotlin compiles and produces `.class` files |
| `compile` | Java and Kotlin can overlap or run in the wrong order | Java compiles against Kotlin classes |
| Result | Classes can be missing | All classes are packaged |

## Verify the artifact, not only the IDE

After rebuilding, the Kotlin classes appeared in the JAR. The lesson was straightforward: IDE success does not prove that the CI build lifecycle is correct. In a mixed Java/Kotlin Maven project, source directories and compilation order should be explicit, and the final artifact should be inspected at least once.
