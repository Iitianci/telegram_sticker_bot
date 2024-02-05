const { h5_url } = require('./config.js')
//处理发来的信息
//处理关键词
async function handle_text(bot, msg) {
    let chatId = msg.chat.id;
    let text = msg.text

    if (text.match(/test/)) {
        await uploadFile(bot, chatId, "test.gif")
    }
}


async function handle_msg(bot, msg) {
    //console.log("message----", msg)
    let chatId = msg.chat.id;
    let chatType = msg.chat.type //supergroup 超级群 || private 私信
    console.log("正在处理..", chatId)
    try {
        await bot.sendMessage(chatId, JSON.stringify(msg));
        if (msg.text) {
            console.log("文字信息")
            //关键词处理
            await handle_text(bot, msg)
            return
        } else if (msg.animation || msg.sticker) {
            await handle_sticker_menu(bot, msg)
        }

    } catch (error) {
        console.log("bot.onMessage error--", error)
        await bot.sendMessage(chatId, '请求出错,重新尝试! 若多次失败请联系客服  报错信息:' + error.toString());
    }
}
//处理回调信息
async function handle_callback_query(bot, bodyJson) {
    let { from, message, data } = bodyJson?.callback_query
    let callback_json = JSON.parse(data)

    if (callback_json.e_type == 'tran_sticker_set') {
        let { set_name } = callback_json
        await handle_sticker_set_menu(bot, message, set_name)
    }


}



// 上传文件
async function uploadFile(bot, chatId, filePath) {
    let upRes = await bot.sendDocument(chatId, filePath)
    console.log("upRes--------", upRes)
    return upRes
}

// 下载文件
function downloadFile(bot, fileId, downloadPath) {
    bot.getFile(fileId)
        .then((file) => {
            const fileStream = bot.downloadFile(file.file_id, downloadPath);
            fileStream.on('end', () => {
                console.log('File downloaded:', downloadPath);
            });
            fileStream.on('error', (error) => {
                console.error('Error downloading file:', error);
            });
        })
        .catch((error) => {
            console.error('Error getting file:', error);
        });
}
//获取sticker系列
async function getStickerSet(bot, stiicker_set_name) {
    //获取贴纸集信息
    const stickerSet = await bot.getStickerSet(msg?.sticker?.set_name);
    stickersList = stickerSet.stickers;
    //发送贴纸信息给用户
    console.log(`贴纸集名称: ${stickerSet.title}\n贴纸数量: ${stickersList.length}`);
}
//处理表情包菜单  (批量)
async function handle_sticker_set_menu(bot, msg, set_name) {
    console.log("表情包系列信息")
    let chatId = msg.chat.id
    let fromId = msg.from.id

    let path = '/pages/tg_robot/tg_robot'
    let env_version = 'develop'
    let url = `${h5_url}/#/pages/to_mp/to_mp?path=${encodeURIComponent(path)}&env_version=${env_version}&event_type=tg_tran`

    let markDown = `
    <pre><code class="language-批量表情系列">Tips:批量仅会员可用,非会员请逐个发送</code></pre>
    `
    await bot.sendMessage(chatId, markDown, { parse_mode: 'HTML' });

    await bot.sendMessage(chatId, '请选择你需要批量转换的格式：', {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: `批量转gif-小`, url: `${url}&extraData=${encodeURIComponent(JSON.stringify({ event_type: "tran_sticker_set", tr_type: "gif", tr_size: "small", set_name: set_name }))}`
                    },
                    {
                        text: `批量转gif-大`, url: `${url}&extraData=${encodeURIComponent(JSON.stringify({ event_type: "tran_sticker_set", tr_type: "gif", tr_size: "big", set_name: set_name }))}`
                    },
                ],
                [
                    { text: `批量转mp4-小`, url: `${url}&extraData=${encodeURIComponent(JSON.stringify({ event_type: "tran_sticker_set", tr_type: "mp4", tr_size: "small", set_name: set_name }))}` },
                    { text: `批量转mp4-大`, url: `${url}&extraData=${encodeURIComponent(JSON.stringify({ event_type: "tran_sticker_set", tr_type: "mp4", tr_size: "big", set_name: set_name }))}` },
                ],
                [
                    { text: `批量转webm-小`, url: `${url}&extraData=${encodeURIComponent(JSON.stringify({ event_type: "tran_sticker_set", tr_type: "webm", tr_size: "small", set_name: set_name }))}` },
                    { text: `批量转webm-大`, url: `${url}&extraData=${encodeURIComponent(JSON.stringify({ event_type: "tran_sticker_set", tr_type: "webm", tr_size: "big", set_name: set_name }))}` },
                ],
                [
                    { text: '使用教程', url: `${url}&extraData=${encodeURIComponent(JSON.stringify({ tguid: fromId }))} ` },
                    { text: '开通会员', url: `${url}&extraData=${encodeURIComponent(JSON.stringify({ tguid: fromId }))} ` },
                    { text: '联系客服', url: `${url}&extraData=${encodeURIComponent(JSON.stringify({ tguid: fromId }))} ` },
                ],
            ]
        }
    })

}

//处理表情包菜单  (单个)
async function handle_sticker_menu(bot, msg) {
    console.log("表情包信息")
    let chatId = msg.chat.id
    let fromId = msg.from.id
    let fileId = ""
    let file_width = null
    let file_type = ''
    let thumb_fileId = ""
    let thumb_file_width = null
    let stickersList = []
    let set_name = ""
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

        //获取贴纸集信息
        const stickerSet = await bot.getStickerSet(msg?.sticker?.set_name)
        set_name = msg?.sticker?.set_name
        stickersList = stickerSet.stickers;
        //发送贴纸信息给用户
        await bot.sendMessage(chatId, `贴纸集名称: ${set_name} \n贴纸数量: ${stickersList.length} `);

    }

    if (!fileId) {
        console.log("没有fileId")
        return
    }


    let tg_file_info = await bot.getFile(fileId)
    let thumb_tg_file_info = await bot.getFile(thumb_fileId)


    await bot.sendMessage(chatId, 'tg_file_info:' + JSON.stringify(tg_file_info) + "文件大小:" + (tg_file_info.file_size / 1024 / 1024).toFixed(3) + 'm' + ",宽度:" + file_width)
    await bot.sendMessage(chatId, 'thumb_tg_file_info:' + JSON.stringify(thumb_tg_file_info) + "文件大小:" + (thumb_tg_file_info.file_size / 1024 / 1024).toFixed(3) + 'm' + ",宽度:" + thumb_file_width);
    //await bot.sendAnimation(chatId, sticker_url);
    //await bot.sendAnimation(chatId, thumb_sticker_url);
    let markDown = `
<pre><code class="language-批量表情系列">直接分享表情包的贴纸链接或发送其中一个表情</code></pre>
<pre><code class="language-存表情包">若想存在其他软件作为表情包,请使用转gif-小即可</code></pre>
<pre><code class="language-转mp4">若想用于发送视频给被人,可使用转mp4(兼容性好)或者转webm(文件较小)</code></pre>
<pre><code class="language-会员功能">无广告  系列表情包批量  电脑端下载 大文件下载 速度更快</code></pre>
`
    await bot.sendMessage(chatId, markDown, { parse_mode: 'HTML' });

    let path = '/pages/tg_robot/tg_robot'
    let env_version = 'develop'
    let url = `${h5_url}/#/pages/to_mp/to_mp?path=${encodeURIComponent(path)}&env_version=${env_version}&event_type=tg_tran`

    let inline_keyboard = [
        [
            { text: `转gif-小(估${((thumb_tg_file_info.file_size / 1024 / 1024)).toFixed(2)}m)`, url: `${url}&extraData=${encodeURIComponent(JSON.stringify({ tguid: fromId, tg_file_list: [{ tr_type: "gif", file_path: thumb_tg_file_info.file_path, file_size: thumb_tg_file_info.file_size }] }))} ` },
            { text: `转gif-大(估${((tg_file_info.file_size / 1024 / 1024) * 10).toFixed(2)}m)`, url: `${url}&extraData=${encodeURIComponent(JSON.stringify({ tguid: fromId, tg_file_list: [{ tr_type: "gif", file_path: tg_file_info.file_path, file_size: tg_file_info.file_size }] }))} ` },
        ],
        [
            { text: `转mp4-小(估${((thumb_tg_file_info.file_size / 1024 / 1024)).toFixed(2)}m)`, url: `${url}&extraData=${encodeURIComponent(JSON.stringify({ tguid: fromId, tg_file_list: [{ tr_type: "mp4", file_path: thumb_tg_file_info.file_path, file_size: thumb_tg_file_info.file_size }] }))} ` },
            { text: `转mp4-大(估${((tg_file_info.file_size / 1024 / 1024) * 1).toFixed(2)}m)`, url: `${url}&extraData=${encodeURIComponent(JSON.stringify({ tguid: fromId, tg_file_list: [{ tr_type: "mp4", file_path: tg_file_info.file_path, file_size: tg_file_info.file_size }] }))} ` },
        ],
        [
            { text: `转webm-小(估${((thumb_tg_file_info.file_size / 1024 / 1024)).toFixed(2)}m)`, url: `${url}&extraData=${encodeURIComponent(JSON.stringify({ tguid: fromId, tg_file_list: [{ tr_type: "webm", file_path: thumb_tg_file_info.file_path, file_size: thumb_tg_file_info.file_size }] }))} ` },
            { text: `转webm-大(估${((tg_file_info.file_size / 1024 / 1024) * 1).toFixed(2)}m)`, url: `${url}&extraData=${encodeURIComponent(JSON.stringify({ tguid: fromId, tg_file_list: [{ tr_type: "webm", file_path: tg_file_info.file_path, file_size: tg_file_info.file_size }] }))} ` },
        ],
        [
            { text: `批量下载该表情系列(${stickersList.length}个)`, callback_data: JSON.stringify({ e_type: "tran_sticker_set", set_name: set_name }) },
        ],
        [
            { text: '使用教程', url: `${url}&extraData=${encodeURIComponent(JSON.stringify({ tguid: fromId }))}` },
            { text: '开通会员', url: `${url}&extraData=${encodeURIComponent(JSON.stringify({ tguid: fromId }))}` },
            { text: '联系客服', url: `${url}&extraData=${encodeURIComponent(JSON.stringify({ tguid: fromId }))}` },
        ],
    ]

    await bot.sendMessage(chatId, '请选择一个选项：', {
        reply_markup: {
            inline_keyboard: inline_keyboard
        }
    })

}



module.exports = {
    handle_msg, handle_callback_query
}
