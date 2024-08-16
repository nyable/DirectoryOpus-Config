# 资源

## 图标 - Icons

### 仪表盘图标 - dashboard-icons(1537)

超过 1500 个仪表盘图标  
[dashboard-icons](Dashboard%20Icons%20v93ab09f.dis)  
来源: https://github.com/walkxcode/dashboard-icons

## 按钮 - Buttons

### 显示状态的清空回收站

[清空回收站按钮](清空回收站.dcf)

来源:https://resource.dopus.com/t/empty-recycle-bin-with-icon-matching-state/34153  
作者:@Leo (Directory Opus developer)

- 点击后弹框确认清空回收站，图标会根据回收站是否有文件切换。

在自定义模式下把 dcf 文件拖入想要放置的位置即可，不想要确认弹框把`@confirm`那行整行删掉。

### 调用 FFmpeg 进行格式转换和压制

调用 FFmpeg 进行一些媒体处理

[FFmpeg 按钮组](FFmpeg.dcf)
[维护脚本](script/FFMpegInvoke.js)

1. 简单图片格式转换
2. 简单视频转换
3. 视频压制(CRF)

在自定义模式下把 dcf 文件拖入想要放置的位置即可

### 对比和计算文件的 Hash 值

调用内置的`DOpus.fsUtil().hash`方法计算文件的 Hash 值。  
支持的算法`['md5', 'sha1', 'sha256', 'sha512', 'blake3', 'crc32']`。

标签页 1 Compare 的功能是比较输入 hash 值和文件的实际 hash 值是否一致，会根据输入 hash 值长度的不同，选取 hash 算法进行计算然后比对。  
标签页 2 Hash 的功能是根据勾选的算法计算文件的 hash 值。默认勾选的配置在脚本文件的变量`types`中根据`checked`判断。

[按钮](Hash%20Compare.dcf)
[维护脚本](script/FileHashCompare.js)

在自定义模式下把 dcf 文件拖入想要放置的位置即可

## 主题 - Themes

无
