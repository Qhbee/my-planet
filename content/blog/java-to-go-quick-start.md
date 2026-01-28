---
title: "快速 Java 转 Go 入门指南：基础语法和常用特性对比"
description: 我从Java转向Golang的过程中，常常因为不同点而犯错，所以主要关注两者的不同。文章参考：字节内部课和刘丹冰老师的B站课程。
date: 2024-11-23
image: https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/f983688e6c3046d49fbd1f201fdb60e2~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAgUWhiZWU=:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiMTc3NTAyNjE4NzUzNTE5NCJ9&rk3s=f64ab15b&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1770190275&x-orig-sign=4GpvOPCGsr7xrhjnuy1Rwp1LnR4%3D
minRead: 8
author:
  name: Qhbee
  avatar:
    src: /avatar.jpg
    alt: Qhbee
---

# 快速 Java 转 Go 入门指南：基础语法和常用特性对比

我是从Java语言转向Golang的学习，在转向过程中，常常因为不同点而犯错，所以主要关注两者的不同。

文章参考：字节内部课和刘丹冰老师的B站课程


## 运行与编译

首先，Java和Go语言在运行和编译方面有一些显著的不同。下面我将通过对比的方式，介绍这两种语言的运行和编译过程。

### Java 的运行和编译

**编译Java代码：**
Java代码首先需要被编译成字节码（`.class`文件），这些字节码可以在Java虚拟机（JVM）上运行。编译Java代码通常使用`javac`命令：

```shell
javac path/HelloWorld.java
```
这将生成`HelloWorld.class`文件。

**运行Java代码：**
编译后的Java字节码需要在JVM上运行。这可以通过`java`命令完成：

```shell
java path.HelloWorld
```
这里的`path.HelloWorld`是包含main方法的类的完全限定名。

### Go 的运行和编译

**编译和运行Go代码：**
Go语言提供了一个简单的命令来编译和运行Go程序。使用`go run`命令可以直接编译并运行Go程序，无需显式编译成单独的可执行文件：

```shell
go run path/main.go
```
这将编译`main.go`并运行生成的程序。

**编译Go代码：**
如果你想单独编译Go代码而不运行它，可以使用`go build`命令。这将生成一个可执行文件（在Windows上是`.exe`文件，在Unix-like系统上是不带扩展名的可执行文件）：

```shell
go build path/main.go
```
这将在当前目录下生成一个可执行文件（或在`path`指定的目录下）。

### 对比

- **编译过程：**
  - Java需要显式地使用`javac`命令来编译代码，而Go使用`go build`或`go run`命令，后者在编译的同时也运行程序。
  - Java编译生成的是字节码，这些字节码需要JVM来执行；Go编译生成的是平台相关的可执行文件，可以直接在操作系统上运行。

- **运行过程：**
  - Java程序需要JVM环境，运行时需要指定类名。Java程序的运行与平台有关，因为JVM实现了平台无关性。
  - Go程序直接编译成可执行文件，不需要额外的环境支持。Go程序的运行与平台有关，因为可执行文件是为特定操作系统和架构编译的。

- **依赖管理：**
  - Java使用类路径（CLASSPATH）来管理依赖，而Go使用模块（`go.mod`文件）来管理依赖。Go的依赖管理更为现代和集成，支持自动下载和更新依赖。

- **跨平台编译：**
  - Java的跨平台编译需要为不同的平台编译不同的字节码，而Go可以为不同的平台编译不同的可执行文件。Go支持交叉编译，即在一种平台上编译出另一种平台的可执行文件。

总的来说，Go的编译和运行过程更加简洁和一体化，而Java则依赖于JVM，提供了更广泛的平台无关性。Go的编译通常更快，生成的可执行文件更轻量级，这使得Go在需要快速部署和运行的场合非常有优势。



## 微观层面：

我总结了一些具体的Golang和Java基础语法上的不同，以及相应的代码示例：

### 换行

注意：Go语言不需要分号作为语句结束符，但是需要换行

### 声明变量

声明单个变量

方法一：声明一个变量 默认的值是0
```go
var a int
```
方法二：声明一个变量，初始化一个值
```go
var b string ="b"
```
方法三：在初始化的时候，可以省去数据类型，通过值自动匹配当前的变量的数据类型
```go
var c = true
fmt.Printf("cc=%s,type of cc=gT\n",cc, cc)
```
方法四：(常用的方法)省去var关键字，直接自动匹配
```go
e := 100

```
同时声明多个变量
```go
var c, d int = 1, 2
var e, f = 12.3, "Qhbee"

var x, y int
var ( //这种分解的写法,一般用于声明全局变量
a int
b bool
)
```

常量把var换成const即可


### 条件语句

**Java:**
```java
if (condition) {
    // 当条件为真时执行
} else {
    // 当条件为假时执行
}
```

**Golang:**
```go
if condition {
    // 当条件为真时执行
} else {
    // 当条件为假时执行
}
```
在Golang中，不需要在条件周围使用括号。

注意：Go语言没有三目运算符，所以不支持?: 形式的条件判断。


### 循环语句

**Java:**
```java
for (int i = 0; i < 10; i++) {
    // 循环体
}

while (condition) {
    // 循环体
}
```

**Golang:**
```go
for i := 0; i < 10; i++ {
    // 循环体
}

for {
    // 无限循环
    if condition {
        break // 当条件满足时退出循环
    }
}
```
Golang中的`for`循环更为灵活，可以省略初始化和递增表达式。
Go 语言中没有while循环，只有for循环


### 数组和切片

**Java:**
```java
int[] array = new int[10];
array[0] = 1;

List<Integer> list = new ArrayList<>();
list.add(1);
```

**Golang:**
```go
array := [10]int{0: 1} // 固定长度的数组

slice := make([]int, 10) // 动态数组切片
slice[0] = 1

slice = append(slice, 1) // 向切片添加元素
```
在Golang中，数组是固定长度的，而切片是动态的，可以增长和缩小。

### 结构体

**Java:**
```java
public class Person {
    private String name;
    private int age;

    public Person(String name, int age) {
        this.name = name;
        this.age = age;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getAge() {
        return age;
    }

    public void setAge(int age) {
        this.age = age;
    }
}
```

**Golang:**
```go
type Person struct {
    Name string
    Age  int
}

func NewPerson(name string, age int) *Person {
    return &Person{Name: name, Age: age}
}

func (p *Person) GetName() string {
    return p.Name
}

func (p *Person) SetName(name string) {
    p.Name = name
}

func (p *Person) GetAge() int {
    return p.Age
}

func (p *Person) SetAge(age int) {
    p.Age = age
}
```
在Golang中，结构体字段首字母大写表示公开（public），小写表示私有（private）。方法定义需要接收者（receiver），可以是值接收者或指针接收者。

### 方法

**Java:**
```java
public class Calculator {
    public int add(int a, int b) {
        return a + b;
    }
}
```

**Golang:**
```go
package main

import "fmt"

func add(a, b int) int {
    return a + b
}

func main() {
    fmt.Println(add(1, 2))
}
```
在Golang中，方法可以定义在结构体上，也可以定义为普通的函数。Golang中没有类的概念，因此方法和函数是主要的代码组织方式。
在Golang中，函数的参数类型是在变量名后面的，而Java中是在变量名前面。Golang中没有`public`、`private`等访问修饰符，函数是否公开取决于其首字母是否大写 。

### 错误处理

**Java:**
```java
try {
    // 可能产生异常的代码
} catch (Exception e) {
    // 异常处理
}
```

**Golang:**
```go
result, err := safeDivide(10, 0)
if err != nil {
    // 错误处理
}
```
Golang中错误处理是通过返回值来实现的，通常错误作为函数的最后一个返回值，并且需要主动检查 。

### 接口

**Java:**
```java
interface MyInterface {
    void doSomething();
}

class MyClass implements MyInterface {
    public void doSomething() {
        // 实现接口方法
    }
}
```

**Golang:**
```go
type MyInterface interface {
    DoSomething()
}

type MyClass struct{}

func (m MyClass) DoSomething() {
    // 实现接口方法
}
```
Golang中的接口是隐式的，不需要显式声明实现接口，只要类型具有接口要求的所有方法，就认为实现了该接口 。

### 指针

**Java:**
```java
public class Person {
    private String name;

    public Person(String name) {
        this.name = name;
    }

    public String getName() {
        return name;
    }
}

// 使用
Person person = new Person("Alice");
String name = person.getName();
```

**Golang:**
```go
package main

import "fmt"

type Person struct {
    Name string
}

func NewPerson(name string) *Person {
    return &Person{Name: name}
}

func main() {
    person := NewPerson("Alice")
    fmt.Println(person.Name)
}
```
Golang中使用指针来操作对象，而Java中使用对象引用。Golang中通常使用构造函数模式来创建结构体实例 。

### 包和导入

**Java:**
```java
import java.util.ArrayList;

public class Main {
    public static void main(String[] args) {
        ArrayList<String> list = new ArrayList<>();
    }
}
```

**Golang:**
```go
package main

import "fmt"

func main() {
    var list []string
    // 使用list
}
```
Golang使用`package`关键字声明包，使用`import`关键字导入包 。

### 泛型（Golang 1.18+）

**Java:**
```java
List<String> list = new ArrayList<String>();
list.add("Hello");
```

**Golang:**
```go
// Golang 1.18 引入了泛型
package main

import "fmt"

func main() {
    var list []string
    list = append(list, "Hello")
    fmt.Println(list)
}
```
Golang在1.18版本中引入了泛型，可以使用类型参数来创建泛型函数、接口、结构体等 。

这些是Golang和Java在基础语法上的一些主要差异。

## 宏观层面：
从Java转向Golang时，需要注意以下几个基础语法和概念上的不同点：

### 1. **语法简洁性**：
Golang的语法比Java更为简洁，它只有25个关键字。Golang的代码通常不需要分号、括号和大括号来明确界定代码块，这些特性使得Golang的代码更加简洁和易读。

### 2. **面向对象特性**：
Golang不是纯粹的面向对象语言，它不支持继承和反射等典型的面向对象特性。Golang鼓励使用组合而不是继承，接口而不是类。

### 3. **错误处理**：
Golang使用显式的错误返回值来处理错误，而不是Java中的异常处理机制。这意味着在Golang中，您需要检查每个可能返回错误的函数调用，并相应地处理错误。

### 4. **并发编程**：
Golang内置了对并发编程的支持，包括goroutines（轻量级线程）和channels（用于在goroutines之间安全地传递数据）。这与Java的线程和同步机制相比，Golang的并发模型更轻量级，更易于使用。

### 5. **类型系统**：
Golang的类型系统与Java不同。例如，Golang中的类型声明是跟随变量名的，而Java中则是在变量名前。此外，Golang中的类型转换需要显式进行，而Java中则更隐式。

### 6. **包管理**：
Golang使用自己的包管理器和模块系统，这与Java的包和依赖管理方式不同。Golang的`import`语句用于导入包，而Java使用`import`语句来导入类。

### 7. **接口**：
Golang中的接口是隐式的，不需要显式声明类实现了哪个接口，只要类的方法满足接口的定义即可。这与Java中显式声明接口的方式不同。

### 8. **垃圾回收**：
虽然Golang和Java都有垃圾回收机制，但Golang的垃圾回收设计目标是低延迟，通常比Java的垃圾回收更高效。

### 9. **性能和资源使用**：
Golang通常在执行速度、内存管理和并发方面比Java更高效。Golang的程序通常占用更少的CPU和内存资源，这使得它在云环境中表现更好，尤其是在资源使用直接关系到成本的场景中。

### 10. **生态系统和库**：
Java拥有一个庞大且成熟的生态系统，提供了大量的库和框架，特别是在Web开发领域。而Golang虽然生态系统相对简单，但随着其在云和微服务领域的流行，社区贡献的工具、框架和库也在迅速增长。

## 学习回顾

我的编程之旅始于学校教学的C语言，那是一种古老而强大的语言，它教会了我计算机科学的基本原理和内存管理的重要性。C语言以其接近硬件的特性，让我深刻理解了计算机的工作原理。然而，随着时间的推移，实践需要我更快速地完成更复杂的任务，于是我开始自学了Python。

Python以其简洁的语法和强大的库支持，让我体验到了编程的另一种乐趣。它非常适合快速开发和原型制作，使我能够将想法迅速转化为实际的应用程序。Python的动态类型系统和解释执行方式，让我在开发过程中感到无比自由。我开始涉足数据科学和机器学习领域，Python在这方面的强大生态让我如鱼得水。

然而，随着我对软件工程的深入，我开始寻找一种能够结合C语言的性能和Python的生产力的语言。这时，Java进入了我的视野。Java作为我最常用也最熟练的语言，以其稳健的面向对象特性、跨平台能力和庞大的生态系统，成为了企业级应用开发的行业标准。我被Java的强类型系统和异常处理机制所吸引，这些特性在构建大型、复杂的系统时显得尤为重要，让我在编写大型系统时感到安心。Java的生态系统几乎无所不包，无论是Web开发、大数据分析还是移动应用，总能找到合适的库和框架。

尽管如此，随着我对并发编程和系统级编程的深入，我开始渴望一种更轻量级、更直接的语言。这时，Go（Golang）进入了我的视野。Go以其简洁的语法、强大的并发支持和近乎C语言的性能而闻名。Go的并发模型，特别是goroutines和channels，为并发编程提供了一种简单而强大的解决方案。在Go中，我可以轻松地启动成千上万个goroutines，而不会像在Java中那样担心线程管理和资源消耗。

尽管我仍然热爱Java，但Go以其独特的魅力赢得了我的心。我开始欣赏Go的简洁语法和编译速度，这让我能够在开发过程中快速迭代和测试，让我在处理系统编程和微服务架构时更加得心应手。我也开始欣赏Go的静态类型系统和垃圾回收机制，它们在提供类型安全的同时，也保持了运行时的高性能。Go的跨平台编译能力也让我能够轻松地为不同的操作系统和架构编译应用程序。

现在，我正在继续深入学习Go，探索其在云计算、容器化和微服务领域的应用。我也鼓励C、Python和Java社区的同行们尝试学习Go。这不仅仅是为了掌握一种新语言，更是为了拓宽我们的技术视野，体验不同的编程范式。

在这个快速变化的技术时代，持续学习是每个开发者的必修课。无论是C、Python、Java还是Go，我们都应该保持好奇心和学习的热情。让我们一起探索、一起成长，共同推动我们的社区向前发展。毕竟，编程不仅是工作，它也是一种艺术，一种创造，一种不断追求卓越的旅程。

## 本文总结：

以上这些是从Java转向Golang时需要注意的一些主要差异。由于Golang的设计哲学是简洁和高效，我会发现在Golang中实现某些功能比在Java中更直接和快速。

我现在很喜欢这门语言，正在继续努力学下去！希望大家一起加油！
