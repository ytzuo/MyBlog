---
title: 'Java和Kotlin的混用——一次小翻车'
description: '关于Java和Kotlin的编译时机'
pubDate: 'Feb 10 2026'
heroImage: '../../assets/BlogImg/Java vs Kotlin.jpg'
heroImageScale: 0.4
tags: ['Java','Kotlin','记录']
---


xx校xx中心项目的后端是 **Java** + **Springboot** 开发。


嗯，很常规的技术栈，也很成熟，大家都很熟悉这一套技术栈下的开发流程。直到有一天，有一位开发人员（没错就是我）脑洞大开，说：“既然 Kotlin 可以和 Java 互操作，为什么不在项目中混用它们呢？享受一下现代编程语言的便利”

首先，为了快速验证能不能成功在项目中混用 Java 和 Kotlin，我在项目里使用 Kotlin 写了一个新的Controller，暴露一个 `/hello` 接口，当调用这个接口时，返回一个简单的字符串 `Hello, Kotlin!`。大概就是这样：
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
然后我点击 IDEA 的那个小三角，项目顺利启动。我在浏览器里访问 `http://localhost:8080/test/hello`，成功返回了 `Hello, Kotlin!`。

于是我把分支上传到仓库，自动CI/CD结束后，项目被成功部署到服务器，其他成员访问 `http://开发域名/test/hello`，却返回了 `404 Not Found`。于是“差评”飞到群里，要求我马上检查一下。

我首先检查CI/CD是否成功，答案是肯定的。但是为什么没有这个 `/hello` 接口呢？我检查项目的CI/CD脚本，发现在脚本中，使用 `./mvnw clean package` 打包项目。我意识到，可能是由于开发环境的不同导致的问题，导致实际上在项目部署到服务器后，并没有正确构建 Kotlin 部分的代码。

我在本地执行 
``` shell
mvn clean package
jar tf target/xxx.jar | grep "HelloController"
```
结果并没有找到 `HelloController` 类！所以这个问题出在 IDEA 构建和 mvn 构建的差异上！

**我没有显示指定 Kotlin 代码的路径！** 这导致 Kotlin 编译器找不到 Kotlin 代码，自然也不会编译它。

接着，我检查 pom.xml 文件中关于编译过程的配置：
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
            <!-- ❌ 没有指定 phase，默认绑定到 compile 阶段 -->
        </execution>
    </executions>
</plugin>
```
嗯，在 compile 阶段编译 Kotlin 代码，看起来相当合理。
但是不合理的地方就在这里 ———— Kotlin 代码的编译在 compile 阶段，这可能与 Java 代码同时编译或在其之后编译。

`javac` ———— Java 语言的编译器，只能读取已经编译的 `.class` 文件，不能直接“看懂” `.kt` 文件。

`kotlinc` ———— Kotlin 语言的编译器，可以直接读取和解析 `.java` 文件，并引用未编译的 Java 类。

在一个 Java 和 Kotlin 混合的项目中，可能有这样的依赖情况：

- **场景1**: Kotlin代码 → 引用Java代码

- **场景2**: Java代码 → 引用Kotlin代码

那么在场景1中，Kotlin 代码引用了 Java 代码，这是没有问题的。因为 Kotlin 编译器可以直接读取和解析 Java 类，而不需要先编译 Java 代码。

但是在场景2中，Java 代码引用了 Kotlin 代码，这就涉及到一个问题：Java 代码在编译时，需要先编译 Kotlin 代码，才能引用 Kotlin 类。这就要求 Kotlin 代码必须在 Java 代码之前编译。

所以，为了确保在 Java 代码中引用 Kotlin 类时，Kotlin 代码已经被编译，我们需要在 Maven 构建中，显式地配置 Kotlin 代码的编译顺序。

具体来说，我们可以在 pom.xml 中，为 Kotlin 插件添加一个 `compile` 执行，将其绑定到 `compile` 阶段之前。这样，在编译 Java 代码时，Kotlin 代码就会先被编译，确保 Java 代码可以引用 Kotlin 类。

```xml
<build>
    <!-- 显式声明源代码目录 -->
    <sourceDirectory>${project.basedir}/src/main/java</sourceDirectory>
    <testSourceDirectory>${project.basedir}/src/test/java</testSourceDirectory>

    <plugins>
        <!-- 1. Spring Boot 插件 -->
        <plugin>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-maven-plugin</artifactId>
        </plugin>

        <!-- 2. Kotlin 插件：必须在 Java 之前编译 -->
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
                <!-- 主代码编译：绑定到 process-sources 阶段 -->
                <execution>
                    <id>compile</id>
                    <phase>process-sources</phase>
                    <goals>
                        <goal>compile</goal>
                    </goals>
                </execution>
                <!-- 测试代码编译：绑定到 process-test-sources 阶段 -->
                <execution>
                    <id>test-compile</id>
                    <phase>process-test-sources</phase>
                    <goals>
                        <goal>test-compile</goal>
                    </goals>
                </execution>
            </executions>
        </plugin>

        <!-- 3. Java 编译器：保持在 compile 阶段 -->
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
<br>

**对比一下两个不同配置的编译阶段：** 

| **阶段** | **错误配置** | **正确配置** |
|:---|:---|:---|
| process-sources | (无操作) | ✅ Kotlin 编译<br>生成 Kotlin .class |
| compile | ❌ Kotlin + Java 同时<br>或顺序不确定<br>互相冲突 | ✅ Java 编译<br>引用 Kotlin .class |
| 结果 | ❌ 类找不到或缺失 | ✅ 所有类正确生成 |


修改完成后，我重新编译项目，再次检查是否包含 Kotlin 类的 .class 文件。发现所有 Kotlin 类都被成功编译，生成了对应的 .class 文件。