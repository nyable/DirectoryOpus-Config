///&lt;reference path="./_DOpusDefinitions.d.ts" /&gt;
//@ts-check
// YtDlpInvoke
// (c) 2024 nyable

// This is a script for Directory Opus.
// See https://www.gpsoft.com.au/endpoints/redirect.php?page=scripts for development information.

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

  // URL 验证
  if (!/^https?:\/\/.+/.test(url)) {
    DOpus.dlg().request('❌ URL 格式不正确\n\n请输入以 http:// 或 https:// 开头的完整链接\n\n例如：\n• https://www.youtube.com/watch?v=xxxxx\n• https://www.bilibili.com/video/BVxxxxxx', '确定')
    return
  }

  var cmd = clickData.func.command
  var dirPath = clickData.func.sourceTab.path

  if (ret == 1) {
    // 直接下载（最佳质量）
    DOpus.output("模式: 直接下载（最佳质量）")
    var cmdLine = appPath + ' "' + url + '" -f "bestvideo+bestaudio/best" -P "' + dirPath + '"'
    DOpus.output('执行命令: ' + cmdLine)
    DOpus.output(repeatStr("=", 60))
    cmd.runCommand(cmdLine)

  } else if (ret == 2) {
    // 自定义格式选择
    DOpus.output("模式: 自定义格式选择")
    DOpus.output("正在获取视频信息...")
    var formatInfo = GetFormatInfo(appPath, url)

    if (!formatInfo) {
      DOpus.output("❌ 获取视频信息失败")
      DOpus.dlg().request('❌ 无法获取视频信息\n\nURL: ' + url + '\n\n可能的原因：\n• 网络连接问题\n• URL 不正确或视频不可用\n• yt-dlp 未正确安装或不在 PATH 中', '确定')
      return
    }

    var formatDlg = DOpus.dlg()
    formatDlg.window = DOpus.listers[0]
    formatDlg.message = "📹 请选择要下载的格式\n\n" +
      "可以选择多个格式，将自动合并\n" +
      "（通常选择：1个视频格式 + 1个音频格式）\n\n" +
      "视频：" + formatInfo.title
    formatDlg.title = "格式选择 [" + formatInfo.id + "]"
    formatDlg.buttons = "确定下载|取消"
    formatDlg.icon = "info"
    formatDlg.max = 256

    var choices = []
    var list = []
    var formatList = formatInfo.formats

    for (var i = 0; i < formatList.length; i++) {
      var fo = formatList[i]

      // 判断格式类型
      var typeLabel = ""
      if (fo.vcodec && fo.vcodec != "none" && fo.acodec && fo.acodec != "none") {
        typeLabel = "[视+音] "
      } else if (fo.vcodec && fo.vcodec != "none") {
        typeLabel = "[视频] "
      } else if (fo.acodec && fo.acodec != "none") {
        typeLabel = "[音频] "
      }

      // 格式化显示
      var resolution = fo.resolution || "N/A"
      var size = formatSize(fo.filesize)
      var ext = fo.ext.toUpperCase()

      // 编码信息
      var codecInfo = ""
      if (fo.vcodec && fo.vcodec != "none") {
        codecInfo = fo.vcodec.substring(0, 8)
        if (fo.fps) {
          codecInfo += "@" + Math.round(fo.fps) + "fps"
        }
      }
      if (fo.acodec && fo.acodec != "none") {
        if (codecInfo) codecInfo += " + "
        codecInfo += fo.acodec.substring(0, 8)
        if (fo.abr) {
          codecInfo += "@" + Math.round(fo.abr) + "k"
        }
      }

      var desc = leftPad(i, 3) + ". " + typeLabel + ext + " " + padEnd(resolution, 12) + " " + padStart(size, 8)
      if (codecInfo) {
        desc += " [" + codecInfo + "]"
      }

      choices.push(desc)
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
        params.push(formatList[i].format_id)
        DOpus.output("选择格式: " + formatList[i].format_id + " - " + formatList[i].format)
      }
    }

    if (params.length > 0) {
      var cmdLine = appPath + ' "' + url + '" -f "' + params.join('+') + '" -P "' + dirPath + '"'
      DOpus.output('执行命令: ' + cmdLine)
      DOpus.output(repeatStr("=", 60))
      cmd.runCommand(cmdLine)
    } else {
      DOpus.output("⚠ 未选择任何格式")
      DOpus.dlg().request('⚠ 未选择任何格式\n\n请至少选择一个格式后再下载', '确定')
    }

  } else if (ret == 3) {
    // 仅音频下载
    DOpus.output("模式: 仅音频下载（MP3）")
    var cmdLine = appPath + ' "' + url + '" -f bestaudio -x --audio-format mp3 -P "' + dirPath + '"'
    DOpus.output('执行命令: ' + cmdLine)
    DOpus.output(repeatStr("=", 60))
    cmd.runCommand(cmdLine)
  }
}

/**
 * 获取视频格式信息
 * @param {string} appPath yt-dlp路径
 * @param {string} url 视频URL
 * @returns 格式信息对象
 */
function GetFormatInfo(appPath, url) {
  var result = RunEx(appPath, '"' + url + '" -j')
  if (result.returncode == 0) {
    try {
      var obj = JSON.parse(result.stdout)
      DOpus.output('✓ 视频: ' + obj.title)
      DOpus.output('✓ ID: ' + obj.id)
      DOpus.output('✓ 可用格式: ' + obj.formats.length + ' 个')
      return obj
    } catch (e) {
      DOpus.output('❌ JSON 解析失败: ' + e.message)
    }
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
 * @param {string} str 要重复的字符
 * @param {number} count 重复次数
 */
function repeatStr(str, count) {
  var result = ""
  for (var i = 0; i < count; i++) {
    result += str
  }
  return result
}

/**
 * 左侧补0
 * @param {*} str 字符串
 * @param {number} len 长度
 */
function leftPad(str, len) {
  str = str + ''
  while (str.length < len) {
    str = "0" + str
  }
  return str
}

/**
 * 右侧填充空格
 * @param {string} str 字符串
 * @param {number} len 长度
 */
function padEnd(str, len) {
  str = str + ''
  while (str.length < len) {
    str = str + ' '
  }
  return str
}

/**
 * 左侧填充空格
 * @param {string} str 字符串
 * @param {number} len 长度
 */
function padStart(str, len) {
  str = str + ''
  while (str.length < len) {
    str = ' ' + str
  }
  return str
}

/**
 * 格式化文件大小
 * @param {number} bytes 字节数
 */
function formatSize(bytes) {
  if (!bytes) return "未知"
  if (bytes < 1024) return bytes + "B"
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + "KB"
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + "MB"
  return (bytes / 1073741824).toFixed(2) + "GB"
}

/**
 * 执行命令并获取输出
 * @param {string} exe 命令
 * @param {string} params 参数
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