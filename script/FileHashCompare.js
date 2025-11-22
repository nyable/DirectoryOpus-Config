///<reference path="../types/_DOpusDefinitions.d.ts" />
//@ts-check
/**
 *  md5: 068ac8360ac6c138caf4a16d25dc1b40  32
    blake3: aa418eba494504dabede7e8361898444da954391a02bb8562cd7017d7d81ee6a  64
    sha1: 90694557480b486daab48387596bb7f8f455638c  40
    sha256: a623572b86b5f90565eba389605e81453f1bc506b5894f638156e9907d298e87  64
    sha512: 8390f02313a1141e1f971036d7e03c9e9aa27bb2f32f55e48990a4471d912f498c4b706fe839210773330dfff227ce75f569e7e42da8d482ebb086bb3e2da0ef  128
    crc32: 84f79b64  8
    crc32_php: 6aa780e3  8
    crc32_php_rev: e380a76a  8
 */


var types = [
  {
    name: 'md5', length: 32, checked: true
  },
  {
    name: 'sha1', length: 40, checked: true
  },
  {
    name: 'sha256', length: 64, checked: true
  },
  {
    name: 'sha512', length: 128, checked: false
  },
  {
    name: 'blake3', length: 64, checked: false
  },
  {
    name: 'crc32', length: 8, checked: false
  }
]

var LT_MAIN = 'main'
var LT_TAB1 = 'tab1'
var LT_TAB2 = 'tab2'
var LT_TARGET_PATH = 'target'
var LT_BT_COMPARE = 'bt_compare'
var LT_BT_CLEAR = 'bt_clear'
var LT_BT_HASH = 'bt_hash'
var LT_TEXT_COMPARE = 'text_compare_input'
var LT_TEXT_TIPS = 'text_tips'
var LT_TEXT_RESULT = 'text_result'
var LT_TEXT_COLOR = 'text_color'
/**
 * 进行Hash对比或计算
 * @param {DOpusClickData} clickData 
 */
function OnClick(clickData) {
  var sourceTab = clickData.func.sourceTab
  var selected = sourceTab.selected



  var dlg = DOpus.dlg()
  dlg.window = clickData.func.sourceTab.lister
  dlg.template = 'main'
  dlg.detach = true
  dlg.create()
  var targetInput = dlg.control(LT_TARGET_PATH, LT_MAIN)
  if (selected.count > 0) {
    for (var i = 0; i < selected.count; i++) {
      var target = selected[i]
      if (!target.is_dir) {
        targetInput.value = target.realpath
        break
      }
    }
  }
  for (var i = 0; i < types.length; i++) {
    var type = types[i]
    dlg.control(t(type.name), LT_TAB2).value = type.checked
  }
  dlg.show()




  while (true) {
    var msg = dlg.getMsg()
    if (!msg.result) {
      break
    }
    var event = msg.event
    var control = msg.control

    if (event == 'click') {
      var path = targetInput.value
      if (control == LT_BT_HASH) {
        if (!DOpus.fsUtil().exists(path)) {
          DOpus.dlg().request('文件不存在', '确定')
          return
        }
        var checkedIndex = []
        for (var i = 0; i < types.length; i++) {
          var type = types[i]
          if (dlg.control(t(type.name), LT_TAB2).value) {
            checkedIndex[checkedIndex.length] = type.name
          } else {
            dlg.control(type.name, LT_TAB2).value = ''
          }
        }
        if (checkedIndex.length > 0) {
          clearHash(dlg)
          waiting(dlg, true)
          var hashResult = DOpus.fsUtil().hash(path, checkedIndex.join(','))
          waiting(dlg, false)
          if (typeof hashResult == 'string') {
            dlg.control(checkedIndex[0], LT_TAB2).value = hashResult
          } else {
            for (var i = 0; i < hashResult.length; i++) {
              dlg.control(checkedIndex[i], LT_TAB2).value = hashResult[i]
            }
          }
        }
      } else if (control == LT_BT_CLEAR) {
        clearHash(dlg)
      } else if (/^copy_.+/.test(control)) {
        var copyType = control.split('_')[1]
        DOpus.setClip(dlg.control(copyType, LT_TAB2).value)
      } else if (control == LT_BT_COMPARE) {
        if (DOpus.fsUtil().exists(path)) {
          var compareValue = String(dlg.control(LT_TEXT_COMPARE, LT_TAB1).value).toLowerCase()
          var ms = []
          var inputSize = compareValue.length
          for (var i = 0; i < types.length; i++) {
            var type = types[i]
            if (type.length == inputSize) {
              ms[ms.length] = type.name
            }
          }

          if (ms.length == 0) {
            setResult(dlg, 'Hash值的长度(' + inputSize + ')未匹配到任何算法', false)
          } else {
            waiting(dlg, true)
            var hashResult = DOpus.fsUtil().hash(path, ms.join(','))
            waiting(dlg, false)
            if (typeof hashResult == 'string') {
              if (compareValue == hashResult.toLowerCase()) {
                setResult(dlg, '匹配算法: ' + ms[0], true)
              } else {
                setResult(dlg, '不匹配算法: ' + ms[0] + '\r\n实际值为: \r\n' + hashResult, false)
              }
            } else {
              var results = []
              for (var i = 0; i < hashResult.length; i++) {
                var hash = hashResult[i]
                results[results.length] = ms[i] + ": " + hash
                if (compareValue == hash.toLowerCase()) {
                  setResult(dlg, '匹配算法:' + ms[i], true)
                  break
                }
                if (i == hashResult.length - 1) {
                  setResult(dlg, '与以下算法结果不匹配\r\n' + results.join('\r\n'), false)
                }
              }
            }
          }
        } else {
          DOpus.dlg().request('文件不存在', '确定')
        }
      }


    }
  }
}

/**
 * 更新tab1中的结果
 * @param {DOpusDialog} dlg  dlg
 * @param {string} message  结果显示的信息文本
 * @param {boolean} ok  结果对应的颜色(true:绿色, false:红色,null:橙色)
 */
function setResult(dlg, message, ok) {
  var resultTextArea = dlg.control(LT_TEXT_RESULT, LT_TAB1)
  var resultColor = dlg.control(LT_TEXT_COLOR, LT_TAB1)
  resultTextArea.value = message
  if (ok) {
    resultColor.bg = '#00FF00'
  } else {
    resultColor.bg = '#FF0000'
  }
}

/**
 * 计算时禁用按钮,防止多次点击
 * @param {DOpusDialog} dlg 
 * @param {boolean} waiting 
 */
function waiting(dlg, waiting) {
  dlg.control(LT_BT_COMPARE, LT_TAB1).enabled = !waiting
  dlg.control(LT_BT_HASH, LT_TAB2).enabled = !waiting
  dlg.control(LT_BT_CLEAR, LT_TAB2).enabled = !waiting
  dlg.control(LT_TEXT_TIPS, LT_MAIN).label = waiting ? '计算中...' : ''
}

/**
 * 清空tab2中的结果
 * @param {DOpusDialog} dlg 
 */
function clearHash(dlg) {
  for (var i = 0; i < types.length; i++) {
    var type = types[i]
    dlg.control(type.name, LT_TAB2).value = ''
  }
}

/**
 * 
 * @param {string} type 
 * @returns 
 */
function t(type) {
  return 't_' + type
}