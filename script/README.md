# 脚本

要注意脚本文件的格式必须是**UTF-8 with BOM**,而非`UTF-8`，否则在直接安装或导入时，脚本中中文会出现乱码导致导入解析脚本失败。  
[\_DOpusDefinitions.d.ts](_DOpusDefinitions.d.ts)是类型提示文件，没有实际上的功能，方便写脚本时命令提示，来源于[cy-gh/DOpus_ScriptingHelper](https://github.com/cy-gh/DOpus_ScriptingHelper)。

## 命令脚本

通过**脚本管理**进行添加的脚本。
一般会增加命令或者对事件监听进行一定的操作。

### 自动解压 - [SmartExtract](/script/SmartExtract.js)

增加一个命令 `SmartExtract`，用于智能解压压缩包，自动避免无意义的文件夹嵌套问题。  
类似 `Bandizip` 的智能解压功能，通过预检查压缩包结构和配置项，进行不同的解压策略。


#### 配置选项

脚本包含三个可配置项，可在 **脚本管理** 中设置：

1. **WRAP_SINGLE_FILE** (默认: `true`)
   - 单个文件是否创建文件夹包裹
   - `true`: 单个文件解压到同名文件夹
   - `false`: 单个文件直接解压到当前目录

2. **RENAME_FOLDER_TO_ARCHIVE** (默认: `false`)
   - 单个文件夹是否重命名为压缩包名
   - `true`: 根文件夹重命名为压缩包名
   - `false`: 保持原文件夹名

3. **FORCE_UNNEST** (默认: `false`)
   - 强制取消嵌套（单个文件夹时始终直接解压）
   - `true`: 单个根文件夹始终直接解压，配合 RENAME_FOLDER_TO_ARCHIVE 可选择是否重命名
   - `false`: 使用默认智能判断逻辑


| 压缩包 | 内容 | 配置 | 结果 |
|--------|------|------|------|
| `test.zip` | `test/` (同名文件夹) | 默认 | `test/` (直接解压) |
| `test.zip` | `content/` (不同名文件夹) | 默认 | `test/content/` |
| `test.zip` | `content/` | FORCE_UNNEST=true | `content/` (直接解压) |
| `v1.0.zip` | `app/` | FORCE_UNNEST=true<br>RENAME_FOLDER=true | `v1.0/` (重命名) |
| `data.zip` | `f1.txt`, `f2.txt` | 默认 | `data/f1.txt`, `data/f2.txt` |
| `readme.zip` | `readme.txt` | WRAP_SINGLE_FILE=false | `readme.txt` (直接解压) |

#### 额外依赖

无

#### 使用示例

`SmartExtract <path1> [<path2> ...]`

1. **解压单个文件**：
   ```
   SmartExtract "C:\Downloads\test.zip"
   ```
   或在按钮中使用：`SmartExtract {filepath}`

2. **解压多个选中的文件**：
   ```
   SmartExtract "C:\Downloads\file1.zip" "C:\Downloads\file2.zip"
   ```
   或在按钮中使用：`SmartExtract {allfilepath$}`

3. **自定义按钮示例**：
   - 新建按钮，类型选择 `标准功能(DOpus或外部程序)`
   - 命令内容填写：`SmartExtract {allfilepath$}`
   - 选中一个或多个压缩包后点击按钮即可批量解压


### 重新打开关闭的标签页 - [RecoverCloseTab](/script/RecoverCloseTab.js)

增加命令`RecoverTab`，用于重新打开关闭的标签页。可以通过`自定义-快捷键`设置快捷键触发。
实际上只是重新打开关闭标签页的路径而已，维护了一个缓存关闭标签页的数组，关闭时 push 至末尾，恢复时从末尾取出，所以并不会恢复各种布局状态等，在哪个窗口激活后就在哪个窗口重新打开标签页。
设置里可以开启缓存关闭窗口中的标签页。

增加命令`ClearRecoverTabCache`，清除缓存数据。

#### 额外依赖

无

#### 例子

`RecoverTab [index]` 重新打开缓存中第 index 索引的标签。无参数则默认为`-1`(倒数第 1 个，即最新关闭的)。

脚本管理中的可配置项:

1. MAX_CACHE_SIZE:最大缓存数 默认:20
2. NO_FOCUS_RECOVERED_TAB:不聚焦恢复的标签页 默认:true
3. CACHE_PERSIST:是否持久化缓存，即重启后依然保持缓存 默认:false
4. ENABLE_LISTER_CACHE:是否缓存关闭的窗口 默认:false
5. MIN_SIZE_LISTER_CACHE_START:缓存窗口所需最少标签页数量，即窗口中的标签页小于该数值时不进行缓存 默认:2

### 调用 yt-dlp 下载视频 - [YtDlpInvoke](/script/YtDlpInvoke.js)

调用命令行工具[yt-dlp](https://github.com/yt-dlp/yt-dlp)进行视频的下载，支持直接选用最佳质量和显示所有格式化并自选。

#### 配置选项

脚本包含多个可配置项，可在 **脚本管理** 中设置，按前缀分类：

**A_ (App / 程序设置)**
- `A_YtDlpPath`: `yt-dlp` 可执行文件路径 (默认: `yt-dlp`)

**C_ (Cookie / Cookie 设置)**
- `C_ExtraCookieDir`: 额外的 Cookie 搜索目录 (默认: `/mydocuments`)
- `C_AutoCookie`: 是否自动扫描并启用 Cookie (默认: `false`)

**D_ (Download / 下载设置)**
- `D_WriteSubs`: 下载字幕 (默认: `false`)
- `D_WriteAutoSubs`: 下载自动生成的字幕 (默认: `false`)
- `D_WriteThumbnail`: 下载缩略图/封面 (默认: `false`)
- `D_EmbedThumbnail`: 嵌入缩略图到文件 (默认: `false`)
- `D_EmbedMetadata`: 嵌入元数据 (默认: `false`)
- `D_MergeFormat`: 视频合并格式 (如 `mp4`, `mkv`)，留空使用默认
- `D_AudioFormat`: 音频下载格式 (如 `mp3`, `m4a`)，留空使用默认
- `D_CreateSubfolder`: 将文件保存到以标题命名的子目录中 (默认: `false`)

**N_ (Network / 网络设置)**
- `N_Proxy`: 网络代理地址 (如 `http://127.0.0.1:7890`)，留空不使用

#### 额外依赖

1. 需要[yt-dlp](https://github.com/yt-dlp/yt-dlp)



## 重命名脚本

### 常见番剧(字幕)标准化 - [ReNameBangumi](/script/ReNameBangumi.js)

重命名脚本，用于将常见字幕组发布格式的文件格式化为`番剧名 - S1E1` 此类适合刮削的名称。

- eg:`[XXX组] K-ON!! [01][Ma10p_1080p][x265_flac_2aac].ass`=>`K-ON!! - S1E1.ass`
