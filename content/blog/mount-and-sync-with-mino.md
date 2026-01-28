---
title: "MinIO 的挂载与同步（Ubuntu）"
description: 比较了挂载与同步的概念，然后介绍 Ubuntu 下使用 MinIO 的实现挂载与同步，还介绍了利用 Rclone 工具来实现。
date: 2025-02-14
image: https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/14774502031348f182fae5cb287b9cd6~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAgUWhiZWU=:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiMTc3NTAyNjE4NzUzNTE5NCJ9&rk3s=f64ab15b&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1770187871&x-orig-sign=HN5Ze7moG5dhUEbGjlWwIVJn81w%3D
minRead: 10
author:
  name: Qhbee
  avatar:
    src: /avatar.jpg
    alt: Qhbee
---

# MinIO 的挂载与同步（Ubuntu）

## （一） 区分挂载与同步

在使用 MinIO 时，了解“**挂载**”和“**同步**”的区别非常重要。以下是两者的详细比较。

---

### **1. 挂载（Mount）是什么？**

挂载是一种将远程存储（如云存储、网络文件系统等）映射到本地文件系统的方式，使用户可以像访问本地磁盘一样访问远程数据，而无需将所有数据下载到本地。挂载点是一个虚拟文件系统，它仅提供访问接口，而非实际复制数据。

#### **挂载的特点：**
- **实时访问：** 不需要提前下载所有文件，只有在实际读取或写入时才会从远程存储加载数据。
- **虚拟文件系统：** 挂载点是一个虚拟文件系统，它只是提供了访问远程数据的接口，而不是真正复制数据。
- **性能依赖网络：** 由于数据存储在远程，访问速度会受到网络带宽和延迟的影响。
- **适用场景：** 需要频繁访问远程数据，或者希望将远程存储当作本地磁盘使用。

---

### **2. 同步（Sync）是什么？**

同步是将一个目录的内容复制到另一个目录，并确保目标目录与源目录内容一致的过程。同步通常是一次性操作，完成后不会继续监控源目录的变化。

#### **同步的特点：**
- **一次性操作：** 同步完成后不会继续监控源目录的变化。
- **数据一致性：** 确保目标目录与源目录的内容完全一致（包括新增、修改和删除）。
- **全量或增量：** 根据配置，可以选择全量同步或仅同步变化的部分。
- **适用场景：** 需要定期备份或一次性迁移数据。

---

### **3. 挂载 vs 同步：对比**

| 特性          | 挂载（Mount）          | 同步（Sync）       |
|-------------|--------------------|----------------|
| **数据位置**    | 数据仍然存储在远程，本地只是访问接口 | 数据会被复制到目标位置    |
| **操作方式**    | 实时访问远程数据           | 一次性操作，确保目标与源一致 |
| **性能**      | 取决于网络状况            | 取决于数据量和网络状况    |
| **适用场景**    | 需要频繁访问远程数据         | 需要备份或迁移数据      |
| **资源占用**    | 较低（仅需维护挂载点）        | 较高（可能涉及大量数据传输） |
| **是否持久化**   | 数据不在本地持久化          | 数据会在目标位置持久化    |
| **无网时是否可用** | 不可用（除非有缓存）         | 上次同步的文件可用      |
| **依赖网络的程度** | 实时依赖               | 仅在传输时依赖        |

---

### **4. 使用场景举例**

#### **挂载的典型场景：**
- 将 Google Drive 或 OneDrive 挂载为本地磁盘，直接编辑云端文件。
- 在服务器上挂载远程存储以扩展本地存储空间。
- 实时访问远程备份文件，而无需下载整个备份。

#### **同步的典型场景：**
- 定期将本地重要文件备份到云存储。
- 迁移数据到新的存储位置。
- 创建一份完整的数据副本以供离线使用。

---

### **5. 总结**
- 如果你需要 **实时访问远程数据** 并将其当作本地磁盘使用，选择 **挂载**。
- 如果你需要 **一次性将数据从一个位置迁移到另一个位置** 或定期备份数据，选择 **同步**。

---

## （二） MinIO 挂载到本地目录

挂载允许你在没有实际下载数据的情况下，通过网络实时访问远程存储。需要注意的是，在没有网络连接的情况下，挂载通常会失效。

---

### **1. 安装工具**

在 Ubuntu 上，安装 `fuse` 和 `s3fs` 工具：

```bash
sudo apt-get update
sudo apt-get install fuse s3fs
```

---

### **2. 创建凭证文件**

创建一个用于存储 MinIO 凭证的文件，例如：

```bash
echo "ACCESS_KEY:SECRET_KEY" > ~/.passwd-s3fs
chmod 600 ~/.passwd-s3fs
```

> 注意：请将 `ACCESS_KEY` 和 `SECRET_KEY` 替换为你的 MinIO 访问密钥和密钥对。

---

### **3. 创建挂载目录**

创建一个本地目录，用于挂载 MinIO 存储桶：

```bash
mkdir ~/minio-mount
```

---

### **4. 挂载存储桶**

使用 `s3fs` 命令将 MinIO 存储桶挂载到本地目录：

```bash
s3fs BUCKET_NAME ~/minio-mount \
  -o use_path_request_style \
  -o passwd_file=~/.passwd-s3fs \
  -o url=http://localhost:9000
```

> 替换 `BUCKET_NAME` 为你要挂载的存储桶名称。

现在，MinIO 的存储桶 `BUCKET_NAME` 已成功挂载到本地目录 `~/minio-mount`。你可以通过访问该目录来读取和写入 MinIO 对象。

---

## （三） MinIO 与本地目录的同步

### **使用 MinIO Client (`mc`) 实现同步功能**

MinIO 提供了一个强大的客户端工具 `mc`，可以用来管理 MinIO 存储并与本地文件夹同步。

---

#### **1. 安装 MinIO Client**

根据你的操作系统下载并安装 `mc`：

- 官方下载地址：<https://dl.min.io/client/mc/release/>

---

#### **2. 下载和安装 `mc`**

在 Linux 系统上，可以通过以下命令下载并安装 `mc`：

```bash
wget https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc
sudo mv mc /usr/local/bin/
```

验证安装是否成功：

```bash
mc --version
```

---

#### **3. 配置 MinIO 服务**

在使用 `mc` 前，需要先配置 MinIO 服务：

```bash
mc alias set myminio http://localhost:9000 YOUR_ACCESS_KEY YOUR_SECRET_KEY
```
-   `myminio` 是自定义的别名。
-   `http://localhost:9000` 是 MinIO 的访问地址。
-   `YOUR-ACCESS-KEY` 和 `YOUR-SECRET-KEY` 是 MinIO 的访问密钥和密钥对。

> 替换 `YOUR_ACCESS_KEY` 和 `YOUR_SECRET_KEY` 为你的 MinIO 访问密钥和密钥对。

---

#### **4. 同步本地文件夹到 MinIO**

使用以下命令将本地文件夹同步到 MinIO：

```bash
mc mirror /path/to/local/folder myminio/bucket-name
```

- `/path/to/local/folder` 是本地文件夹路径。
- `myminio/bucket-name` 是 MinIO 中的目标存储桶。

---

#### **5. 实时同步（监控变化）**

如果需要实时同步文件夹的变化，可以使用 `--watch` 参数：

```bash
mc mirror --watch /path/to/local/folder myminio/bucket-name
```

---

#### **6. 双向实时同步**

为了实现双向实时同步，需要分别在两个终端，运行以下两条命令：

```bash
mc mirror --watch /path/to/local/folder myminio/bucket-name
mc mirror --watch myminio/bucket-name /path/to/local/folder
```
---

## （四） 其他工具介绍：Rclone

除了 MinIO 自带的工具外，Rclone 也是一个功能强大的文件同步工具，支持多种云存储和本地文件系统。它提供了丰富的功能，例如挂载、同步以及双向同步等。

---

### **1. 安装 Rclone**

建议从官网下载最新版本，避免通过包管理器安装旧版本（如 `apt-get install` 安装的可能是旧版，且功能不全，例如缺少 `bisync` 支持）。

- 官方下载地址：<https://rclone.org/downloads/>

- 也可以通过以下命令安装最新版本的 Rclone：

    ```bash
    curl https://rclone.org/install.sh | sudo bash
    ```

验证安装是否成功：

```bash
rclone --version
```

---

### **2. 配置 MinIO**

运行以下命令开始配置 MinIO：

```bash
rclone config
```

有很多配置选项，按照命令行的指示和引导，选择对应的即可。以下是具体步骤，帮助你完成 MinIO 的配置：

---

#### **步骤 1：创建新的远程存储**

在提示中选择创建一个新的远程存储：

```
e) Edit existing remote
n) New remote
d) Delete remote
r) Rename remote
c) Copy remote
s) Set configuration password
q) Quit config
e/n/d/r/c/s/q> n
```

输入 `n` 并按回车。

---

#### **步骤 2：输入远程存储名称**

为这个远程存储输入一个名称，例如 `minio`：

```
Enter name for new remote.
name> minio
```

---

#### **步骤 3：选择存储类型**

因为 MinIO 兼容 S3 API，所以需要选择 `s3` 类型，输入 `s3` 或 `40` 并按回车：

```
Option Storage.
Type of storage to configure.
Choose a number from below, or type in your own value.
[snip]
40 / Amazon S3 Compliant Storage Provider (DigitalOcean, Ceph, Minio etc)
   \ "s3"
Storage> s3
```

---

#### **步骤 4：配置 S3 参数**

接下来，Rclone 会要求你输入与 MinIO 相关的配置参数。以下是每个参数的详细说明和示例值：

---

- **(1) 提供商**

MinIO 不是官方的 AWS S3，因此需要选择 `Other compatible provider`，输入 `Other` 或 `34` 并按回车：

```
Option provider.
Choose your S3 provider.
Choose a number from below, or type in your own value.
Press Enter to leave empty.
[snip]
34 / Any other S3 compatible provider
   \ (Other)
Provider> Other
```

---

- **(2) 获取凭证方式**

选择是否从环境变量或运行时获取凭证。如果手动输入凭证，选择 `false`：

```
Option env_auth.
Get AWS credentials from runtime (environment variables or EC2/ECS meta data if no env vars).
Only applies if access_key_id and secret_access_key is blank.
Choose a number from below, or type in your own boolean value (true or false).
Press Enter for the default (false).
1 / Enter AWS credentials in the next step.
  \ (false)
2 / Get AWS credentials from the environment (env vars or IAM).
  \ (true)
env_auth> false
```

---

- **(3) Access Key ID 和 Secret Access Key**

输入 MinIO 的访问密钥和密钥对：

```
Option access_key_id.
AWS Access Key ID.
Leave blank for anonymous access or runtime credentials.
Enter a value. Press Enter to leave empty.
access_key_id> minioadmin

Option secret_access_key.
AWS Secret Access Key (password).
Leave blank for anonymous access or runtime credentials.
Enter a value. Press Enter to leave empty.
secret_access_key> minioadmin
```

---

- **(4) Region**

如果不确定 Region，可以留空：

```
Option region.
Region to connect to.
Leave blank if you are using an S3 clone and you don't have a region.
Choose a number from below, or type in your own value.
Press Enter to leave empty.
   / Use this if unsure.
 1 | Will use v4 signatures and an empty region.
   \ ()
   / Use this only if v4 signatures don't work.
 2 | E.g. pre Jewel/v10 CEPH.
   \ (other-v2-signature)
region> 
```

---

- **(5) Endpoint**

输入 MinIO 的访问地址（例如本地运行的 MinIO 地址）：

```
Option endpoint.
Endpoint for S3 API.
Required when using an S3 clone.
Enter a value. Press Enter to leave empty.
endpoint> http://localhost:9000
```

---

- **(6) Location Constraint**

设置存储桶的位置约束（通常可以留空）：

```
Option location_constraint.
Location constraint - must be set to match the Region.
Leave blank if not sure. Used when creating buckets only.
Enter a value. Press Enter to leave empty.
location_constraint>
```

---

- **(7) ACL**

设置存储桶和对象的访问控制列表（ACL），默认为 `private`：

```
Option acl.
Canned ACL used when creating buckets and storing or copying objects.
This ACL is used for creating objects and if bucket_acl isn't set, for creating buckets too.
For more info visit https://docs.aws.amazon.com/AmazonS3/latest/dev/acl-overview.html#canned-acl
Note that this ACL is applied when server-side copying objects as S3
doesn't copy the ACL from the source but rather writes a fresh one.
If the acl is an empty string then no X-Amz-Acl: header is added and
the default (private) will be used.
Choose a number from below, or type in your own value.
Press Enter to leave empty.
   / Owner gets FULL_CONTROL.
 1 | No one else has access rights (default).
   \ (private)
   / Owner gets FULL_CONTROL.
 2 | The AllUsers group gets READ access.
   \ (public-read)
   / Owner gets FULL_CONTROL.
 3 | The AllUsers group gets READ and WRITE access.
   | Granting this on a bucket is generally not recommended.
   \ (public-read-write)
   / Owner gets FULL_CONTROL.
 4 | The AuthenticatedUsers group gets READ access.
   \ (authenticated-read)
   / Object owner gets FULL_CONTROL.
 5 | Bucket owner gets READ access.
   | If you specify this canned ACL when creating a bucket, Amazon S3 ignores it.
   \ (bucket-owner-read)
   / Both the object owner and the bucket owner get FULL_CONTROL over the object.
 6 | If you specify this canned ACL when creating a bucket, Amazon S3 ignores it.
   \ (bucket-owner-full-control)
acl> default
```

---

- **(8) 编辑高级配置**

选择是否编辑高级配置，默认为 `No`：

```
Edit advanced config?
y) Yes
n) No (default)
y/n> n
```

---

- **(9) 确认配置**

确认配置是否正确：

```
Configuration complete.
Options:
- type: s3
- provider: Other
- access_key_id: minioadmin
- secret_access_key: minioadmin
- endpoint: http://localhost:9000
- acl: default
Keep this "minio" remote?
y) Yes this is OK (default)
e) Edit this remote
d) Delete this remote
y/e/d> y
```

- **(10) 退出配置**

退出配置即可：

```
Current remotes:

Name                 Type
====                 ====
minio                s3

e) Edit existing remote
n) New remote
d) Delete remote
r) Rename remote
c) Copy remote
s) Set configuration password
q) Quit config
e/n/d/r/c/s/q> q
```

---

#### **步骤 5：验证配置**

可以通过以下命令验证配置是否成功：

```bash
rclone listremotes
```

你应该能看到刚刚配置的远程存储名称，例如 `minio:`。

---

#### **步骤 6：列出存储桶**

使用以下命令列出所有存储桶：

```bash
rclone lsd minio:
```

---

### **3. 同步文件夹**

使用以下命令将本地文件夹与 MinIO 同步：

```bash
rclone sync /path/to/local/folder remote:minio-bucket-name
```

- `remote:minio-bucket-name` 是远程存储的桶。
- `/path/to/local/folder` 是本地同步目录。
- `--verbose` 查看同步详情，输出详细日志信息。
- `--progress` 显示同步进度。

如果需要**双向同步**，可以使用 `rclone bisync`：

```bash
rclone bisync /path/to/local/folder remote:minio-bucket-name
```
> 注意：`bisync` 功能需要 Rclone 的较新版本支持。

如果想实现**实时同步**，需要借助 `inotifywait` 或者 `fswatch` 这种用于监控文件系统变化的工具。

---

### **4. 挂载远程存储**

使用以下命令将 MinIO 存储桶挂载到本地目录：

```bash
rclone mount remote:minio-bucket-name /path/to/local/folder --vfs-cache-mode writes
```

- `remote:minio-bucket-name` 是远程存储的桶。
- `/path/to/local/folder` 是本地挂载点。
- `--vfs-cache-mode writes` 是缓存模式，用于优化写操作。
- `--allow-other` 允许其他用户访问挂载点。

---

## 结语

本文介绍了如何在 Ubuntu 上使用 MinIO 进行挂载和同步操作，以及如何利用 Rclone 实现类似功能。无论是实时访问远程存储还是定期备份数据，这些工具都能满足你的需求。希望这篇文章对你有所帮助！
