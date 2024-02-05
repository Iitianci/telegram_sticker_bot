const express = require('express');
const bodyParser = require('body-parser');
const TeleBot2 = require('node-telegram-bot-api');
const axios = require('axios')
const { handle_msg, handle_callback_query } = require('./handle_event.js')
const { webhook_url, tg_token, listen_port } = require('./config.js')

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());


// 使用给定的令牌创建 bot 实例.
const bot = new TeleBot2(tg_token, { polling: false });
bot.setWebHook(
    webhook_url,
    {
        max_connections: 100
    }
)

bot.on('webhook_error', (error) => {
    console.error('Webhook请求出错', error)
})

// 使用 getMe 方法来获取机器人信息
bot.getMe().then((me) => {
    console.log(`Bot ID: ${me.id}`);
    console.log(`Username: @${me.username}`);
    console.log(`Name: ${me.first_name} ${me.last_name || ''}`);
}).catch((error) => {
    console.error("bot.getMe error", error);
});

app.get('/*', async (req, res) => {
    console.log("get---")
    setTimeout(() => {
        res.send('Hello World123!' + new Date().getTime())
    }, 500)
})



app.post("test", async (req, res) => {

})

app.post("/getStickerSet", async (req, res) => {
    let bodyJson = req?.body || {}
    let { sticker_set_name, tr_type, tr_size } = bodyJson
    // 获取贴纸集信息
    let tg_file_list = []
    try {
        if (sticker_set_name) {
            console.log("获取set列表", sticker_set_name)
            const stickerSet = await bot.getStickerSet(sticker_set_name);
            const stickersList = stickerSet.stickers;
            // 获取所有贴纸的文件fileid
            for (let i = 0; i < stickersList.length; i++) {
                const fileId = tr_size == 'big' ? stickersList[i].file_id : stickersList[i].thumb.file_id
                const file_info = await bot.getFile(fileId)
                // console.log("time", new Date().getTime(), "fileId", fileId, "file_info", file_info)
                let item = {
                    "file_size": file_info.file_size,
                    "file_path": file_info.file_path,
                    "tr_type": tr_type
                }
                tg_file_list.push(item)
            }

            res.json({ code: 0, msg: "请求成功", tg_file_list, sticker_length: stickersList.length })

        } else {
            res.json({ code: 403, msg: "请求失败,请输入sticker_set_name" });
        }
    } catch (error) {
        console.log("error", error)
        res.json({ code: 403, msg: error.toString() });
    }

})

app.post('/*', async (req, res) => {

    console.log("req body---", req?.body)

    let bodyJson = req?.body || {}
    let need_handle = bodyJson.need_handle || false

    //   let bodyJson = JSON.parse(req.body)

    //初始信息并且没有告诉需要处理
    if (bodyJson?.message) {
        //需要处理
        if (bodyJson?.message?.chat?.id) {
            await bot.sendMessage(bodyJson?.message?.chat?.id, "正在处理..");
            await handle_msg(bot, bodyJson?.message)
        }

    } else if (bodyJson?.callback_query) {
        console.log("回调参数处理")
        await handle_callback_query(bot, bodyJson)
        res.send('Hello need_handle!' + new Date().getTime())

    }
    else {
        console.log("无匹配处理")
        res.send('Hello World456!' + new Date().getTime())
    }

    res.json({ code: 0, msg: "请求成功" })

})


app.listen(listen_port, () => {
    console.log(`Example app listening on port ${listen_port}`)
})
