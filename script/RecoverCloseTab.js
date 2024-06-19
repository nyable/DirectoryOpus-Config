///<reference path="./_DOpusDefinitions.d.ts" />
//@ts-check
// RecoverCloseTab
// (c) 2024 nyable

// This is a script for Directory Opus.
// See https://www.gpsoft.com.au/endpoints/redirect.php?page=scripts for development information.
var CACHE_KEY = 'CLOSED_TAB_ARRAY'

var CONFIG_MAX_CACHE_SIZE = 'MAX_CACHE_SIZE'
var CONFIG_NO_FOCUS_RECOVERED_TAB = 'NO_FOCUS_RECOVERED_TAB'
var CONFIG_CACHE_PERSIST = 'CACHE_PERSIST'
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
  initData.desc = "Recover closed tab"
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
    var len = value.length
    if (len > 0) {
      if (index < 0) {
        index = len - 1
      } else if (index > len - 1) {
        index = len - 1
      }
      var lastPath = value[index]
      var command = 'GO ' + lastPath + ' NEWTAB=' + (Script.config[CONFIG_NO_FOCUS_RECOVERED_TAB] ? 'nofocus' : 'default')
      DOpus.output('Run command: ' + command)
      cmd.runCommand(command)
      value.erase(index)
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
  value.push_back(tabPath)
  if (Script.vars.Exists(CACHE_KEY)) {
    Script.vars.Set(CACHE_KEY, value)
    Script.Vars(CACHE_KEY).persist = Script.config[CONFIG_CACHE_PERSIST]
  }
}



