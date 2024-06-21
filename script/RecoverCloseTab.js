///<reference path="./_DOpusDefinitions.d.ts" />
//@ts-check
// RecoverCloseTab
// (c) 2024 nyable

// This is a script for Directory Opus.
// See https://www.gpsoft.com.au/endpoints/redirect.php?page=scripts for development information.
var CACHE_KEY = 'CLOSED_TAB_CACHE_LIST'

// 操作的最大缓存数
var CONFIG_MAX_CACHE_SIZE = 'MAX_CACHE_SIZE'
// 不聚焦恢复的标签页
var CONFIG_NO_FOCUS_RECOVERED_TAB = 'NO_FOCUS_RECOVERED_TAB'
// 持久化缓存
var CONFIG_CACHE_PERSIST = 'CACHE_PERSIST'
// 是否缓存窗口关闭
var CONFIG_ENABLE_LISTER_CACHE = 'ENABLE_LISTER_CACHE'
// 当CONFIG_ENABLE_LISTER_CACHE启用时,关闭的窗口中标签页最少需要多少个才进行缓存
var CONFIG_MIN_SIZE_LISTER_CACHE_START = 'MIN_SIZE_LISTER_CACHE_START'
/**
 * 
 * 
 * 增加一个内部命令`RecoverTab`，用于重新打开关闭的标签页。可以通过`自定义-快捷键`设置快捷键触发。
实际上只是重新打开关闭标签页的路径而已，并不会恢复各种布局状态等。且对关闭的窗口无效。
虽然可以实现，但是要管理各种操作记录和布局状态，写的有点难受，暂时懒得做了。
 * Called by Directory Opus to initialize the script
 * @param {DOpusScriptInitData} initData 
 */
function OnInit (initData) {
  initData.name = "RecoverCloseTab"
  initData.version = "1.0"
  initData.copyright = "(c) 2024 nyable"
  //	initData.url = "https://resource.dopus.com/c/buttons-scripts/16";
  initData.desc = "ReOpen closed tab or lister"
  initData.default_enable = true
  initData.min_version = "13.0"

  var cmd = initData.addCommand()
  cmd.name = 'RecoverTab'
  cmd.method = 'OnRecoverTab'
  cmd.desc = initData.desc
  cmd.label = "RecoverTab"
  cmd.template = "INDEX/N"


  initData.config[CONFIG_MAX_CACHE_SIZE] = 20
  initData.config[CONFIG_NO_FOCUS_RECOVERED_TAB] = true
  initData.config[CONFIG_CACHE_PERSIST] = false
  initData.config[CONFIG_ENABLE_LISTER_CACHE] = false
  initData.config[CONFIG_MIN_SIZE_LISTER_CACHE_START] = 2

  var configDescMap = DOpus.create().map()
  configDescMap.set(CONFIG_MAX_CACHE_SIZE, '最大缓存数')
  configDescMap.set(CONFIG_NO_FOCUS_RECOVERED_TAB, '不聚焦恢复的标签页')
  configDescMap.set(CONFIG_CACHE_PERSIST, '缓存持久化')
  configDescMap.set(CONFIG_ENABLE_LISTER_CACHE, '是否缓存关闭的窗口')
  configDescMap.set(CONFIG_MIN_SIZE_LISTER_CACHE_START, '缓存窗口所需最少标签页数量')

  initData.config_desc = configDescMap

}

/**
 * 
 * @param {DOpusScriptCommandData} cmdData 
 * @returns 
 */
function OnRecoverTab (cmdData) {

  var args = cmdData.func.args
  var cmd = cmdData.func.command
  var index = -1
  if (args.got_arg.index) {
    index = Number(args.index)
  }
  if (Script.vars.Exists(CACHE_KEY)) {
    var value = Script.vars.Get(CACHE_KEY)
    var cacheSize = value.length
    if (cacheSize > 0) {
      if (index < 0) {
        index = cacheSize + index
      } else if (index > cacheSize - 1) {
        index = cacheSize - 1
      }
      var lastCache = value[index]
      value.erase(index)
      if (lastCache) {
        DOpus.output('lastPath: ' + lastCache)
        var item = JSON.parse(lastCache)
        var paths = item.paths
        var actionType = item.type
        if (actionType == 'tab') {
          for (var i = 0; i < paths.length; i++) {
            var path = paths[i]
            var command = 'GO "' + path + '" NEWTAB=' + (Script.config[CONFIG_NO_FOCUS_RECOVERED_TAB] ? 'nofocus' : 'default')
            DOpus.output('[tab]Run command: ' + command)
            cmd.runCommand(command)
          }
        } else if (actionType == 'lister') {
          for (var i = 0; i < paths.length; i++) {
            var path = paths[i]
            var multiCmd = DOpus.create().command()

            if (i == 0) {
              var listerCmd = 'GO "' + path + '" NEW EXISTINGLISTER'
              DOpus.output('[lister]Begin command: ' + listerCmd)
              multiCmd.addLine(listerCmd)
            } else {
              var tabCmd = 'GO "' + path + '" NEWTAB=' + (Script.config[CONFIG_NO_FOCUS_RECOVERED_TAB] ? 'nofocus' : 'default')
              DOpus.output('[lister]Tab command: ' + tabCmd)
              multiCmd.addLine(tabCmd)
            }
            multiCmd.run()
          }
        }
      }

    }
  }

}




/**
 * Called when a tab is closed
 * @param {DOpusCloseTabData} closeTabData 
 */
function OnCloseTab (closeTabData) {
  if (!Script.vars.Exists(CACHE_KEY)) {
    Script.vars.Set(CACHE_KEY, DOpus.create().vector())
  }
  var value = Script.vars.Get(CACHE_KEY)
  var tabPath = String(closeTabData.tab.crumbpath)
  if (value.length >= Script.config[CONFIG_MAX_CACHE_SIZE]) {
    value.erase(0)
  }

  value.push_back(JSON.stringify(
    {
      type: 'tab',
      paths: [tabPath],
      time: new Date().getTime()
    }
  ))

  if (Script.vars.Exists(CACHE_KEY)) {
    Script.vars.Set(CACHE_KEY, value)
    Script.Vars(CACHE_KEY).persist = Script.config[CONFIG_CACHE_PERSIST]
  }
}
/**
 * Called when a lister is closed
 * @param {DOpusCloseListerData} closeListerData 
 */
function OnCloseLister (closeListerData) {
  if (Script.config[CONFIG_ENABLE_LISTER_CACHE]) {
    if (!Script.vars.Exists(CACHE_KEY)) {
      Script.vars.Set(CACHE_KEY, DOpus.create().vector())
    }
    var tabs = closeListerData.lister.tabs
    // @ts-ignore
    var count = tabs.count
    if (Script.vars.Exists(CACHE_KEY) && tabs && count >= Script.config[CONFIG_MIN_SIZE_LISTER_CACHE_START]) {
      var value = Script.vars.Get(CACHE_KEY)
      if (value.length >= Script.config[CONFIG_MAX_CACHE_SIZE]) {
        value.erase(0)
      }
      var paths = []
      for (var i = 0; i < count; i++) {
        paths[i] = String(tabs[i].crumbpath)
      }
      value.push_back(JSON.stringify(
        {
          type: 'lister',
          paths: paths,
          time: new Date().getTime()
        }
      ))

      Script.vars.Set(CACHE_KEY, value)
      Script.Vars(CACHE_KEY).persist = Script.config[CONFIG_CACHE_PERSIST]
    }
  }
}



