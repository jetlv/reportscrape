const http = require('http')
const url = require('url')
const fetcher = require('./fetcher.js');

/** default port is 3001 */
const port = 3001
/** 10000 as code wound be returned if request would not be completed successfully */
const errorCode = 10000;
/** 1 as code wound be returned if request completed well */
const correctCode = 1;
/** driver store*/
let allDrivers = [];
let singleQuery = fetcher.singleQuery;
let permissions = ['::ffff:74.63.228.139','::ffff:74.63.249.3','::ffff:64.31.54.3','::ffff:69.162.87.183','::ffff:1.82.229.8', '::ffff:76.185.78.250', '::ffff:127.0.0.1', '::ffff:184.168.20.153','::ffff:104.224.191.78', '::ffff:104.238.144.250'];





/**
 * Handle seo information
 * @param request
 * @param response
 */
const reportHandler = async (request, response) => { // 添加 async 关键字
    /** replace circle*/
    var reqUrl = request.url;
    /**  parse url */
    var queryObject = url.parse(reqUrl, true).query;
    var rd = queryObject.rd;
    var date = queryObject.date;
    
    if (!rd) {
        response.end(JSON.stringify({
            code: errorCode,
            message: 'Please provide rd'
        }));
        return;
    }
    
    if (!date) {
        response.end(JSON.stringify({
            code: errorCode,
            message: 'Please provide date'
        }));
        return;
    }
    
    try {
        const entity = await singleQuery(rd, date); // 使用 await 等待 singleQuery 的结果
        response.end(JSON.stringify({
            code: correctCode,
            info: entity
        }));
    } catch (error) {
        // 处理 singleQuery 抛出的错误
        console.error('Error in singleQuery:', error);
        response.end(JSON.stringify({
            code: errorCode,
            message: 'Error occurred while processing the query'
        }));
    }
}



const requestHandler = (request, response) => {
    /** replace circle*/
    let ip = request.connection.remoteAddress;
    if (permissions.indexOf(ip) == -1) {
        console.log(ip + ' bad request');
        response.end(JSON.stringify({
            code: errorCode,
            message: 'You have no permission'
        }));
        return;
    }

    let pathName = url.parse(request.url, true).pathname;
    if (pathName == '/report') {
        reportHandler(request, response);
    } else {
        response.end('unused command');
    }
}


const server = http.createServer(requestHandler)

server.listen(port, (err) => {
    if (err) {
        return console.log('something bad happened', err)
    }
    console.log(`scraper server is listening on ${port}`)
})

// const server1 = http.createServer(requestHandler)
//
// server1.listen(port, '119.4.113.57', (err) => {
//     if (err) {
//         return console.log('something bad happened', err)
//     }
//     console.log(`scraper server is listening on ${port}`)
// })
//
// const server2 = http.createServer(requestHandler)
//
// server2.listen(port, '2605:6000:8bcb:e000:5cc1:8462:f75f:a27c', (err) => {
//     if (err) {
//         return console.log('something bad happened', err)
//     }
//     console.log(`scraper server is listening on ${port}`)
// })