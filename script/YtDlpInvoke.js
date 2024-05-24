///<reference path="./_DOpusDefinitions.d.ts" />
//@ts-check
// SmartExtract
// (c) 2024 nyable

// This is a script for Directory Opus.
// See https://www.gpsoft.com.au/endpoints/redirect.php?page=scripts for development information.

/**
 * 点击时弹出对话框,根据选项调用yt-dlp
 * @param {DOpusClickData} clickData 
 * @returns 
 */
function OnClick (clickData) {
  DOpus.clearOutput()
  var appPath = 'yt-dlp'

  var dlg = DOpus.dlg()

  dlg.window = DOpus.listers[0]
  dlg.message = "输入URL后点击解析获取可用格式\n也可以直接下载(最佳可用质量)"
  dlg.title = "yt-dlp"
  dlg.buttons = "直接下载|自定义输出|取消"
  dlg.icon = "warn"
  dlg.max = 256 // enable the text field
  // dlg.options(0).label = "Checkbox option 1"
  // dlg.options(1).label = "Checkbox option 2"

  var ret = dlg.show()
  var url = dlg.input
  DOpus.output("Input URL is: " + url)
  // DOpus.Output("The two checkboxes were set to " + dlg.options(0).state + " and " + dlg.options(1).state)


  if (!/^(((ht|f)tps?):\/\/)?.+/.test(url)) {
    DOpus.output("URL不合法,不进行任何操作")
    DOpus.dlg().request('输入不合法,不进行操作!', '确定')
    return
  }
  var cmd = clickData.func.command
  var dirPath = clickData.func.sourceTab.path

  if (ret == 1) {
    DOpus.output("直接下载")
    var r = appPath + ' "' + url + '"' + ' -P "' + dirPath + '"'
    DOpus.output('执行命令: ' + r)
    cmd.runCommand(r)
  } else if (ret == 2) {
    DOpus.output("自定义格式")
    var formatInfo = GetFormatInfo(appPath, url)
    if (!formatInfo) {
      var eInfo = "地址:" + url + "解析结果为空,结束执行"
      DOpus.output(eInfo)
      DOpus.dlg().request(eInfo, '确定')
      return
    }
    var formatDlg = DOpus.dlg()
    formatDlg.window = DOpus.listers[0]
    formatDlg.message = "勾选需要的格式化选项,将作为-f后的参数"
    formatDlg.title = formatInfo.title + '[' + formatInfo.id + ']'
    formatDlg.buttons = "确定|取消"
    formatDlg.icon = "warn"
    formatDlg.max = 128 // enable the text field
    var choices = []
    var list = []

    var formatList = formatInfo.formats

    for (var i = 0; i < formatList.length; i++) {
      var fo = formatList[i]
      choices.push(rightPad(i, 3) + '. ' + fo.ext + '(' + fo.resolution + ')   ' + (fo.filesize ? (formatBytes(fo.filesize)) : 'unknown') + '  ' + fo.format)
      list.push(false)
    }


    formatDlg.choices = choices
    formatDlg.list = list

    // formatDlg.options(0).label = "Checkbox option 1"
    // formatDlg.options(1).label = "Checkbox option 2"
    var formatRet = formatDlg.show()

    DOpus.output("Dialog.Show returned " + formatRet)
    var params = []
    for (var i = 0; i < list.length; i++) {
      var flag = formatDlg.list[i]
      // DOpus.Output("list " + i + "returned " + formatDlg.list[i])
      if (flag) {
        var formatId = formatList[i].format_id
        params.push(formatId)
      }
    }
    if (params.length > 0) {
      var r = appPath + ' "' + url + '" -f ' + '"' + params.join('+') + '" -P "' + dirPath + '"'
      DOpus.output('执行命令: ' + r)
      cmd.runCommand(r)
    }

  } else {
    DOpus.output("取消或无定义")
  }





}

function GetFormatInfo (appPath, url) {
  DOpus.output('获取视频' + url + '格式信息')
  var result = RunEx(appPath, url + " -j")
  if (result.returncode == '0') {
    var obj = JSON.parse(result.stdout)
    var id = obj.id
    var title = obj.title
    var formats = obj.formats
    DOpus.output('获取视频' + title + '[' + id + ']' + '格式信息' + formats.length + '条')
    return obj
  }
}

function rightPad (str, len) {
  while (str.length < len) {
    str = "0" + str
  }
  return str
}

///////////////////////////////////////////////////////////////////////////////
function RunEx (exe, params) {
  params = (params ? " " + params : "")
  var shell = new ActiveXObject("WScript.Shell")
  var exec = shell.Exec(exe + params)
  var stdOut = "", stdErr = ""

  while (exec.Status == 0) {
    stdOut += exec.StdOut.ReadAll()
    stdErr += exec.StdErr.ReadAll()
  }

  return {
    returncode: exec.ExitCode,
    stdout: stdOut,
    stderr: stdErr
  }
}

function formatBytes (bytes) {
  if (bytes === undefined || bytes === null) {
    return "unknown"
  }

  if (bytes === 0) return '0Bytes'

  var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  var i = Math.floor(Math.log(bytes) / Math.log(1024))

  return (bytes / Math.pow(1024, i)).toFixed(2) + sizes[i]
}