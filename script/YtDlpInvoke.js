///&lt;reference path="./_DOpusDefinitions.d.ts" /&gt;
//@ts-check
// YtDlpInvoke
// (c) 2024 nyable

/**
 * 点击时弹出对话框,根据选项调用yt-dlp
 * @param {DOpusClickData} clickData 
 */
function OnClick(clickData) {
  var appPath = 'yt-dlp'

  var dlg = DOpus.dlg()
  dlg.window = DOpus.listers[0]
  dlg.message = "📥 yt-dlp 视频下载工具\n\n" +
    "请输入视频 URL（支持 YouTube、Bilibili 等）\n\n" +
    "• 直接下载：自动选择最佳质量\n" +
    "• 自定义格式：手动选择视频/音频格式\n" +
    "• 仅音频：仅下载音频并转为 MP3"
  dlg.title = "yt-dlp 视频下载"
  dlg.buttons = "直接下载|自定义格式|仅音频|取消"
  dlg.icon = "info"
  dlg.max = 512

  var ret = dlg.show()
  if (ret == 0) {
    return
  }

  var url = dlg.input ? String(dlg.input) : ""
  url = url.replace(/^\s+/, '').replace(/\s+$/, '')

  if (!url) {
    return
  }

  DOpus.output(repeatStr("=", 60))
  DOpus.output("输入的 URL: " + url)

  if (!/^https?:\/\/.+/.test(url)) {
    DOpus.dlg().request('❌ URL 格式不正确\n\n请输入以 http:// 或 https:// 开头的完整链接\n\n例如：\n• https://www.youtube.com/watch?v=xxxxx\n• https://www.bilibili.com/video/BVxxxxxx', '确定')
    return
  }

  var cmd = clickData.func.command
  var dirPath = clickData.func.sourceTab.path

  if (ret == 1) {
    // 直接下载
    DOpus.output("模式: 直接下载（最佳质量）")
    DOpus.output("")
    DOpus.output(repeatStr("=", 20) + "开始下载" + repeatStr("=", 20))
    var cmdLine = appPath + ' "' + url + '" -f "bestvideo+bestaudio/best" -P "' + dirPath + '"'
    DOpus.output('执行命令: ' + cmdLine)
    DOpus.output(repeatStr("=", 60))
    cmd.runCommand(cmdLine)

  } else if (ret == 2) {
    // 自定义格式
    DOpus.output("模式: 自定义格式选择")
    var formatInfo = GetFormatInfo(appPath, url)

    if (!formatInfo) {
      DOpus.output("❌ 获取视频信息失败")
      DOpus.dlg().request('❌ 无法获取视频信息\n\nURL: ' + url + '\n\n可能的原因：\n• 网络连接问题\n• URL 不正确或视频不可用\n• yt-dlp 未正确安装或不在 PATH 中', '确定')
      return
    }

    var formatDlg = DOpus.dlg()
    formatDlg.window = DOpus.listers[0]
    formatDlg.message = "📹 选择要下载的格式（可多选）\n\nURL: " + url
    formatDlg.title = "格式选择"
    formatDlg.buttons = "确定下载|取消"
    formatDlg.icon = "info"
    formatDlg.max = 256

    var choices = []
    var list = []
    var formatList = formatInfo.formats

    for (var i = 0; i < formatList.length; i++) {
      choices.push(formatList[i].line)
      list.push(false)
    }

    formatDlg.choices = choices
    formatDlg.list = list
    var formatRet = formatDlg.show()

    if (formatRet == 0) {
      DOpus.output("用户取消格式选择")
      return
    }

    var params = []
    for (var i = 0; i < list.length; i++) {
      if (formatDlg.list[i]) {
        params.push(formatList[i].id)
        DOpus.output("选择格式: " + formatList[i].id + " - " + formatList[i].line)
      }
    }

    if (params.length > 0) {
      DOpus.output("")
      DOpus.output(repeatStr("=", 20) + "开始下载" + repeatStr("=", 20))
      var cmdLine = appPath + ' "' + url + '" -f "' + params.join('+') + '" -P "' + dirPath + '"'
      DOpus.output('执行命令: ' + cmdLine)
      DOpus.output(repeatStr("=", 60))
      cmd.runCommand(cmdLine)
    } else {
      DOpus.output("⚠ 未选择任何格式")
      DOpus.dlg().request('⚠ 未选择任何格式\n\n请至少选择一个格式后再下载', '确定')
    }

  } else if (ret == 3) {
    // 仅音频
    DOpus.output("模式: 仅音频下载（MP3）")
    DOpus.output("")
    DOpus.output(repeatStr("=", 20) + "开始下载" + repeatStr("=", 20))
    var cmdLine = appPath + ' "' + url + '" -f bestaudio -x --audio-format mp3 -P "' + dirPath + '"'
    DOpus.output('执行命令: ' + cmdLine)
    DOpus.output(repeatStr("=", 60))
    cmd.runCommand(cmdLine)
  }
}

/**
 * 获取视频格式信息（使用 -F 选项）
 * @param {string} appPath yt-dlp路径
 * @param {string} url 视频URL
 * @returns 格式信息对象 {formats: [{id, line}]}
 */
function GetFormatInfo(appPath, url) {
  DOpus.output("")
  DOpus.output(repeatStr("=", 15) + "获取格式化信息" + repeatStr("=", 15))
  var cmdLine = appPath + ' "' + url + '" -F'
  DOpus.output('执行命令: ' + cmdLine)
  DOpus.output(repeatStr("=", 60))

  var result = RunEx(appPath, '"' + url + '" -F')
  if (result.returncode == 0) {
    var lines = result.stdout.split('\n')
    var formats = []
    var inFormatList = false

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i]

      // 跳过空行
      if (!line || line.replace(/\s/g, '') == '') {
        continue
      }

      // 检测格式列表开始
      if (line.indexOf('[info] Available formats') >= 0) {
        inFormatList = true
        DOpus.output(line)
        continue
      }

      // 跳过标题行和分隔行
      if (line.indexOf('ID') == 0 || line.indexOf('─') >= 0 || line.indexOf('─') == 0) {
        continue
      }

      // 提取格式行
      if (inFormatList && line.length > 0) {
        // 格式 ID 在行首
        var parts = line.split(/\s+/)
        if (parts.length > 0 && parts[0]) {
          var formatId = parts[0]
          formats.push({
            id: formatId,
            line: line
          })
        }
      }
    }

    DOpus.output('✓ 可用格式: ' + formats.length + ' 个')
    return { formats: formats }
  } else {
    DOpus.output('❌ yt-dlp 执行失败，返回代码: ' + result.returncode)
    if (result.stderr) {
      DOpus.output('错误信息: ' + result.stderr.substring(0, 200))
    }
  }
  return null
}

/**
 * 重复字符串
 */
function repeatStr(str, count) {
  var result = ""
  for (var i = 0; i < count; i++) {
    result += str
  }
  return result
}

/**
 * 执行命令并获取输出
 */
function RunEx(exe, params) {
  var shell = new ActiveXObject("WScript.Shell")
  var exec = shell.Exec(exe + (params ? " " + params : ""))
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