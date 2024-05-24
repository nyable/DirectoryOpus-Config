///<reference path="./_DOpusDefinitions.d.ts" />
//@ts-check
/**
 * 对文件进行重命名
 * @param {DOpusGetNewNameData} getNewNameData 
 * @returns 
 */
function OnGetNewName (getNewNameData) {
  var item = getNewNameData.item
  var newName = item.name_stem
  newName = newName.replace(/\[(\d{1,2})\]/g, '- S1E$1')
  newName = newName.replace(/-?\s(\d{1,2})/g, '- S1E$1')
  newName = newName.replace(/第(\d{1,2})[话|話]?/g, '- S1E$1')
  newName = newName.replace(' - -', ' - ')
  newName = newName.replace(/\s{2,}/g, ' ')
  newName = newName.replace(/\(.+?\)/g, '')
  newName = newName.replace(/\[.+?\]/g, '')

  var season = getNewNameData.custom['M_SEASON'] || 1
  newName = newName.replace(/- S\d+E/, '- S' + season + 'E')
  return newName + item.ext
}

/**
 * 自定义对话框中的重命名字段
 * @param {DOpusGetCustomFieldData} getFieldData 
 */
function OnGetCustomFields (getFieldData) {
  getFieldData.fields['M_SEASON'] = 1
  getFieldData.field_labels.set("M_SEASON", "季度")
  getFieldData.field_tips.set("M_SEASON", "输入季度")
}