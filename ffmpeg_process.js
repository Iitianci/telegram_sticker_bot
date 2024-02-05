
const { file_list, uploadFile_to_oss, checkFileAndGenerateUrl } = require('./oss.js')
const axios = require('axios')
const tgs2 = require('tgs2');
const fs = require('fs')
const path = require('path')
const { exec, execSync } = require('child_process');
const { tg_token } = require('./config.js')

// 将sticker转换gif
async function convertStickerToGif(stickerFilePath, ext = 'gif', width = 500, fps = 10, compression_level = 3) {
    const directory = path.dirname(stickerFilePath);
    let gifFilePath = changeFileExtension(stickerFilePath, 'gif')
    try {
        let start_time = new Date().getTime()
        if (stickerFilePath.endsWith('.tgs')) {
            console.log("tgs转换中..")
            await tgs2.file2gif(
                stickerFilePath,
                {
                    lottie_config: {
                        format: ext
                    },
                    exportPath: directory
                }
            )
        } else {

            let ffmpeg_args = `-vf "fps=${fps},scale=${width}:-1:flags=lanczos" -c:v ${ext} -pix_fmt rgb8 -compression_level ${compression_level}`

            const command = `ffmpeg -i ${stickerFilePath} ${ffmpeg_args} ${gifFilePath}`;
            console.log("转码命令:", command)
            execSync(command);
            let end_time = new Date().getTime()
            console.log("convertStickerToGif diffTime", (end_time - start_time) / 1000, (end_time - start_time) / 60000)

        }
        return gifFilePath;
    } catch (error) {
        console.log("convertStickerToGif error", error)
        throw error;
    }

}

//给任意一个绝对路径 和 要修改后的后缀名  输出新的绝对路径
function changeFileExtension(absolutePath, newExtension) {
    // 获取文件的目录路径和文件名
    const directory = path.dirname(absolutePath);
    const filename = path.basename(absolutePath);

    // 获取文件名（不包含后缀名）
    const filenameWithoutExtension = path.parse(filename).name;

    // 构建新的文件名和路径
    const newFilename = `${filenameWithoutExtension}.${newExtension}`;
    const newPath = path.join(directory, newFilename);

    return newPath;
}


//查看是否有缓存,如果有,则直接发送
async function check_has_cache(file_path, oss_ext = 'gif') {
    console.log("是否有缓存")

    let nee_file_name = changeFileExtension(file_path, oss_ext)
    let gifFilePath = `/tmp/${tg_token}/${nee_file_name}`

    let { oss_file_url, oss_file_size } = await checkFileAndGenerateUrl(gifFilePath)
    return { oss_file_url, oss_file_size }
}


// 转换文件
async function convertTGFile(file_path, file_width, ext = 'gif', fps = 10, compression_level = 3) {
    let oss_file_url = ''
    let oss_file_size = 0
    //先查看oss上是否已经有了
    let checkRes = await check_has_cache(file_path, ext)
    if (checkRes.oss_file_url) {
        console.log("存在缓存,直接发送")
        oss_file_url = checkRes.oss_file_url
        oss_file_size = checkRes.oss_file_size
    } else {
        //转换过程
        // 先下载文件
        await downloadTGFile(file_path)
        // 进行转换
        let gifFilePath = await convertStickerToGif(file_path, ext, file_width, fps, compression_level);
        console.log("gifFilePath--", gifFilePath)
        if (gifFilePath) {
            //上传到oss
            let { oss_file_url, oss_file_size } = await uploadFile_to_oss(gifFilePath, `/tmp/${tg_token}/${gifFilePath}`)
            if (oss_file_url) {
                return { oss_file_url, oss_file_size }
            } else {
                console.log("没有上传成功!", oss_file_url)
            }
        } else {
            console.log("没有转换gif成功")
        }
        //清除生成的图片
        try {
            fs.unlinkSync(stickerFilePath);
            fs.unlinkSync(gifFilePath);
        } catch (error) {

        }
    }
    return { oss_file_url, oss_file_size }
}

async function downloadTGFile(tg_file_path) {

    try {
        let start_time = new Date().getTime()
        let downloadUrl = `https://api.telegram.org/file/bot${tg_token}/${tg_file_path}`;
        const response = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
        console.log("response", response)
        fs.writeFileSync(tg_file_path, response.data);
        let end_time = new Date().getTime()
        console.log("downloadTGFile diffTime", (end_time - start_time) / 1000, (end_time - start_time) / 60000)
        return tg_file_path;
    } catch (error) {
        console.log("downloadTGFile error", error)
        throw error;
    }

}

downloadTGFile("stickers/file_770.webm")

module.exports = { convertTGFile }
