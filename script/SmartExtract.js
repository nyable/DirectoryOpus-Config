﻿///<reference path="_DOpusDefinitions.d.ts" />
//@ts-check
// SmartExtract
// (c) 2024 nyable

// This is a script for Directory Opus.
// See https://www.gpsoft.com.au/endpoints/redirect.php?page=scripts for development information.

/**
 增加一个内部命令`SmartExtract`，用于解决解压时文件没有文件夹或同名文件夹嵌套问题。类似 Banzip 的自动解压。

- eg:解压单个文件`SmartExtract 压缩文件A的全路径`=>`SmartExtract C:/Users/nyable/Downloads/A.zip`
- eg:解压多个文件`SmartExtract 压缩文件A的全路径 压缩文件B的全路径`=>`SmartExtract C:/Users/nyable/Downloads/A.zip C:/Users/nyable/Downloads/B.zip`

* 如果压缩文件根目录是单个文件夹,且与压缩文件同名,则将文件夹直接解压出来
* 其他情况均解压到与压缩文件同名的文件夹内
* 如果已经存在同名文件夹,则会提示是否覆盖,而不会重命名文件夹
 */
/**
 * 是否开启强制取消嵌套(对根文件夹进行重命名和移动)
 * 
 */
var CONFIG_FORCE_UNNEST = 'CONFIG_FORCE_UNNEST'
// Called by Directory Opus to initialize the script
function OnInit(initData) {
  initData.name = "SmartExtract"
  initData.version = "1.0"
  initData.copyright = "(c) 2024 nyable"

  initData.desc = "自动解压(AutoSmartExtract):SmartExtract fullpath"
  initData.default_enable = true
  initData.min_version = "12.0"
  DOpus.output(initData)
  var cmd = initData.addCommand()
  cmd.name = 'SmartExtract'
  cmd.method = 'OnSmartExtract'
  cmd.desc = initData.desc
  cmd.label = "SmartExtract"
  cmd.template = "SOURCE/M"



  initData.config[CONFIG_FORCE_UNNEST] = false

  var configDescMap = DOpus.create().map()
  configDescMap.set(CONFIG_FORCE_UNNEST, '是否开启强制取消嵌套(对根文件夹进行重命名和移动)')

  initData.config_desc = configDescMap

}

function OnSmartExtract(cmdData) {
  var args = cmdData.func.args
  var cmd = cmdData.func.command
  if (!args.got_arg.source) {
    DOpus.output('需要选择至少一个压缩文件！', true)
    return
  }
  var targetList = args.source
  var targetSize = targetList.length
  DOpus.output('选中' + targetSize + '个文件')

  for (var i = 0; i < targetSize; i++) {
    var zipPath = targetList[i]
    if (DOpus.fsUtil().exists(zipPath)) {
      var target = DOpus.fsUtil().getItem(zipPath)
      // 文件的全路径
      var fullPath = target.realpath
      // 文件的简单名称(不包括扩展名)
      var fileNameStem = target.name_stem
      var fileParentPath = target.path
      var extractDir = fileParentPath + '/' + fileNameStem
      DOpus.output('开始解压文件: ' + fullPath + ' => ' + extractDir)
      var result = cmd.RunCommand("COPY " + wrapPath(fullPath) + " EXTRACT=sub HERE")
      if (result) {
        DOpus.output('解压完毕: ' + fullPath)
        var folderEnum = DOpus.fsUtil().readDir(extractDir)

        while (!folderEnum.complete) {
          // 读前3个文件就够了,如果只有1个文件夹且文件夹是同名文件夹则往上一级移动,否则不作处理
          /**
           * @type {DOpusVector}
           */
          var innerRootFiles = folderEnum.next(3)
          var fileCount = innerRootFiles.count
          if (fileCount == 1) {
            var firstFile = innerRootFiles[0]
            if (firstFile.is_dir) {
              var firstRealPath = firstFile.RealPath
              var innerDirName = firstFile.name
              var forceUnnest = Script.config[CONFIG_FORCE_UNNEST]
              if (forceUnnest) {
                // 开启强制取消嵌套时,把内部目录重命名为压缩包的名称,这样后面移动的时候就会取消嵌套
                var renameCmd = 'RENAME FROM ' + wrapPath(firstRealPath) + ' TO ' + wrapPath(fileNameStem) + ' TYPE=dirs'
                DOpus.output("开启强制取消嵌套,执行重命名命令: " + renameCmd)
                cmd.RunCommand(renameCmd)
                innerDirName = fileNameStem
              }
              if (innerDirName == fileNameStem) {
                var sourcePath = wrapPath(fileParentPath + '\\' + innerDirName + '\\' + innerDirName)
                var moveCmd = 'COPY MOVE ' + sourcePath + ' TO ' + wrapPath(fileParentPath)
                cmd.RunCommand(moveCmd)
                DOpus.output("将目录: " + sourcePath + " 移动至 " + fileParentPath + " :" + moveCmd)
              }
            }
          }
          break
        }

      } else {
        DOpus.output('解压失败: ' + fullPath, true)
      }
    } else {
      DOpus.output('解压时文件不存在,跳过该文件: ' + zipPath, true)
      continue
    }

  }

}

function wrapPath(path) {
  if (path) {
    return '"' + path + '"'
  }
  return '""'
}