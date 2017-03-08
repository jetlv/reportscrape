/// <reference path="../../include.d.ts" />
var rp = require('request-promise');
var Promise = require('bluebird');
var cheerio = require('cheerio');
var fs = require('fs');

/** Configure loggers */
var winston = require('winston');
var logger = new (winston.Logger)({
    transports: [
        // new (winston.transports.File)({
        //     name: 'info-file',
        //     filename: 'filelog-info.log',
        //     level: 'info'
        // }),
        new (winston.transports.File)({
            name: 'error-file',
            filename: 'filelog-error.log',
            level: 'error'
        })
    ]
});

/** Configure request timeout and proixes if required*/
rp = rp.defaults({proxy: 'http://127.0.0.1:1081', timeout: 30000});

/** compose url by yourself */

/** Single Req */
function singleQuery(rd, date) {
    let year = date.split('-')[0];
    let month = date.split('-')[1];
    let day = date.split('-')[2];
    console.log('start working on ' + rd + ' - ' + month + '/' + day + '/' + year);
    let har = {
        "postData": {
            "params": [{
                "name": "rd",
                "value": rd
            },
                {
                    "name": "crashDate",
                    "value": month + '/' + day + '/' + year
                },
                {
                    "name": "g-recaptcha-response",
                    "value": "03AI-r6f5DaXRA1XzMDVp4BmUC9cr--POU82b1TdMfjR7we5kqTpaEpXddcNfMvhLWK08A32OKw_ICX1uNeNN9J8wJczVVtcWd5zPsi-hfrzDDr9poDYvUOT1KvZRY3toe4SFdpE2ptjqbhAhtqL7DP-AR-xXWRNyPq3lq68ZaJVzOwhUvxiARyxILKWU9zEg4N48_S6umKX-md8T9G1VRxmPFnvTzlOhVwwLA-7SGRc3bJgDLXe1FuadxfBFgPa5DdUupYuFHihzsWfao_t2wYNiDJ9i1q_l9QtIIZ45C8yceXRVBePz0fjGDTscP9TYXY8CF3rh6UR49hIzcIKJUwOcVOebVc5odKrp_8SDin3fxbFhqroDenVFFJhkcgaUU-TI7x9gl8JJq5LWexHnGfmt3JPyICNrhjNiBIJEYWZ1jQuKGcqg4chU"
                }],
            "mimeType": "application/x-www-form-urlencoded"
        },
        "queryString": [],
        "headers": [
            {
                "name": "Host",
                "value": "crash.chicagopolice.org"
            },
            {
                "name": "Connection",
                "value": "keep-alive"
            },
            {
                "name": "Pragma",
                "value": "no-cache"
            },
            {
                "name": "Cache-Control",
                "value": "no-cache"
            },
            {
                "name": "Origin",
                "value": "https://crash.chicagopolice.org"
            },
            {
                "name": "Upgrade-Insecure-Requests",
                "value": "1"
            },
            {
                "name": "User-Agent",
                "value": "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.99 Safari/537.36"
            },
            {
                "name": "Content-Type",
                "value": "application/x-www-form-urlencoded"
            },
            {
                "name": "Accept",
                "value": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
            },
            {
                "name": "Referer",
                "value": "https://crash.chicagopolice.org/DriverInformationExchange/driverInfo"
            },
            {
                "name": "Accept-Encoding",
                "value": "gzip, deflate, br"
            },
            {
                "name": "Accept-Language",
                "value": "zh-CN,zh;q=0.8"
            }],
        "url": "https://crash.chicagopolice.org/DriverInformationExchange/driverInfo",
        "cookies": [],
        "method": "POST",
        "httpVersion": "HTTP/1.1"
    }
    var options = {
        har: har,
        gzip: true,
        rejectUnauthorized: false
    };
    let entity = {rd: rd, driverdata: {}};
    return rp(options)
        .then(function (body) {
                var $ = cheerio.load(body);
                $('.panel.panel-primary .panel-body').each(function (index, element) {
                    let mainKey = '';
                    if (index == 0) {
                        mainKey = 'general';
                    }
                    else if (index == 1) {
                        mainKey = 'unit1';
                    } else {
                        mainKey = 'unit2';
                    }
                    entity.driverdata["" + mainKey] = {};
                    // console.log(mainKey);
                    // console.log(entity.driverdata);
                    let outerThis = $(this);
                    $(this).find('dt').each(function (dtIndex, element) {
                        entity.driverdata["" + mainKey]["" + $(this).text().trim()] = outerThis.find('dd').eq(dtIndex).text().trim();
                    });
                });
                return entity;
            }
        ).catch(function (err) {
            logger.log('error', err + ' - ' + url);
        });
}


module.exports = {
    singleQuery: singleQuery
}