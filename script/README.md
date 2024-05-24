# 脚本

要注意脚本文件的格式必须是**UTF-8 with BOM**,而非`UTF-8`，否则在直接安装或导入时，脚本中中文会出现乱码导致导入解析脚本失败。  
[_DOpusDefinitions.d.ts](_DOpusDefinitions.d.ts)是类型提示文件，没有实际上的功能，方便写脚本时命令提示，来源于[cy-gh/DOpus_ScriptingHelper](https://github.com/cy-gh/DOpus_ScriptingHelper)。



## 命令

### 自动解压 - [SmartExtract](/script/SmartExtract.js)  


增加一个内部命令`SmartExtract`，用于解决解压时文件没有文件夹或同名文件夹嵌套问题。类似 Banzip 的自动解压。

- 如果压缩文件根目录是单个文件夹,且与压缩文件同名,则将文件夹直接解压出来
- 其他情况均解压到与压缩文件同名的文件夹内
- 如果已经存在同名文件夹,则会提示是否覆盖,而不会重命名文件夹

#### 额外依赖

无

#### eg

标准命令

1. 解压单个文件`SmartExtract 压缩文件A的全路径`=>`SmartExtract C:/Users/nyable/Downloads/A.zip`
2. 解压多个文件`SmartExtract 压缩文件A的全路径 压缩文件B的全路径`=>`SmartExtract C:/Users/nyable/Downloads/A.zip C:/Users/nyable/Downloads/B.zip`
3. 解压选中的多个文件`SmartExtract {allfilepath$}`，可以自定义一个按钮,类型选择`标准功能(DOpus或外部程序)`，内容`SmartExtract {allfilepath$}`，选择压缩文件并点击按钮后，会解压所选的所有压缩文件。

### 调用 yt-dlp 下载视频 - [YtDlpInvoke](/script/YtDlpInvoke.js)


调用命令行工具[yt-dlp](https://github.com/yt-dlp/yt-dlp)进行视频的下载，支持直接选用最佳质量和显示所有格式化并自选。

#### 额外依赖

1. 需要[yt-dlp](https://github.com/yt-dlp/yt-dlp)

## 重命名脚本

### 常见番剧(字幕)标准化 - [ReNameBangumi](/script/ReNameBangumi.js)


重命名脚本，用于将常见字幕组发布格式的文件格式化为`番剧名 - S1E1` 此类适合刮削的名称。

- eg:`[XXX组] K-ON!! [01][Ma10p_1080p][x265_flac_2aac].ass`=>`K-ON!! - S1E1.ass`
