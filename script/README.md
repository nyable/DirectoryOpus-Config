# 脚本

要注意脚本文件的格式必须是**UTF-8 with BOM**,而非`UTF-8`，否则在直接安装或导入时，脚本中中文会出现乱码导致导入解析脚本失败。  
[_DOpusDefinitions.d.ts](_DOpusDefinitions.d.ts)是类型提示文件，没有实际上的功能，方便写脚本时命令提示，来源于[cy-gh/DOpus_ScriptingHelper](https://github.com/cy-gh/DOpus_ScriptingHelper)。



## 命令脚本
通过**脚本管理**进行添加的脚本。
一般会增加命令或者对事件监听进行一定的操作。

### 自动解压 - [SmartExtract](/script/SmartExtract.js)  


增加一个内部命令`SmartExtract`，用于解决解压时文件没有文件夹或同名文件夹嵌套问题。类似 `Bandizip`的自动解压。规则如下: 
- 如果压缩文件根目录是单个文件夹，且与压缩文件同名，则将文件夹直接解压出来。
- 其他情况均解压到与压缩文件同名的文件夹内。
- 如果已经存在同名文件夹，则会提示是否覆盖，而不会重命名文件夹。

#### 额外依赖

无

#### 例子

`SmartExtract <path1> [<path2> ...]`

1. 解压单个文件`SmartExtract 压缩文件A的全路径`=>`SmartExtract C:/Users/nyable/Downloads/A.zip`
2. 解压多个文件`SmartExtract 压缩文件A的全路径 压缩文件B的全路径`=>`SmartExtract C:/Users/nyable/Downloads/A.zip C:/Users/nyable/Downloads/B.zip`
3. 解压选中的多个文件`SmartExtract {allfilepath$}`，可以自定义一个按钮，类型选择`标准功能(DOpus或外部程序)`，内容`SmartExtract {allfilepath$}`，选择压缩文件并点击按钮后，会解压所选的所有压缩文件。

### 重新打开关闭的标签页 - [RecoverCloseTab](/script/RecoverCloseTab.js)  

增加一个内部命令`RecoverTab`，用于重新打开关闭的标签页。可以通过`自定义-快捷键`设置快捷键触发。
实际上只是重新打开关闭标签页的路径而已，维护了一个缓存关闭标签页的数组，关闭时push至末尾，恢复时从末尾取出。并不会恢复各种布局状态等，不会缓存直接关闭窗口中的标签页，也不会把标签页恢复到对应的窗口，在哪个窗口激活后就在哪个窗口重新打开。
虽然可以实现，但是要管理各种操作记录和布局状态，写的有点难受，暂时懒得做了。


#### 额外依赖

无

#### 例子

`RecoverTab [index]` 重新打开缓存中第index索引的标签。无参数则默认为`-1`(倒数第1个，即最新关闭的)。

脚本管理中的可配置项:
  1. CONFIG_MAX_CACHE_SIZE:最大缓存数 默认:20
  2. CONFIG_NO_FOCUS_RECOVERED_TAB:不聚焦到重新打开的标签页 默认:true
  3. CACHE_PERSIST:是否持久化缓存，即重启后依然保持缓存 默认:false


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
