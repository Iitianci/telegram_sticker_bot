
const fs = require('fs')
const axios = require('axios')
const OSS = require('ali-oss')
const path = require("path")

const client = new OSS({
    // yourregion填写Bucket所在地域。以华东1（杭州）为例，Region填写为oss-cn-hangzhou。
    region: 'oss-us-west-1',
    //是否使用阿里云内网访问，默认值为false
    internal: false,
    //是否使用https,默认值为false
    secure: true,
    // 阿里云账号AccessKey拥有所有API的访问权限，风险很高。强烈建议您创建并使用RAM用户进行API访问或日常运维，请登录RAM控制台创建RAM用户。
    accessKeyId: 'LTAI4FywD6CchnqeADGXsErR',
    accessKeySecret: 'xfifcf64CJPPaW2oFfBLXQnDbyDzKR',
    // 填写Bucket名称。
    bucket: 'usa-bucket-a',
});

//获取文件列表
async function file_list() {
    // 不带任何参数，默认最多返回100个文件。
    const result = await client.list();
    if (result.res.status == 200) {
        let objects = result.objects
        console.log('file_list', objects);
    }
}
// 判断文件是否存在，并生成有效期为10分钟的访问链接
async function checkFileAndGenerateUrl(objectName, exp_time = 10 * 60 * 1000) {
    console.log("查看文件是否存在", objectName)
    let signedUrl = ''
    try {
        // 发送 HEAD 请求，检查文件是否存在
        const exists = await client.head(objectName);

        if (exists.res.status === 200) {
            console.log('文件存在。');

            // 获取当前时间
            const currentTime = new Date();

            // 生成带签名的 URL，并设置过期时间
            signedUrl = client.signatureUrl(objectName, { expires: exp_time });

            console.log('文件的访问链接:', signedUrl);
        } else {
            console.log('文件不存在。');
        }
        return signedUrl
    } catch (error) {
        console.error('文件检查时发生错误:', error);
        return signedUrl
    }
}

async function uploadFile_to_oss(file_path, upload_path, exp_time = 10 * 60 * 1000) {
    const headers = {
        // 指定该Object被下载时网页的缓存行为。
        'Cache-Control': 'public',
        // 指定该Object被下载时的名称。
        'Content-Disposition': upload_path,
        // 指定该Object被下载时的内容编码格式。
        'Content-Encoding': 'UTF-8',
        // 指定过期时间。
        'Expires': exp_time,
        // 指定Object的存储类型。
        'x-oss-storage-class': 'Standard',
        // 指定Object的访问权限。
        'x-oss-object-acl': 'private',
        // 设置Object的标签，可同时设置多个标签。
        // 'x-oss-tagging': 'Tag1=1&Tag2=2', 
        // 指定CopyObject操作时是否覆盖同名目标Object。此处设置为true，表示禁止覆盖同名Object。
        'x-oss-forbid-overwrite': 'false',
    }
    let file_url = ''
    let file_size = 0

    try {
        // 填写OSS文件完整路径和本地文件的完整路径。OSS文件完整路径中不能包含Bucket名称。
        // 如果本地文件的完整路径中未指定本地路径，则默认从示例程序所属项目对应本地路径中上传文件。
        let result = await client.put(upload_path, path.normalize(file_path), { headers });
        console.log('上传结果', result);
        // 如果成功上传了
        if (result.url) {

            let stats = fs.statSync(file_path);
            file_size = stats.size
            file_url = client.signatureUrl(upload_path, { expires: exp_time });
            console.log('下载文件地址', file_url)
            console.log('下载文件大小', file_size)
        }


    } catch (e) {
        console.log('上传错误', e);
        return {}
    }
    return { file_url, file_size }
}

// 处理请求失败的情况，防止promise.all中断，并返回失败原因和失败文件名。
async function handleDel(name, options) {
    try {
        await client.delete(name);
    } catch (error) {
        error.failObjectName = name;
        return error;
    }
}

//删除目录及目录下的所有文件。
async function deletePrefix(prefix) {
    const list = await client.list({
        prefix: prefix,
    });

    list.objects = list.objects || [];
    const result = await Promise.all(list.objects.map((v) => handleDel(v.name)));
    console.log(result);
}


module.exports = {
    uploadFile_to_oss,
    file_list,
    checkFileAndGenerateUrl
}