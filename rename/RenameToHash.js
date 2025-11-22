///&lt;reference path="../types/_DOpusDefinitions.d.ts" /&gt;
//@ts-check
/**
 * 将文件重命名为其 Hash 值
 * @param {DOpusGetNewNameData} getNewNameData
 * @returns {string}
 */
function OnGetNewName(getNewNameData) {
    var item = getNewNameData.item;

    // 跳过文件夹
    if (item.is_dir) {
        return item.name;
    }

    // 获取用户选择的 Hash 算法（从下拉菜单获取索引）
    var hashTypes = ["md5", "sha1", "sha256", "sha512", "blake3", "crc32"];
    var hashTypeIndex = getNewNameData.custom["HASH_TYPE"] || 0;
    // @ts-ignore
    var hashType = hashTypes[hashTypeIndex];

    // 是否保留原扩展名（布尔值）
    var keepExt = getNewNameData.custom["KEEP_EXT"];

    // 是否使用大写（布尔值）
    var uppercase = getNewNameData.custom["UPPERCASE"];

    try {
        // 计算文件的 Hash 值
        var hashValue = DOpus.fsUtil().hash(String(item.realpath), hashType);

        if (typeof hashValue !== 'string' || hashValue.length === 0) {
            DOpus.output("计算 Hash 失败: " + item.name);
            return item.name;
        }

        // 转换大小写
        if (uppercase) {
            hashValue = hashValue.toUpperCase();
        } else {
            hashValue = hashValue.toLowerCase();
        }

        // 返回新文件名
        if (keepExt) {
            return hashValue + item.ext;
        } else {
            return hashValue;
        }
    } catch (/** @type {*} */ e) {
        DOpus.output("计算 Hash 时出错: " + e.message);
        return item.name;
    }
}

/**
 * 自定义对话框中的重命名字段
 * @param {DOpusGetCustomFieldData} getFieldData
 */
function OnGetCustomFields(getFieldData) {
    // Hash 算法选择 - 使用下拉菜单
    getFieldData.fields["HASH_TYPE"] = DOpus.create().vector(0, "MD5", "SHA1", "SHA256", "SHA512", "BLAKE3", "CRC32");
    getFieldData.field_labels.set("HASH_TYPE", "Hash 算法");
    getFieldData.field_tips.set("HASH_TYPE", "选择要使用的 Hash 算法");

    // 是否保留扩展名 - 使用复选框
    getFieldData.fields["KEEP_EXT"] = true;
    getFieldData.field_labels.set("KEEP_EXT", "保留扩展名");

    // 是否使用大写 - 使用复选框
    getFieldData.fields["UPPERCASE"] = false;
    getFieldData.field_labels.set("UPPERCASE", "大写 Hash 值");
}
