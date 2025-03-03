# 脚本

要注意脚本文件的格式必须是**UTF-8 with BOM**,而非`UTF-8`，否则在直接安装或导入时，脚本中中文会出现乱码导致导入解析脚本失败。  
[\_DOpusDefinitions.d.ts](_DOpusDefinitions.d.ts)是类型提示文件，没有实际上的功能，方便写脚本时命令提示，来源于[cy-gh/DOpus_ScriptingHelper](https://github.com/cy-gh/DOpus_ScriptingHelper)。

## 命令脚本

通过**脚本管理**进行添加的脚本。
一般会增加命令或者对事件监听进行一定的操作。

### 自动解压 - [SmartExtract](/script/SmartExtract.js)

增加一个命令`SmartExtract`，用于解决解压时文件没有文件夹或同名文件夹嵌套问题。  
包含一个设置项`CONFIG_FORCE_UNNEST`是否开启强制取消嵌套。  
类似 `Bandizip`的自动解压。规则如下:

1. 创建一个与压缩包同名的文件夹，并将压缩包的内容解压至其中
2. 如果内容的最外层有多个文件或文件夹，不进行任何操作
3. 如果内容的最外层只有一个文件夹，根据是否开启强制取消嵌套进行操作
4. 未开启强制取消嵌套时，仅在最外层目录和压缩包同名时，往上移动一级该目录
5. 开启强制取消嵌套时，将把最外层目录先重命名为压缩包名称，然后往上移动一级该目录

#### 额外依赖

无

#### 例子

`SmartExtract <path1> [<path2> ...]`

1. 解压单个文件`SmartExtract 压缩文件A的全路径`=>`SmartExtract C:/Users/nyable/Downloads/A.zip`
2. 解压多个文件`SmartExtract 压缩文件A的全路径 压缩文件B的全路径`=>`SmartExtract C:/Users/nyable/Downloads/A.zip C:/Users/nyable/Downloads/B.zip`
3. 解压选中的多个文件`SmartExtract {allfilepath$}`，可以自定义一个按钮，类型选择`标准功能(DOpus或外部程序)`，内容`SmartExtract {allfilepath$}`，选择压缩文件并点击按钮后，会解压所选的所有压缩文件。

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

## 非命令脚本

一般用于添加到自定义按钮之类的触发式执行。

### 调用 yt-dlp 下载视频 - [YtDlpInvoke](/script/YtDlpInvoke.js)

调用命令行工具[yt-dlp](https://github.com/yt-dlp/yt-dlp)进行视频的下载，支持直接选用最佳质量和显示所有格式化并自选。

#### 额外依赖

1. 需要[yt-dlp](https://github.com/yt-dlp/yt-dlp)

## 重命名脚本

### 常见番剧(字幕)标准化 - [ReNameBangumi](/script/ReNameBangumi.js)

重命名脚本，用于将常见字幕组发布格式的文件格式化为`番剧名 - S1E1` 此类适合刮削的名称。

- eg:`[XXX组] K-ON!! [01][Ma10p_1080p][x265_flac_2aac].ass`=>`K-ON!! - S1E1.ass`
