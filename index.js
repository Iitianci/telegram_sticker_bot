const express = require('express');
const bodyParser = require('body-parser');
const app = express();


const { handle_msg } = require('./handle_event.js')
const {
    webhook_url, webhook_url_256, webhook_url_512, tg_token, listen_port
} = require('./config.js')

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());

const port = 9000


const TeleBot2 = require('node-telegram-bot-api');
const axios = require('axios')

const fs = require('fs')
const path = require('path')



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

app.post('/*', async (req, res) => {

    console.log("req body---", req?.body)

    let bodyJson = req?.body || {}
    let need_handle = bodyJson.need_handle || false

    //   let bodyJson = JSON.parse(req.body)

    //初始信息并且没有告诉需要处理
    if (!need_handle && bodyJson?.message) {
        //需要处理
        if (bodyJson?.message?.chat?.id) {
            await bot.sendMessage(bodyJson?.message?.chat?.id, "正在处理..");
        }
        bodyJson.need_handle = true
        axios.post(webhook_url, bodyJson);
        setTimeout(() => {
            res.send('Hello need_handle!' + new Date().getTime())
        }, 500)
    } else if (need_handle && bodyJson?.message) {
        console.log("需要等待处理")
        await handle_msg(bot, bodyJson?.message)
        console.log("处理已完成")
        res.send('Hello need_handle!' + new Date().getTime())

    } else if (bodyJson?.new_chat_photo) {
        console.log("群聊修改头像")
    } else if (bodyJson?.new_chat_title) {
        console.log("群聊名称", new_chat_title)
    }

    else {
        console.log("无匹配处理")
        res.send('Hello World456!' + new Date().getTime())
    }

})


app.listen(listen_port, () => {
    console.log(`Example app listening on port ${listen_port}`)
})
