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
//rp = rp.defaults({proxy: 'http://127.0.0.1:1081', timeout: 30000});

/** compose url by yourself */

/** Single Req */
function accident_singleQuery(date) {
    let cases = [];
    let url = 'http://itmdapps.milwaukee.gov/wmvar/AccidentSearch?date=' + date;
    let options = {
        uri : url,
        method : 'GET',
        gzip : true
    }
    return rp(options).then(function(body) {
        let $ = cheerio.load(body);
        $('#searchresults table tr').each(function(index, element) {
            if(index == 0) {
                return;
            }
            cases.push($(this).find('td').eq(0).text().trim());
        });
        return cases;
    }).then(function(cases) {
        let resultJSON = {};
        resultJSON.date = date;
        resultJSON.cases = [];
        return Promise.map(cases, function (singleCase) {
            let har = {
                "method": "POST",
                "url": "https://app.wi.gov/crashreports/addcrashreport",
                "httpVersion": "HTTP/1.1",
                "headers": [
                    {
                        "name": "Cookie",
                        "value": "_ga=GA1.2.1336646541.1489914445; ASP.NET_SessionId=jqd33ba4hqkjr5frejasrkzv"
                    },
                    {
                        "name": "Origin",
                        "value": "https://app.wi.gov"
                    },
                    {
                        "name": "Accept-Encoding",
                        "value": "gzip, deflate, br"
                    },
                    {
                        "name": "Host",
                        "value": "app.wi.gov"
                    },
                    {
                        "name": "Accept-Language",
                        "value": "zh-CN,zh;q=0.8"
                    },
                    {
                        "name": "User-Agent",
                        "value": "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36"
                    },
                    {
                        "name": "Content-Type",
                        "value": "application/json; charset=UTF-8"
                    },
                    {
                        "name": "Accept",
                        "value": "application/json, text/javascript, */*; q=0.01"
                    },
                    {
                        "name": "Referer",
                        "value": "https://app.wi.gov/crashreports"
                    },
                    {
                        "name": "X-Requested-With",
                        "value": "XMLHttpRequest"
                    },
                    {
                        "name": "Connection",
                        "value": "keep-alive"
                    },
                    {
                        "name": "Content-Length",
                        "value": "131"
                    }
                ],
                "queryString": [],
                "cookies": [
                    {
                        "name": "_ga",
                        "value": "GA1.2.1336646541.1489914445",
                        "expires": null,
                        "httpOnly": false,
                        "secure": false
                    },
                    {
                        "name": "ASP.NET_SessionId",
                        "value": "jqd33ba4hqkjr5frejasrkzv",
                        "expires": null,
                        "httpOnly": false,
                        "secure": false
                    }
                ],
                "postData": {
                    "mimeType": "application/json; charset=UTF-8",
                    "text": "{\"query\":{\"DocumentNumber\":\"" + singleCase + "\",\"AccidentNumber\":null,\"DriversLicenseNumber\":null,\"CrashDate\":null,\"showAddMoreMsg\":false}}"
                }
            }
            let sOptions = {
                har: har,
                gzip: true,
                json: true
            }
            return rp(sOptions).then(function (gotCase) {
                // console.log(gotCase.CrashDetails)
                let accidentNum = '';
                if (gotCase.CrashDetails) {
                    accidentNum = gotCase.CrashDetails.AccidentNumber;
                } else {
                    // console.log(gotCase.Status.CustomerMessage);
                    accidentNum = gotCase.Status.CustomerMessage.match(/\d+/)[0];
                }
                console.log(accidentNum);
                resultJSON.cases.push({caseNumber: singleCase, accidentNumber: accidentNum});
                // return resultJSON;
            }).catch(function (err) {
                logger.log('wi.gov ERROR - ', err + ' - ' + singleCase);
            });
        }, {concurrency: 2}).then(function () {
            console.log(resultJSON);
        });
    }).then(function(err) {
        logger.log('outer ERROR - ', err + ' - ' + singleCase);
    });
}

accident_singleQuery('03/13/2017')

module.exports = {
    accident_singleQuery: accident_singleQuery
}