# 命令

## 自动解压-SmartExtract

[SmartExtract](/script/SmartExtract.js)
增加一个内部命令`SmartExtract`，用于解决解压时文件没有文件夹或同名文件夹嵌套问题。类似 Banzip 的自动解压。

- eg:解压单个文件`SmartExtract 压缩文件A的全路径`=>`SmartExtract C:/Users/nyable/Downloads/A.zip`
- eg:解压多个文件`SmartExtract 压缩文件A的全路径 压缩文件B的全路径`=>`SmartExtract C:/Users/nyable/Downloads/A.zip C:/Users/nyable/Downloads/B.zip`

* 如果压缩文件根目录是单个文件夹,且与压缩文件同名,则将文件夹直接解压出来
* 其他情况均解压到与压缩文件同名的文件夹内
* 如果已经存在同名文件夹,则会提示是否覆盖,而不会重命名文件夹

# 重命名脚本
