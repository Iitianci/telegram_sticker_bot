const fs = require('fs')
const axios = require('axios');
const TeleBot = require('node-telegram-bot-api');

// 替换成你自己 bot token，在 @BotFather 那里获得。
const token = '6714802559:AAGToYZ0rJlDxWY2NR9ItQt1z111RON8ct4';


// 使用给定的令牌创建 bot 实例.
const bot = new TeleBot(token, {
    polling: false,
});

bot.setWebHook(
    'https://fc-mp-692a61ca-45bc-4bb8-a570-5a1247384c1b.next.bspapp.com/router/client/tg_msg/pub/index'
)

bot.on('webhook_error', (error) => {
    console.error('Webhook请求出错', error)
})

bot.on('error', (error) => {
    // 处理机器人的错误
    console.error('bot出错', error)
});





// 使用 getMe 方法来获取机器人信息
bot.getMe().then((me) => {
    console.log(`Bot ID: ${me.id}`);
    console.log(`Username: @${me.username}`);
    console.log(`Name: ${me.first_name} ${me.last_name || ''}`);
}).catch((error) => {
    console.error(error);
});


// 当收到 /start 命令时触发此事件处理程序.
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;

    // 发送欢迎消息给用户.
    bot.sendMessage(chatId, '欢迎使用我的机器人！');
});


//监听信息通知
bot.on('message', async (msg) => {
    console.log("message----", msg)
    const chatId = msg.chat.id;
    let fileId = ""

    try {
        if (msg.animation && msg.animation.mime_type === "video/mp4") {
            fileId = msg.animation.file_id;
            // 下载接收到的 GIF 消息
            //console.log("Received a gif:", JSON.stringify(msg.animation));
            //提示去下载视频到公众号发送

        } else if (msg.sticker && msg.sticker.file_id) {
            // 下载接收到的 Sticker
            // console.log("Received a sticker:", JSON.stringify(msg.sticker));
            fileId = msg.sticker.file_id;
        }

        console.log("fileId", fileId)
    } catch (error) {
        console.log("error--", error)
    }

});




// 监听文本消息并回复相同内容.
bot.on('text', (msg) => {
    console.log("msg-------", msg)
    const chatId = msg.chat.id;

    // 获取接收到的消息文本内容并发送相同内容作为回复.

    var text = msg.text;
    response = text
    bot.sendMessage(chatId, response);
});

