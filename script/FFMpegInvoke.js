///<reference path="./_DOpusDefinitions.d.ts" />
//@ts-check
// (c) 2024 nyable

var FFMPEG_PATH = 'ffmpeg'
// control key
var INPUT = 'input'
var MAIN = 'main'
var CRF_TAB_NAME = 'tab1'
var ABR_TAB_NAME = 'tab2'
var CRF = {
  VCODEC: {
    name: 'CRF_VCODEC',
    type: 'select',
    value: 'libx264',
    options: ['libx264', 'libx265']
  },
  CRF: {
    name: 'CRF_CRF',
    type: 'text',
    value: '23',
    options: []
  },
  BPS: {
    name: 'CRF_BPS',
    type: 'text',
    value: '192k',
    options: []
  },
  PRESET: {
    name: 'CRF_PRESET',
    type: 'select',
    value: 'medium',
    options: ['ultrafast', 'superfast', 'veryfast', 'faster', 'fast', 'medium', 'slow', 'slower', 'veryslow']
  },
  OUTPUT: {
    name: 'CRF_OUTPUT',
    type: 'text',
    value: '',
    options: []
  },
}

var ABR = {
  VCODEC: {
    name: 'ABR_VCODEC',
    type: 'select',
    value: 'libx264',
    options: ['libx264', 'libx265']
  },
  ABR: {
    name: 'ABR_ABR',
    type: 'text',
    value: '23',
    options: []
  },
  BPS: {
    name: 'ABR_BPS',
    type: 'text',
    value: '192k',
    options: []
  },
  PRESET: {
    name: 'ABR_PRESET',
    type: 'select',
    value: 'medium',
    options: ['ultrafast', 'superfast', 'veryfast', 'faster', 'fast', 'medium', 'slow', 'slower', 'veryslow']
  },
  OUTPUT: {
    name: 'ABR_OUTPUT',
    type: 'text',
    value: '',
    options: []
  },
}

/**
 * @param {DOpusClickData} clickData 
 * @returns 
 */
function OnClick (clickData) {

  var selected = clickData.func.sourceTab.selected
  var fileCount = selected.count
  if (fileCount > 1) {
    DOpus.dlg().request('只能选中一个文件', '确定')
    return
  }


  var dlg = DOpus.dlg()
  dlg.window = clickData.func.sourceTab.lister
  dlg.template = 'main'
  dlg.detach = true
  dlg.create()
  if (fileCount == 1) {
    dlg.control(INPUT, MAIN).value = selected[0].realpath
  }



  //初始化
  setupDefault(dlg, CRF, CRF_TAB_NAME)
  setupDefault(dlg, ABR, ABR_TAB_NAME)

  dlg.show()

  while (true) {
    var msg = dlg.getMsg()
    var event = msg.event
    var control = msg.control
    // DOpus.output("result=>" + msg.result + ' event=>' + event + ' control=>' + control)
    if (!msg.result) {
      break
    }

    if (event == 'click') {
      if (control == 'bt_confirm') {
        var mode = dlg.control('tabs').value
        var command = FFMPEG_PATH
        var inputPath = dlg.control(INPUT, MAIN).value
        if (!DOpus.fsUtil().exists(inputPath)) {
          DOpus.dlg().request('输入文件不存在，请确认', '确定')
          continue
        }
        var inputItem = DOpus.fsUtil().getItem(inputPath)
        var outputPath = dlg.control(CRF.OUTPUT.name, CRF_TAB_NAME).value
        if (!outputPath) {
          outputPath = inputItem.path + '/' + inputItem.name_stem + new Date().getTime() + '.mp4'
        }

        command += ' -i "' + inputPath + '" '

        if (mode == 0) {
          // CRF
          command += ' -map_metadata -1 -pix_fmt yuv420p '
          command += ' -vcodec ' + dlg.control(CRF.VCODEC.name, CRF_TAB_NAME).label + ' '
          command += ' -preset ' + dlg.control(CRF.PRESET.name, CRF_TAB_NAME).label + ' '
          command += '  -x264opts cabac=1:interlaced=0:crf=' + dlg.control(CRF.CRF.name, CRF_TAB_NAME).value + ' '
          command += ' -acodec aac '
          command += '  -ab ' + dlg.control(CRF.BPS.name, CRF_TAB_NAME).value + ' '
          command += ' -af aresample=async=1000  '
          command += ' -metadata comment="Transcoded by FFMpeg" '
          command += ' -f mp4'
          command += ' -movflags +faststart '
          command += ' -max_muxing_queue_size 1024 '
          command += ' -y "' + outputPath + '" '
          clickData.func.command.runCommand(command)

        } else if (mode == 1) {
          // ABR
          DOpus.dlg().request("未实现该功能", "确定")
          continue
        }
        DOpus.output("Run command:\n" + command)
        dlg.endDlg()
      } else if (control == 'bt_close') {
        dlg.endDlg()
      }
    }
  }
  // dlg.control('vcodec', 'tab1').value = 'libx264'

}



/**
 * 装载默认值
 * @param {DOpusDialog} dlg 
 * @param {*} defaultObj 
 * @param {string} pName 
 */
function setupDefault (dlg, defaultObj, pName) {
  for (var key in defaultObj) {
    var op = defaultObj[key]
    var opName = op.name
    var type = op.type
    var control = dlg.control(opName, pName)
    if (type == 'text') {
      control.value = op.value
    } else if (type == 'select') {
      var subItems = op.options
      var defaultIndex = 0
      for (var i = 0; i < subItems.length; i++) {
        var subItem = subItems[i]
        control.addItem(subItem)
        if (subItem == op.value) {
          defaultIndex = i
        }
      }
      control.label = op.value
    }
  }
}