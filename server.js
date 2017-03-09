const http = require('http')
const url = require('url')
const fetcher = require('./fetcher.js');

/** default port is 3001 */
const port = 3002
/** 10000 as code wound be returned if request would not be completed successfully */
const errorCode = 10000;
/** 1 as code wound be returned if request completed well */
const correctCode = 1;
/** driver store*/
let allDrivers = [];
let singleQuery = fetcher.singleQuery;

/**
 * Handle seo information
 * @param request
 * @param response
 */
const reportHandler = (request, response) => {
    /** replace circle*/
    var reqUrl = request.url
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
    singleQuery(rd, date).then(function (entity) {
        response.end(JSON.stringify({
            code: correctCode,
            info: entity
        }));
    });
}


const requestHandler = (request, response) => {
    /** replace circle*/
    let pathName = url.parse(request.url, true).pathname;
    if (pathName == '/report') {
        reportHandler(request, response);
    } else {
        response.end('unused command');
    }
}


    const server = http.createServer(requestHandler)

    server.listen(port, '127.0.0.1', (err) => {
    if (err) {
        return console.log('something bad happened', err)
    }
    console.log(`scraper server is listening on ${port}`)
})