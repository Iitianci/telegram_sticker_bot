
const { file_list, uploadFile_to_oss, checkFileAndGenerateUrl } = require('./oss.js')
const axios = require('axios')
const tgs2 = require('tgs2');
const fs = require('fs')
const path = require('path')
const { exec, execSync } = require('child_process');
const {
    webhook_url, webhook_url_256, webhook_url_512, tg_token
} = require('./config.js');
const { url } = require('inspector');


async function handle_msg(bot, msg) {
    // console.log("message----", msg)
    let chatId = msg.chat.id;
    let chatType = msg.chat.type  // supergroup 超级群 || private 私信
    console.log("正在处理..", chatId)
    try {
        await bot.sendMessage(chatId, JSON.stringify(msg));
        if (msg.text) {
            console.log("文字信息")
            //关键词处理
            await handle_text(bot, msg)
            return
        } else if (msg.animation || msg.sticker) {
            await handle_sticker(bot, msg)
        }

    } catch (error) {
        console.log("bot.onMessage error--", error)
        await bot.sendMessage(chatId, '请求出错,重新尝试! 若多次失败请联系客服  报错信息:' + error.toString());
    }

}


async function convertStickerToGif(stickerFilePath, width = 500, fps = 10) {
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
                        format: 'gif'
                    },
                    exportPath: directory
                }
            )

        } else {

            let ffmpeg_args = `-vf "fps=${fps},scale=${width}:-1:flags=lanczos" -c:v gif -pix_fmt rgb8 -compression_level 3`

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
async function check_has_cache(bot, chatId, tg_file_path, oss_ext = 'gif') {
    console.log("是否有缓存")

    let nee_file_name = changeFileExtension(tg_file_path, oss_ext)
    let gifFilePath = `/tmp/${tg_token}/${nee_file_name}`

    let signedUrl = await checkFileAndGenerateUrl(gifFilePath)
    if (signedUrl) {
        await bot.sendMessage(chatId, 'signedUrl:' + signedUrl)
        return true
    } else {
        console.log("不存在缓存")
        return false
    }
}


async function handle_sticker(bot, msg) {
    console.log("表情包信息")
    let chatId = msg.chat.id
    let fromId = msg.from.id
    let fileId = ""
    let file_width = null
    let file_type = ''
    let thumb_fileId = ""
    let thumb_file_width = null
    let stickersList = []
    if (msg.animation && msg?.animation?.mime_type === "video/mp4") {
        console.log("正在处理mp4..", chatId)
        fileId = msg?.animation?.file_id;
        thumb_fileId = msg?.animation?.thumb?.file_id
        file_width = msg?.animation?.width
        thumb_file_width = msg?.animation?.thumb?.width
        file_type = 'mp4'
    } else if (msg?.sticker && msg?.sticker?.file_id) {
        console.log("正在处理sticker..", chatId)
        fileId = msg?.sticker?.file_id
        thumb_fileId = msg?.sticker?.thumb?.file_id

        file_width = msg?.sticker?.width
        thumb_file_width = msg?.sticker?.thumb?.width
        file_type = 'sticker'

        // 获取贴纸集信息
        const stickerSet = await bot.getStickerSet(msg?.sticker?.set_name);
        stickersList = stickerSet.stickers;
        // 发送贴纸信息给用户
        await bot.sendMessage(chatId, `贴纸集名称: ${stickerSet.title}\n贴纸数量: ${stickersList.length}`);

    }

    if (!fileId) {
        console.log("没有fileId")
        return
    }


    let tg_file_info = await bot.getFile(fileId)
    let thumb_tg_file_info = await bot.getFile(thumb_fileId)


    await bot.sendMessage(chatId, 'tg_file_info:' + JSON.stringify(tg_file_info) + "文件大小:" + (tg_file_info.file_size / 1024 / 1024).toFixed(3) + 'm' + ",宽度:" + file_width)
    await bot.sendMessage(chatId, 'thumb_tg_file_info:' + JSON.stringify(thumb_tg_file_info) + "文件大小:" + (thumb_tg_file_info.file_size / 1024 / 1024).toFixed(3) + 'm' + ",宽度:" + thumb_file_width);
    // await bot.sendAnimation(chatId, sticker_url);
    // await bot.sendAnimation(chatId, thumb_sticker_url);
    let markDown = `
<pre><code class="language-批量表情系列">直接分享表情包的贴纸链接或发送其中一个表情</code></pre>
<pre><code class="language-存表情包">若想存在其他软件作为表情包,请使用转gif-小即可</code></pre>
<pre><code class="language-转mp4">若想用于发送视频给被人,可使用转mp4(兼容性好)或者转webm(文件较小)</code></pre>
<pre><code class="language-会员功能">无广告  系列表情包批量  电脑端下载 大文件下载 速度更快</code></pre>
`
    await bot.sendMessage(chatId, markDown, { parse_mode: 'HTML' });

    await bot.sendMessage(chatId, '请选择一个选项：', {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: `转gif-小(估${((thumb_tg_file_info.file_size / 1024 / 1024) * 10).toFixed(2)}m)`, url: `https://static-mp-692a61ca-45bc-4bb8-a570-5a1247384c1b.next.bspapp.com/client/#/pages/to_mp/to_mp?extraData=${encodeURIComponent(JSON.stringify({ type: "gif", uid: fromId, file_path: tg_file_info.file_path, file_size: tg_file_info.file_size }))}` },
                    { text: `转gif-大(估${((tg_file_info.file_size / 1024 / 1024) * 10).toFixed(2)}m)`, url: `https://static-mp-692a61ca-45bc-4bb8-a570-5a1247384c1b.next.bspapp.com/client/#/pages/to_mp/to_mp?extraData=${encodeURIComponent(JSON.stringify({ type: "gif", uid: fromId, file_path: tg_file_info.file_path, file_size: tg_file_info.file_size }))}` },
                ],
                [
                    { text: `转mp4-小(估${((thumb_tg_file_info.file_size / 1024 / 1024) * 1).toFixed(2)}m)`, url: `https://static-mp-692a61ca-45bc-4bb8-a570-5a1247384c1b.next.bspapp.com/client/#/pages/to_mp/to_mp?extraData=${encodeURIComponent(JSON.stringify({ type: "gif", uid: fromId, file_path: tg_file_info.file_path, file_size: tg_file_info.file_size }))}` },
                    { text: `转mp4-大(估${((tg_file_info.file_size / 1024 / 1024) * 1).toFixed(2)}m)`, url: `https://static-mp-692a61ca-45bc-4bb8-a570-5a1247384c1b.next.bspapp.com/client/#/pages/to_mp/to_mp?extraData=${encodeURIComponent(JSON.stringify({ type: "gif", uid: fromId, file_path: tg_file_info.file_path, file_size: tg_file_info.file_size }))}` },
                ],
                [
                    { text: `转webm-小(估${((thumb_tg_file_info.file_size / 1024 / 1024) * 1).toFixed(2)}m)`, url: `https://static-mp-692a61ca-45bc-4bb8-a570-5a1247384c1b.next.bspapp.com/client/#/pages/to_mp/to_mp?extraData=${encodeURIComponent(JSON.stringify({ type: "gif", uid: fromId, file_path: tg_file_info.file_path, file_size: tg_file_info.file_size }))}` },
                    { text: `转webm-大(估${((tg_file_info.file_size / 1024 / 1024) * 1).toFixed(2)}m)`, url: `https://static-mp-692a61ca-45bc-4bb8-a570-5a1247384c1b.next.bspapp.com/client/#/pages/to_mp/to_mp?extraData=${encodeURIComponent(JSON.stringify({ type: "gif", uid: fromId, file_path: tg_file_info.file_path, file_size: tg_file_info.file_size }))}` },
                ],
                [
                    { text: `批量下载该表情系列(${stickersList.length}个)`, url: `https://static-mp-692a61ca-45bc-4bb8-a570-5a1247384c1b.next.bspapp.com/client/#/pages/to_mp/to_mp?extraData=${encodeURIComponent(JSON.stringify({ type: "gif", uid: fromId, file_path: tg_file_info.file_path, file_size: tg_file_info.file_size }))}` },
                ],
                [
                    { text: '使用教程', url: `https://static-mp-692a61ca-45bc-4bb8-a570-5a1247384c1b.next.bspapp.com/client/#/pages/to_mp/to_mp?extraData=${encodeURIComponent(JSON.stringify({ type: "gif", uid: fromId, file_path: tg_file_info.file_path, file_size: tg_file_info.file_size }))}` },
                    { text: '开通会员', url: `https://static-mp-692a61ca-45bc-4bb8-a570-5a1247384c1b.next.bspapp.com/client/#/pages/to_mp/to_mp?extraData=${encodeURIComponent(JSON.stringify({ type: "gif", uid: fromId, file_path: tg_file_info.file_path, file_size: tg_file_info.file_size }))}` },
                    { text: '联系客服', url: `https://static-mp-692a61ca-45bc-4bb8-a570-5a1247384c1b.next.bspapp.com/client/#/pages/to_mp/to_mp?extraData=${encodeURIComponent(JSON.stringify({ type: "gif", uid: fromId, file_path: tg_file_info.file_path, file_size: tg_file_info.file_size }))}` },
                ],
            ]
        }
    })


}
// 转换文件
async function convertFile(bot, chatId, tg_file_info, ext = 'gif') {
    //先查看oss上是否已经有了
    if (await check_has_cache(bot, chatId, tg_file_info.file_path, ext)) {
        console.log("存在缓存,直接发送")
        return
    }
    //转换过程
    await downloadTGFile(tg_file_info.file_path)


    let gifFilePath = await convertStickerToGif(tg_file_info.file_path, file_width);
    console.log("gifFilePath--", gifFilePath)
    if (gifFilePath) {
        //上传到oss
        let { file_url, file_size } = await uploadFile_to_oss(gifFilePath, `/tmp/${tg_token}/${gifFilePath}`)
        if (file_url) {
            // await bot.sendAnimation(chatId, file_url);
            await bot.sendMessage(chatId, 'oss file_url:' + file_url);
        } else {
            console.log("没有上传成功!", file_url)
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


async function handle_text(bot, msg) {
    let chatId = msg.chat.id;
}

async function downloadTGFile(tg_file_path) {

    try {
        let start_time = new Date().getTime()
        let downloadUrl = `https://api.telegram.org/file/bot${tg_token}/${tg_file_path}`;
        const response = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
        fs.writeFileSync(tg_file_path, response.data);
        let end_time = new Date().getTime()
        console.log("downloadTGFile diffTime", (end_time - start_time) / 1000, (end_time - start_time) / 60000)
        return tg_file_path;
    } catch (error) {
        console.log("downloadTGFile error", error)
        throw error;
    }

}


module.exports = {
    handle_msg
}
