///&lt;reference path="./_DOpusDefinitions.d.ts" /&gt;
//-@ts-check
// YtDlpInvoke
// (c) 2024 nyable

/**
 * 初始化脚本
 * @param {DOpusScriptInitData} initData 
 */
function OnInit(initData) {
  initData.name = "YtDlpInvoke"
  initData.version = "1.2"
  initData.copyright = "(c) 2024 nyable"
  initData.desc = "调用 yt-dlp 下载视频，支持自定义格式和 Cookie"
  initData.default_enable = true
  initData.min_version = "12.0"

  initData.config_desc = DOpus.Create.Map()

  initData.config.A_YtDlpPath = "yt-dlp"
  initData.config_desc.Set("A_YtDlpPath", "yt-dlp 可执行文件路径 (如果已在 PATH 中可直接填 yt-dlp)")

  initData.config.C_ExtraCookieDir = "/mydocuments"
  initData.config_desc.Set("C_ExtraCookieDir", "额外的 Cookie 搜索目录 (默认为文档目录)")

  initData.config.C_AutoCookie = false
  initData.config_desc.Set("C_AutoCookie", "是否自动扫描并启用 Cookie (默认关闭，开启后会自动扫描目录并根据结果勾选)")

  initData.config.D_WriteSubs = false
  initData.config_desc.Set("D_WriteSubs", "默认启用: 下载字幕 (--write-subs)")

  initData.config.D_WriteAutoSubs = false
  initData.config_desc.Set("D_WriteAutoSubs", "默认启用: 下载自动字幕 (--write-auto-subs)")

  initData.config.D_WriteThumbnail = false
  initData.config_desc.Set("D_WriteThumbnail", "默认启用: 下载缩略图/封面 (--write-thumbnail)")

  initData.config.D_EmbedThumbnail = false
  initData.config_desc.Set("D_EmbedThumbnail", "默认启用: 嵌入缩略图 (--embed-thumbnail)")

  initData.config.D_EmbedMetadata = false
  initData.config_desc.Set("D_EmbedMetadata", "默认启用: 嵌入元数据 (--embed-metadata)")

  initData.config.D_MergeFormat = ""
  initData.config_desc.Set("D_MergeFormat", "视频合并格式 (例如 mp4, mkv)，留空则使用默认")

  initData.config.D_AudioFormat = ""
  initData.config_desc.Set("D_AudioFormat", "音频下载格式 (例如 mp3, m4a)，留空则使用默认格式")

  initData.config.N_Proxy = ""
  initData.config_desc.Set("N_Proxy", "网络代理 (例如 http://127.0.0.1:7890)，留空不使用")

  var cmd = initData.addCommand()
  cmd.name = "YtDlpDownload"
  cmd.method = "OnYtDlpDownload"
  cmd.desc = "下载视频 (yt-dlp)"
  cmd.label = "YtDlpDownload"
  cmd.template = ""
}
/**
 * 点击时弹出对话框,根据选项调用yt-dlp
 * @param {DOpusScriptCommandData} cmdData 
 */
function OnYtDlpDownload(cmdData) {
  var appPath = Script.config.A_YtDlpPath
  var cmd = cmdData.func.command
  var dirPath = cmdData.func.sourceTab.path
  var extraCookieDir = Script.config.C_ExtraCookieDir
  var autoCookie = Script.config.C_AutoCookie

  // 获取全局配置的默认选项
  var globalOpts = {
    writeSubs: Script.config.D_WriteSubs,
    writeAutoSubs: Script.config.D_WriteAutoSubs,
    writeThumbnail: Script.config.D_WriteThumbnail,
    embedThumbnail: Script.config.D_EmbedThumbnail,
    embedMetadata: Script.config.D_EmbedMetadata,
    mergeFormat: Script.config.D_MergeFormat,
    audioFormat: Script.config.D_AudioFormat,
    proxy: Script.config.N_Proxy
  }

  // 构建通用参数 (Proxy)
  var commonArgs = ""
  if (globalOpts.proxy) {
    commonArgs += ' --proxy "' + globalOpts.proxy + '"'
    DOpus.output("✓ 使用代理: " + globalOpts.proxy)
  }

  // 1. 扫描 Cookie 文件
  // 如果开启了自动扫描，或者用户手动勾选了使用Cookie(在对话框后处理)，则需要扫描
  // 这里先根据配置决定是否预扫描
  var cookieFiles = []
  var scanned = false
  if (autoCookie) {
    cookieFiles = FindAllCookieFiles(dirPath, extraCookieDir)
    scanned = true
  }
  var hasCookieFile = cookieFiles.length > 0

  var dlg = DOpus.dlg()
  dlg.window = DOpus.listers[0]
  dlg.message = "📥 yt-dlp 视频下载工具\n\n" +
    "请输入视频 URL\n\n" +
    "• 直接下载：自动选择最佳质量\n" +
    "• 自定义格式：手动选择视频/音频格式\n" +
    "• 仅音频：仅下载音频并转为 MP3"
  dlg.title = "yt-dlp 视频下载"
  dlg.buttons = "直接下载|自定义格式|仅音频|取消"
  dlg.icon = "info"
  dlg.max = 512

  // 添加 Cookie 选项
  var cookieLabel = "使用 cookies"
  if (autoCookie) {
    if (hasCookieFile) {
      cookieLabel += " (已找到 " + cookieFiles.length + " 个文件, 将自动匹配)"
    } else {
      cookieLabel += " (未找到 cookies.txt)"
    }
  } else {
    cookieLabel += " (勾选后将扫描目录)"
  }

  dlg.options[0].label = cookieLabel
  dlg.options[0].state = hasCookieFile // 如果自动扫描且找到文件，则默认勾选；否则不勾选

  var ret = dlg.show()
  if (ret == 0) {
    return
  }

  var url = dlg.input ? String(dlg.input) : ""
  url = url.replace(/^\s+/, '').replace(/\s+$/, '')

  if (!url) {
    return
  }

  // 获取 Cookie 选项状态
  var useCookie = dlg.options[0].state
  var cookieArgs = ""
  if (useCookie) {
    // 如果之前没有扫描（因为AutoCookie=false），现在需要扫描
    if (!scanned) {
      cookieFiles = FindAllCookieFiles(dirPath, extraCookieDir)
      hasCookieFile = cookieFiles.length > 0
      scanned = true
    }

    if (hasCookieFile) {
      var bestCookie = GetBestCookieFile(url, cookieFiles)
      if (bestCookie) {
        cookieArgs = ' --cookies "' + bestCookie + '"'
        DOpus.output("✓ 使用 Cookie: " + bestCookie)
      } else {
        DOpus.output("⚠ 未找到匹配的 Cookie 文件")
      }
    } else {
      DOpus.output("⚠ 警告: 勾选了使用 Cookie 但未找到任何文件")
    }
  }

  DOpus.output(repeatStr("=", 60))
  DOpus.output("输入的 URL: " + url)

  if (!/^https?:\/\/.+/.test(url)) {
    DOpus.dlg().request('❌ URL 格式不正确\n\n请输入以 http:// 或 https:// 开头的完整链接', '确定')
    return
  }

  if (ret == 1) {
    // 直接下载
    DOpus.output("模式: 直接下载（最佳质量）")
    DOpus.output("")
    DOpus.output(repeatStr("=", 20) + "开始下载" + repeatStr("=", 20))

    // 构建直接下载的额外参数
    var extraArgs = ""
    if (globalOpts.writeSubs) extraArgs += " --write-subs"
    if (globalOpts.writeAutoSubs) extraArgs += " --write-auto-subs"
    if (globalOpts.writeThumbnail) extraArgs += " --write-thumbnail"
    if (globalOpts.embedThumbnail) extraArgs += " --embed-thumbnail"
    if (globalOpts.embedMetadata) extraArgs += " --embed-metadata"
    if (globalOpts.mergeFormat) extraArgs += ' --merge-output-format "' + globalOpts.mergeFormat + '"'

    var cmdLine = appPath + ' "' + url + '" -f "bestvideo+bestaudio/best"' + extraArgs + cookieArgs + commonArgs + ' -P "' + dirPath + '"'
    DOpus.output('执行命令: ' + cmdLine)
    DOpus.output(repeatStr("=", 60))
    cmd.runCommand(cmdLine)

  } else if (ret == 2) {
    // 自定义格式
    DOpus.output("模式: 自定义格式选择")

    // 第一步：获取格式信息 (传入 cookie 和 proxy 参数)
    var formatInfo = GetFormatInfo(appPath, url, cookieArgs + commonArgs)
    if (!formatInfo) {
      DOpus.output("❌ 获取视频信息失败")
      DOpus.dlg().request('❌ 无法获取视频信息\n\nURL: ' + url + '\n\n可能的原因：\n• 网络连接问题\n• URL 不正确或视频不可用\n• yt-dlp 未正确安装或不在 PATH 中\n• 需要 Cookie 但未提供', '确定')
      return
    }

    // 第二步：选择格式
    var formatDlg = DOpus.dlg()
    formatDlg.window = DOpus.listers[0]
    formatDlg.message = "📹 选择要下载的格式（可多选）\n\nURL: " + url
    formatDlg.title = "格式选择 (1/2)"
    formatDlg.buttons = "下一步|取消"
    formatDlg.icon = "info"

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

    if (params.length == 0) {
      DOpus.output("⚠ 未选择任何格式")
      DOpus.dlg().request('⚠ 未选择任何格式\n\n请至少选择一个格式后再下载', '确定')
      return
    }

    // 第三步：选择下载选项
    // 传入全局配置作为默认值
    var defaultValues = [
      globalOpts.writeSubs,
      globalOpts.writeAutoSubs,
      globalOpts.writeThumbnail,
      globalOpts.embedThumbnail,
      globalOpts.embedMetadata
    ]
    var extraOpts = GetDownloadOptions(defaultValues)
    if (extraOpts === null) {
      DOpus.output("用户取消选项配置")
      return
    }

    DOpus.output("")
    DOpus.output(repeatStr("=", 20) + "开始下载" + repeatStr("=", 20))
    DOpus.output(repeatStr("=", 20) + "开始下载" + repeatStr("=", 20))

    // 如果有合并格式配置，也应用到自定义下载中
    var mergeArgs = ""
    if (globalOpts.mergeFormat) {
      mergeArgs = ' --merge-output-format "' + globalOpts.mergeFormat + '"'
    }

    // 组合命令：格式参数 + 下载选项 + Cookie参数 + 代理参数 + 合并参数
    var cmdLine = appPath + ' "' + url + '" -f "' + params.join('+') + '"' + extraOpts + cookieArgs + commonArgs + mergeArgs + ' -P "' + dirPath + '"'
    DOpus.output('执行命令: ' + cmdLine)
    DOpus.output(repeatStr("=", 60))
    cmd.runCommand(cmdLine)

  } else if (ret == 3) {
    // 仅音频
    var audioFmt = globalOpts.audioFormat
    var audioArgs = " -x"

    if (audioFmt) {
      audioArgs += " --audio-format " + audioFmt
      DOpus.output("模式: 仅音频下载（" + audioFmt + "）")
    } else {
      DOpus.output("模式: 仅音频下载（默认格式）")
    }

    DOpus.output("")
    DOpus.output(repeatStr("=", 20) + "开始下载" + repeatStr("=", 20))
    var cmdLine = appPath + ' "' + url + '" -f bestaudio' + audioArgs + cookieArgs + commonArgs + ' -P "' + dirPath + '"'
    DOpus.output('执行命令: ' + cmdLine)
    DOpus.output(repeatStr("=", 60))
    cmd.runCommand(cmdLine)
  }
}

/**
 * 扫描所有可能的 Cookie 文件
 * 1. 当前工作目录 (传入参数)
 * 2. 额外配置目录 (如文档目录)
 * @param {DOpusPath} currentDir 当前工作目录
 * @param {string} extraDir 额外扫描目录
 */
function FindAllCookieFiles(currentDir, extraDir) {
  var files = []
  var fsUtil = DOpus.FSUtil

  DOpus.output("正在扫描 Cookie 文件...")

  // 1. 扫描当前工作目录
  try {
    DOpus.output("当前工作目录: " + currentDir)

    var folderEnum = fsUtil.ReadDir(currentDir)
    while (!folderEnum.complete) {
      var item = folderEnum.next()
      if (!item.is_dir && String(item.name).toLowerCase().indexOf("cookies.txt") >= 0) {
        DOpus.output("  [当前目录] 找到: " + item.name)
        files.push(String(item))
      }
    }
  } catch (e) {
    DOpus.output("扫描当前目录失败: " + e.message)
  }

  // 2. 扫描额外目录
  if (extraDir) {
    try {
      var docPath = fsUtil.Resolve(extraDir)
      DOpus.output("额外目录: " + docPath)

      var folderEnum = fsUtil.ReadDir(docPath)
      while (!folderEnum.complete) {
        var item = folderEnum.next()
        if (!item.is_dir && String(item.name).toLowerCase().indexOf("cookies.txt") >= 0) {
          DOpus.output("  [额外目录] 找到: " + item.name)
          files.push(String(item))
        }
      }
    } catch (e) {
      DOpus.output("扫描额外目录失败: " + e.message)
    }
  }

  DOpus.output("扫描完成，共找到 " + files.length + " 个 Cookie 文件")
  return files
}

/**
 * 根据 URL 选择最佳 Cookie 文件
 * 优先级：
 * 1. 完整域名匹配 (www.youtube.com_cookies.txt)
 * 2. 主域名匹配 (youtube.com_cookies.txt)
 * 3. 通用匹配 (cookies.txt)
 */
function GetBestCookieFile(url, files) {
  if (!files || files.length == 0) return null

  // 提取域名
  var domain = ""
  var match = url.match(/:\/\/(.[^/]+)/)
  if (match) {
    domain = match[1].toLowerCase()
  }

  var bestMatch = null
  var bestScore = 0

  for (var i = 0; i < files.length; i++) {
    var path = files[i]
    var name = path.split('\\').pop().toLowerCase()

    // 1. 通用 cookies.txt (分数 1)
    if (name == "cookies.txt") {
      if (bestScore < 1) {
        bestScore = 1
        bestMatch = path
      }
      continue
    }

    // 提取 cookie 文件名中的域名部分 (去掉 _cookies.txt)
    var cookieDomain = name.replace(/_cookies\.txt$/i, "")

    // 2. 完整匹配 (分数 10)
    if (cookieDomain == domain) {
      if (bestScore < 10) {
        bestScore = 10
        bestMatch = path
      }
      continue
    }

    // 3. 部分匹配/主域名匹配 (分数 5)
    // 检查 URL 域名是否包含 cookie 域名 (例如 www.youtube.com 包含 youtube.com)
    if (domain.indexOf(cookieDomain) >= 0 && cookieDomain.length > 2) {
      // 越长的匹配越精确
      var score = 5 + (cookieDomain.length / 100)
      if (score > bestScore) {
        bestScore = score
        bestMatch = path
      }
    }
  }

  return bestMatch
}

/**
 * 获取下载选项配置
 * @param {boolean[]} [defaultValues] 默认勾选状态数组
 * @returns 额外的命令行参数，如果用户取消则返回null
 */
function GetDownloadOptions(defaultValues) {
  var dlg = DOpus.dlg()
  dlg.window = DOpus.listers[0]
  dlg.message = "⚙️ 下载选项配置\n\n请选择需要的额外选项："
  dlg.title = "下载选项 (2/2)"
  dlg.buttons = "开始下载|取消"
  dlg.icon = "info"

  var choices = [
    "下载字幕 (--write-subs)",
    "下载自动字幕 (--write-auto-subs)",
    "下载缩略图/封面 (--write-thumbnail)",
    "嵌入缩略图到文件 (--embed-thumbnail)",
    "嵌入元数据 (--embed-metadata)"
  ]

  var list = defaultValues || [false, false, false, false, false]

  dlg.choices = choices
  dlg.list = list
  var ret = dlg.show()

  if (ret == 0) {
    return null
  }

  var opts = ""

  if (dlg.list[0]) {
    opts += " --write-subs"
    DOpus.output("✓ 启用: 下载字幕")
  }

  if (dlg.list[1]) {
    opts += " --write-auto-subs"
    DOpus.output("✓ 启用: 下载自动字幕")
  }

  if (dlg.list[2]) {
    opts += " --write-thumbnail"
    DOpus.output("✓ 启用: 下载缩略图/封面")
  }

  if (dlg.list[3]) {
    opts += " --embed-thumbnail"
    DOpus.output("✓ 启用: 嵌入缩略图")
  }

  if (dlg.list[4]) {
    opts += " --embed-metadata"
    DOpus.output("✓ 启用: 嵌入元数据")
  }

  return opts
}

/**
 * 获取视频格式信息（使用 -F 选项）
 * @param {string} appPath yt-dlp路径
 * @param {string} url 视频URL
 * @param {string} [extraArgs] 额外的参数（如 cookie）
 * @returns 格式信息对象 {formats: [{id, line}]}
 */
function GetFormatInfo(appPath, url, extraArgs) {
  DOpus.output("")
  DOpus.output(repeatStr("=", 15) + "获取格式化信息" + repeatStr("=", 15))
  var cmdLine = appPath + ' "' + url + '" -F' + (extraArgs || "")
  DOpus.output('执行命令: ' + cmdLine)
  DOpus.output(repeatStr("=", 60))

  var result = RunEx(appPath, '"' + url + '" -F' + (extraArgs || ""))
  if (result.returncode == 0) {
    var lines = result.stdout.split('\n')
    var formats = []
    var inFormatList = false
    var skipLines = 0  // 用于跳过标题和分隔线

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i]

      // 跳过空行
      if (!line || line.replace(/\s/g, '') == '') {
        continue
      }

      // 检测格式列表开始  
      if (line.indexOf('[info] Available formats') >= 0) {
        inFormatList = true
        skipLines = 2  // 跳过接下来的2行（标题行和分隔线）
        DOpus.output(line)
        continue
      }

      // 跳过标题行和分隔线
      if (inFormatList && skipLines > 0) {
        skipLines--
        continue
      }

      // 提取格式行
      if (inFormatList && line.length > 0) {
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
      DOpus.output('错误信息: ' + result.stderr)
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
