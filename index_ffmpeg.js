const express = require('express');
const bodyParser = require('body-parser');
const { convertTGFile } = require('./ffmpeg_process.js')
const { listen_port } = require('./config.js')

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());




app.get('/*', async (req, res) => {
    console.log("get---")
    setTimeout(() => {
        res.send('Hello World123!' + new Date().getTime())
    }, 500)
})

app.post('/to_transform_tg_file', async (req, res) => {
    let bodyJson = req?.body || {}
    let { file_path, file_width, tr_type, fps, compression_level } = bodyJson
    console.log("转换文件")
    if (!file_path) {
        res.json({ code: 404, msg: "没有文件" });
    } else {
        let { oss_file_url, oss_file_size } = await convertTGFile(file_path, file_width, tr_type, fps, compression_level)
        res.json({ oss_file_url, oss_file_size });
    }
})


app.listen(listen_port, () => {
    console.log(`Example app listening on port ${listen_port}`)
})
