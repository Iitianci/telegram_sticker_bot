const tgs2 = require('tgs2');

const { file_list, checkFileAndGenerateUrl } = require('./oss.js')


const path = require('path')

const file_path = `/a/b/test.txt`

const basename = path.basename(file_path, path.extname(file_path))

console.log("basename", basename)