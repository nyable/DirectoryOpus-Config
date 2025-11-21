///<reference path="./_DOpusDefinitions.d.ts" />
//@ts-check
// SmartExtract
// (c) 2024 nyable

/**
 * 智能解压 - 自动避免无意义的文件夹嵌套
 * 
 * 配置项:
 * - WRAP_SINGLE_FILE: 单个文件是否创建文件夹
 * - RENAME_FOLDER_TO_ARCHIVE: 单个文件夹是否重命名为压缩包名
 * - FORCE_UNNEST: 强制取消嵌套（单个文件夹时始终直接解压）
 */

// 配置项
var CONFIG_WRAP_SINGLE_FILE = 'WRAP_SINGLE_FILE'
var CONFIG_RENAME_FOLDER = 'RENAME_FOLDER_TO_ARCHIVE'
var CONFIG_FORCE_UNNEST = 'FORCE_UNNEST'

/**
 * Called by Directory Opus to initialize the script
 * @param {DOpusScriptInitData} initData 
 */
function OnInit(initData) {
  initData.name = "SmartExtract"
  initData.version = "2.2"
  initData.copyright = "(c) 2024 nyable"
  initData.desc = "智能解压 - 自动避免无意义的文件夹嵌套"
  initData.default_enable = true
  initData.min_version = "12.0"

  var cmd = initData.addCommand()
  cmd.name = 'SmartExtract'
  cmd.method = 'OnSmartExtract'
  cmd.desc = initData.desc
  cmd.label = "SmartExtract"
  cmd.template = "SOURCE/M"

  // 配置选项
  initData.config[CONFIG_WRAP_SINGLE_FILE] = true
  initData.config[CONFIG_RENAME_FOLDER] = false
  initData.config[CONFIG_FORCE_UNNEST] = false

  var configDesc = DOpus.create().map()
  configDesc.set(CONFIG_WRAP_SINGLE_FILE, '单个文件是否创建文件夹包裹')
  configDesc.set(CONFIG_RENAME_FOLDER, '单个文件夹是否重命名为压缩包名')
  configDesc.set(CONFIG_FORCE_UNNEST, '强制取消嵌套（单个文件夹时始终直接解压）')
  initData.config_desc = configDesc
}

/**
 * 主函数 - 处理用户选择的压缩包
 * @param {DOpusScriptCommandData} cmdData 
 */
function OnSmartExtract(cmdData) {
  var args = cmdData.func.args
  var cmd = cmdData.func.command

  if (!args.got_arg.source) {
    DOpus.output('请选择至少一个压缩包', true)
    return
  }

  var archives = (/** @type {DOpusVector<DOpusItem>} */ (args.source))
  DOpus.output('📦 处理 ' + archives.count + ' 个压缩包')

  for (var i = 0; i < archives.count; i++) {
    var item = archives[i]
    processArchive(cmd, item.realpath.toString())
  }
}

/**
 * 处理单个压缩包
 * @param {DOpusCommand} cmd 
 * @param {string} archivePath 
 */
function processArchive(cmd, archivePath) {
  var item = DOpus.fsUtil().getItem(archivePath)
  if (!item) {
    DOpus.output('✗ 文件不存在: ' + archivePath, true)
    return
  }

  var zipPath = item.realpath.toString()
  var zipName = item.name_stem
  var parentPath = item.path.toString()

  DOpus.output('\n处理: ' + item.name)

  // 分析压缩包结构
  var structure = analyzeArchive(zipPath)
  if (!structure) {
    DOpus.output('  ✗ 无法读取压缩包结构')
    return
  }

  // 决定解压策略
  var strategy = determineStrategy(structure, zipName)

  // 执行解压
  executeStrategy(cmd, zipPath, parentPath, strategy)
}

/**
 * 分析压缩包结构
 * @param {string} archivePath 
 * @returns {{rootCount: number, hasRootFolder: boolean, isSingleFile: boolean, rootItemName: string}|null}
 */
function analyzeArchive(archivePath) {
  try {
    var dirEnum = DOpus.fsUtil().readDir(archivePath)
    if (dirEnum.complete) {
      return null
    }

    var rootItems = dirEnum.next(3)
    var count = rootItems.count

    if (count === 0) {
      DOpus.output('  ⚠ 压缩包为空')
      return null
    }

    var isSingleItem = (count === 1)
    var hasRootFolder = isSingleItem && rootItems[0].is_dir
    var isSingleFile = isSingleItem && !rootItems[0].is_dir
    var rootItemName = isSingleItem ? rootItems[0].name : ''

    return {
      rootCount: count,
      hasRootFolder: hasRootFolder,
      isSingleFile: isSingleFile,
      rootItemName: rootItemName
    }
  } catch (e) {
    DOpus.output('  ✗ 读取失败: ' + e.message)
    return null
  }
}

/**
 * 决定解压策略
 * @param {{rootCount: number, hasRootFolder: boolean, isSingleFile: boolean, rootItemName: string}} structure 
 * @param {string} zipName 
 * @returns {{action: string, needRename: boolean, oldName: string, newName: string, description: string}}
 */
function determineStrategy(structure, zipName) {
  var wrapSingleFile = Script.config[CONFIG_WRAP_SINGLE_FILE]
  var renameFolder = Script.config[CONFIG_RENAME_FOLDER]
  var forceUnnest = Script.config[CONFIG_FORCE_UNNEST]

  // 情况1: 单个文件
  if (structure.isSingleFile) {
    if (wrapSingleFile) {
      return {
        action: 'sub',
        needRename: false,
        oldName: '',
        newName: '',
        description: '单个文件 "' + structure.rootItemName + '" → 解压到文件夹'
      }
    } else {
      return {
        action: 'direct',
        needRename: false,
        oldName: '',
        newName: '',
        description: '单个文件 "' + structure.rootItemName + '" → 直接解压'
      }
    }
  }

  // 情况2: 单个文件夹
  if (structure.hasRootFolder) {
    var folderName = structure.rootItemName
    var isSameName = (folderName === zipName)

    if (isSameName) {
      // 同名文件夹 → 直接解压
      return {
        action: 'direct',
        needRename: false,
        oldName: '',
        newName: '',
        description: '同名根文件夹 "' + zipName + '" → 直接解压'
      }
    } else if (forceUnnest) {
      // 强制取消嵌套：不同名文件夹
      if (renameFolder) {
        // 重命名为压缩包名
        return {
          action: 'direct',
          needRename: true,
          oldName: folderName,
          newName: zipName,
          description: '强制取消嵌套: "' + folderName + '" → 重命名为 "' + zipName + '"'
        }
      } else {
        // 保持原文件夹名，直接解压
        return {
          action: 'direct',
          needRename: false,
          oldName: '',
          newName: '',
          description: '强制取消嵌套: "' + folderName + '" → 直接解压'
        }
      }
    } else if (renameFolder) {
      // 不强制取消嵌套，但需要重命名
      return {
        action: 'direct',
        needRename: true,
        oldName: folderName,
        newName: zipName,
        description: '根文件夹 "' + folderName + '" → 重命名为 "' + zipName + '"'
      }
    } else {
      // 不强制取消嵌套，也不重命名 → 解压到同名文件夹
      return {
        action: 'sub',
        needRename: false,
        oldName: '',
        newName: '',
        description: '根文件夹 "' + folderName + '" 保持原名 → 解压到 "' + zipName + '/" 内'
      }
    }
  }

  // 情况3: 多个根项目
  return {
    action: 'sub',
    needRename: false,
    oldName: '',
    newName: '',
    description: structure.rootCount + ' 个根项目 → 解压到文件夹'
  }
}

/**
 * 执行解压策略
 * @param {DOpusCommand} cmd 
 * @param {string} archivePath 
 * @param {string} parentPath 
 * @param {{action: string, needRename: boolean, oldName: string, newName: string, description: string}} strategy 
 */
function executeStrategy(cmd, archivePath, parentPath, strategy) {
  DOpus.output('  ' + strategy.description)

  // 构建解压命令
  var extractCmd = 'COPY "' + archivePath + '" EXTRACT'
  if (strategy.action === 'sub') {
    extractCmd += '=sub'
  }
  extractCmd += ' HERE'

  // 执行解压
  var result = cmd.runCommand(extractCmd)

  if (!result) {
    DOpus.output('  ✗ 解压失败', true)
    return
  }

  DOpus.output('  ✓ 解压成功')

  // 如果需要重命名
  if (strategy.needRename) {
    var oldPath = parentPath + '/' + strategy.oldName
    var renameCmd = 'RENAME FROM "' + oldPath + '" TO "' + strategy.newName + '" TYPE=dirs'
    DOpus.output('  执行重命名...')

    var renameResult = cmd.runCommand(renameCmd)
    if (renameResult) {
      DOpus.output('  ✓ 重命名成功')
    } else {
      DOpus.output('  ✗ 重命名失败', true)
    }
  }
}
