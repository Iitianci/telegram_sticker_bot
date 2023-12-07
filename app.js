
const TeleBot = require('node-telegram-bot-api');

// 替换成你自己 bot token，在 @BotFather 那里获得。
const token = '6714802559:AAGToYZ0rJlDxWY2NR9ItQt1z111RON8ct4';

// 使用给定的令牌创建 bot 实例.
const bot = new TeleBot(token, { polling: true });

// console.log("bot", bot)

// 当收到 /start 命令时触发此事件处理程序.
// bot.onText(/\/start/, (msg) => {
//     const chatId = msg.chat.id;

//     // 发送欢迎消息给用户.
//     bot.sendMessage(chatId, '欢迎使用我的机器人！');
// });


async function getConnectedClientsCount() {
    try {
        // 调用 getWebhookInfo 方法以获得 webhook 相关信息  
        console.log("调用 getWebhookInfo 方法以获得 webhook 相关信息  ")
        const info = await bot.getWebHookInfo();
        console.log("info---------", info)
        return info.connections;
    } catch (error) {
        throw error;
    }
}

async function main() {
    try {
        const connectedClientsCount = await getConnectedClientsCount();

        console.log(`The bot is running on ${connectedClientsCount} clients.`);
    } catch (error) {
        console.error('Failed to retrieve the information:', error);
    }
}

setTimeout(() => {
    main();
}, 5000);



// 监听文本消息并回复相同内容.
bot.on('text', (msg) => {
    const chatId = msg.chat.id;

    // 获取接收到的消息文本内容并发送相同内容作为回复.

    var text = msg.text;
    if (text == '/hello') {
        response = "Hello! How can I assist you?";
    } else {
        response = "Sorry, I didn't understand that.";
    }

    bot.sendMessage(chatId, response);
});

// 启动机器人.
// bot.start();

