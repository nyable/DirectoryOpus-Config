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

// Called by Directory Opus to initialize the script
function OnInit (initData) {
  initData.name = "SmartExtract"
  initData.version = "1.0"
  initData.copyright = "(c) 2024 nyable"

  initData.desc = "自动解压(AutoSmartExtract):SmartExtract fullpath"
  initData.default_enable = true
  initData.min_version = "12.0"
  DOpus.Output(initData)
  var cmd = initData.addCommand()
  cmd.name = 'SmartExtract'
  cmd.method = 'OnSmartExtract'
  cmd.desc = initData.desc
  cmd.label = "SmartExtract"
  cmd.template = "SOURCE/M"


}

function OnSmartExtract (cmdData) {
  var args = cmdData.func.args
  var cmd = cmdData.func.command
  if (!args.got_arg.source) {
    DOpus.Output('Need select a zip file as source', true)
    return
  }
  var targetList = args.source
  DOpus.Output(targetList.length)

  for (var i = 0; i < targetList.length; i++) {
    var zipPath = targetList[i]
    if (DOpus.FSUtil.Exists(zipPath)) {
      var target = DOpus.FSUtil.GetItem(zipPath)
      // 文件的全路径
      var fullPath = target.RealPath
      // 文件的简单名称(不包括扩展名)
      var fileNameStem = target.name_stem
      var fileParentPath = target.path
      var extractDir = fileParentPath + '/' + fileNameStem
      DOpus.Output('开始解压文件:' + fullPath + '=>' + extractDir)
      var result = cmd.RunCommand("COPY " + fullPath + " EXTRACT=sub HERE")
      if (result) {
        DOpus.Output('解压完毕:' + fullPath)
        var folderEnum = DOpus.FSUtil.ReadDir(extractDir)
        while (!folderEnum.complete) {
          // 如果只有1个文件夹且文件夹是同名文件夹则往上一级移动
          var files = folderEnum.Next(5)
          var fileCount = files.count
          if (fileCount == 1) {
            var firstFile = files[0]
            if (firstFile.is_dir && firstFile.name == fileNameStem) {
              var firstRealPath = firstFile.RealPath
              cmd.RunCommand('COPY MOVE ' + firstRealPath + ' TO ' + fileParentPath)
              DOpus.Output("将目录" + firstRealPath + '移动至' + fileParentPath)
            }
          }
        }
      } else {
        DOpus.Output('解压失败:' + fullPath, true)
      }
    } else {
      DOpus.Output('解压时文件不存在,跳过该文件:' + zipPath, true)
      continue
    }

  }

}