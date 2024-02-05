const axios = require('axios');
const fs = require('fs');

async function downloadImage() {
    const imageUrl = 'https://hk-bucket-a.oss-cn-hongkong.aliyuncs.com/tmp/6714802559%3AAAGToYZ0rJlDxWY2NR9ItQt1z111RON8ct4/stickers/file_117.gif?OSSAccessKeyId=LTAI4FywD6CchnqeADGXsErR&Expires=1706248619&Signature=XvRVgiHKXXGrqNy1jeGtz1pulmQ%3D'; // 图片的 URL
    const imagePath = 'test3.gif'; // 图片保存的本地路径

    try {
        const response = await axios.get(imageUrl, { responseType: 'stream' });
        response.data.pipe(fs.createWriteStream(imagePath))
            .on('finish', function () {
                console.log('图片下载完成');
            })
            .on('error', function (err) {
                console.error('图片下载失败:', err);
            });
    } catch (err) {
        console.error('请求图片失败:', err);
    }
}

downloadImage();
