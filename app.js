const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const tgs2 = require('tgs2');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());

const port = 9000
let count = 0

const TeleBot2 = require('node-telegram-bot-api');
const axios = require('axios')
const webhook_url = 'https://tsg-msg-ua-liiqthhgei.us-west-1.fcapp.run'
const fs = require('fs')
const { exec, execSync } = require('child_process');


let currentPath = __dirname;
console.log('当前绝对路径:', currentPath);

fs.readdir(currentPath, (err, files) => {
    if (err) {
        console.error('读取文件失败:', err);
    } else {
        console.log('当前路径下的文件:');
        files.forEach((file) => {
            console.log(file);
        });
    }
});

// 替换成你自己 bot token，在 @BotFather 那里获得。
const token = '6714802559:AAGToYZ0rJlDxWY2NR9ItQt1z111RON8ct4';

// 使用给定的令牌创建 bot 实例.
const bot = new TeleBot2(token, { polling: false });


bot.setWebHook(
    webhook_url
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

async function convertStickerToGif(fileId, stickerFilePath) {
    let gifFilePath = `${fileId}.gif`;
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
                    exportPath: './'
                }
            )

        } else {
            const command = `ffmpeg -i ${stickerFilePath} -f gif ${gifFilePath}`;
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


async function downloadSticker(fileId) {

    try {
        let start_time = new Date().getTime()
        let fileDetailsResponse = await bot.getFile(fileId);
        console.log("fileDetailsResponse--", fileDetailsResponse)
        if (!fileDetailsResponse.file_size) {
            console.log("无法获取的文件信息!")
            throw new Error(`Failed to get file details for ${fileId}`);
        }

        let downloadUrl = `https://api.telegram.org/file/bot${token}/${fileDetailsResponse.file_path}`;

        const response = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
        const stickerFilePath = `${fileId}.${fileDetailsResponse.file_path.split('.').pop()}`;
        fs.writeFileSync(stickerFilePath, response.data);
        let end_time = new Date().getTime()
        console.log("downloadSticker diffTime", (end_time - start_time) / 1000, (end_time - start_time) / 60000)
        return stickerFilePath;
    } catch (error) {
        console.log("downloadSticker error", error)
        throw error;
    }

}


app.get('/*', async (req, res) => {
    console.log("get---")
    setTimeout(() => {
        res.send('Hello World123!' + new Date().getTime())
    }, 5000)
})

app.post('/*', async (req, res) => {
    count++
    //   console.log("req body---",req?.body)

    let bodyJson = req?.body || {}
    let need_handle = bodyJson.need_handle || false

    //   let bodyJson = JSON.parse(req.body)

    //初始信息并且没有告诉需要处理
    if (!need_handle && bodyJson?.message) {
        //需要处理
        console.log("需要调用处理", bodyJson?.message)
        bodyJson.need_handle = true
        axios.post(webhook_url, bodyJson);
        setTimeout(() => {
            res.send('Hello need_handle!' + new Date().getTime())
        }, 500)
    } else if (need_handle && bodyJson?.message) {
        console.log("需要等待处理")
        await handle_msg(bodyJson?.message)
        console.log("处理已完成")
        res.send('Hello need_handle!' + new Date().getTime())

    } else {
        console.log("无匹配处理")
        res.send('Hello World456!' + new Date().getTime())
    }

})
async function get_tg_file_url(fileId) {
    let fileDetailsResponse = await bot.getFile(fileId);
    console.log("fileDetailsResponse--", fileDetailsResponse)
    if (!fileDetailsResponse.file_size) {
        console.log("无法获取的文件信息!")
        throw new Error(`Failed to get file details for ${fileId}`);
    }

    let file_url = `https://api.telegram.org/file/bot${token}/${fileDetailsResponse.file_path}`;
    return file_url
}
async function handle_msg(msg) {
    // console.log("message----", msg)
    let chatId = msg.chat.id;
    let fileId = ""
    let thumb_fileId = ""
    console.log("正在处理..", chatId)
    try {
        await bot.sendMessage(chatId, JSON.stringify(msg));
        await bot.sendMessage(chatId, count);
        if (msg.animation && msg?.animation?.mime_type === "video/mp4") {
            console.log("正在处理mp4..", chatId)
            fileId = msg?.animation?.file_id;
            thumb_fileId = msg?.animation?.thumb?.fileId
            // 下载接收到的 GIF 消息
            //console.log("Received a gif:", JSON.stringify(msg.animation));
            //提示去下载视频到公众号发送

        } else if (msg?.sticker && msg?.sticker?.file_id) {
            console.log("正在处理sticker..", chatId)
            // 下载接收到的 Sticker
            // console.log("Received a sticker:", JSON.stringify(msg.sticker));
            fileId = msg?.sticker?.file_id
            thumb_fileId = msg?.sticker?.thumb?.fileId
        }

        console.log("fileId--", fileId, "thumb_fileId", thumb_fileId)

        if (!fileId) {
            console.log("没有fileId")
            return
        }


        let sticker_url = get_tg_file_url(fileId)
        let thumb_sticker_url = get_tg_file_url(thumb_fileId)

        await bot.sendMessage(chatId, 'sticker_url:' + sticker_url)
        await bot.sendMessage(chatId, 'thumb_sticker_url:' + sticker_url);
        await bot.sendAnimation(chatId, sticker_url);
        await bot.sendAnimation(chatId, thumb_sticker_url);



        //转换过程
        let stickerFilePath = await downloadSticker(fileId)
        let gifFilePath = await convertStickerToGif(fileId, stickerFilePath);
        console.log("gifFilePath--", gifFilePath)
        if (gifFilePath) {
            await bot.sendAnimation(chatId, gifFilePath);
        } else {
            console.log("没有转换gif成功")
        }

        //清除生成的图片
        try {
            fs.unlinkSync(stickerFilePath);
            fs.unlinkSync(gifFilePath);
        } catch (error) {

        }

    } catch (error) {
        console.log("bot.onMessage error--", error)
    }

}

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
