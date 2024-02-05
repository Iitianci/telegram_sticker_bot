const NodeCache = require("node-cache");
const myCache = new NodeCache();

const express = require('express')
const bodyParser = require('body-parser');


const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());


let result = {
    code: 0,
    msg: "请求成功",
    data: {}
}


app.post("/getCache", async (req, res) => {
    let bodyJson = req?.body || {}
    let { key } = bodyJson
    result.data = myCache.get(key)
    res.json(result)
})

app.post("/takeCache", async (req, res) => {
    let bodyJson = req?.body || {}
    let { key } = bodyJson
    result.data = myCache.take(key)
    res.json(result)
})


app.post("/setCache", async (req, res) => {
    let bodyJson = req?.body || {}
    let { key, value, ttl } = bodyJson
    myCache.set(key, value, ttl)
    res.json(result)
})

app.post("/msetCache", async (req, res) => {
    let bodyJson = req?.body || {}
    let { cache_list } = bodyJson
    myCache.mset(cache_list)
    res.json(result)
})

app.post("/delCache", async (req, res) => {
    let bodyJson = req?.body || {}
    let { key } = bodyJson
    myCache.del(key)
    res.json(result)
})

app.listen(3000)


