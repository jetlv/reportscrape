/// <reference path="../../include.d.ts" />
var Promise = require('bluebird');
var cheerio = require('cheerio');
var fs = require('fs');

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const rimraf = require('rimraf');
const tmp = require('tmp');


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


const proxies = [`us-wa.proxymesh.com:31280`, `us-il.proxymesh.com:31280`, `us.proxymesh.com:31280`, `us-dc.proxymesh.com:31280`, `us-ca.proxymesh.com:31280`]

function grabAnProxyServer() {
    let random = Math.floor(Math.random() * proxies.length);
    let proxy = `http://${proxies[random]}`    
    return proxy
    //return "http://zproxy.lum-superproxy.io:22225"
}

function grabAnProxyServerBrightData() { 
    return "http://zproxy.lum-superproxy.io:22225"
}

// For proxy mesh
async function subQuerySteps(page, rdNumber, date) {
    await page.goto(`https://crash.chicagopolice.org/DriverInformationExchange/home`);      
    await page.waitForSelector(`#rd`, {visible: true, timeout: 30000})                 
    await page.type('#rd', rdNumber); // 替换选择器和实际的RD Number
    await page.type('#crashDate', date); // 替换选择器和实际的Date    
    const recaptchaResponse = "03AKH6MRExXBDD_EXn6WATftWACnoAh7bMpKV3LzLIkbCzuy2Lh1ta3FxHgQrfeUbeZFmlTkZiLz1fqikH3fe6ZRLwhxxne2Qri_ZjRblPKSEVFthPlvxf65vlPJnWR9Z774B86De7gWf8x6OoxWukS_szWqcoVUz9AriO6S7xSjNcLHklHIhfLFFzlz0YSiorN7TDD3xFFZAe5D_07ENM3rAm02NyNGIcQyG3LaWKLZ4aX0H2qf2Tp2Zm69iedpmaQQ1zkW-P1cJhuoAiZ84Vd7dVYW3XP-3_WUtZ2ISN2ySr8atKJsJz_MLbQN_ELfhAdwvkHzwVVK6QN9QTv-NvLesW_iA0rpDMaa_h-gh2J9T74SlaXOP0cCghj0A1LRmB5V1d79nXht7QqKbVf-5F8zyy6xBGvVWNZauEaRzECz4tHoEZ8SN1rYL1fF0cyAjDsfnzrVAfuia7chR3ErDYesjlGrdh8MFdkW-Rzb4-5IgjW8r_CChiegt5VcaNBBns2gbKtyBvKykkdXylR3A-1k210pTwhzeBdgIlwl6ed2ULEmq6oQGHLl0-rJTNnRiUpsHvcRY-KsuOwU2mhuHF_KbTgZK1G6KA1y64ygdjBTq3EU1BO7a9rKs"
    //console.log(`Get response ${recaptchaResponse}`)
    await page.evaluate((response) => {
        document.querySelector('#g-recaptcha-response').value = response; // 替换为实际的reCAPTCHA响应输入选择器
    }, recaptchaResponse);            
    // 提交表单
    const navigationPromise = page.waitForNavigation();
    await page.click('input[value="Submit"]'); // 替换为实际的提交按钮选择器
    const postResponse = await navigationPromise;
    const postStatusCode = postResponse.status();
    return postStatusCode
}


// For bright data
async function subQueryStepsBrightData(page, rdNumber, date) {
    await page.goto(`https://crash.chicagopolice.org/DriverInformationExchange/home`);      
    await page.waitForSelector(`#rd`, {visible: true, timeout: 30000})                 
    await page.type('#rd', rdNumber); // 替换选择器和实际的RD Number
    await page.type('#crashDate', date); // 替换选择器和实际的Date    

    //console.log(`Get response ${recaptchaResponse}`)
    await page.evaluate(() => {
        const recaptchaInput = document.createElement('input');
        recaptchaInput.setAttribute('type', 'hidden');
        recaptchaInput.setAttribute('id', 'g-recaptcha-response');
        recaptchaInput.setAttribute('name', 'g-recaptcha-response');
        recaptchaInput.value = "03AKH6MRExXBDD_EXn6WATftWACnoAh7bMpKV3LzLIkbCzuy2Lh1ta3FxHgQrfeUbeZFmlTkZiLz1fqikH3fe6ZRLwhxxne2Qri_ZjRblPKSEVFthPlvxf65vlPJnWR9Z774B86De7gWf8x6OoxWukS_szWqcoVUz9AriO6S7xSjNcLHklHIhfLFFzlz0YSiorN7TDD3xFFZAe5D_07ENM3rAm02NyNGIcQyG3LaWKLZ4aX0H2qf2Tp2Zm69iedpmaQQ1zkW-P1cJhuoAiZ84Vd7dVYW3XP-3_WUtZ2ISN2ySr8atKJsJz_MLbQN_ELfhAdwvkHzwVVK6QN9QTv-NvLesW_iA0rpDMaa_h-gh2J9T74SlaXOP0cCghj0A1LRmB5V1d79nXht7QqKbVf-5F8zyy6xBGvVWNZauEaRzECz4tHoEZ8SN1rYL1fF0cyAjDsfnzrVAfuia7chR3ErDYesjlGrdh8MFdkW-Rzb4-5IgjW8r_CChiegt5VcaNBBns2gbKtyBvKykkdXylR3A-1k210pTwhzeBdgIlwl6ed2ULEmq6oQGHLl0-rJTNnRiUpsHvcRY-KsuOwU2mhuHF_KbTgZK1G6KA1y64ygdjBTq3EU1BO7a9rKs";
        document.querySelector('form').appendChild(recaptchaInput);
    });

    const navigationPromise = page.waitForNavigation();
    await page.click('input[value="Submit"]'); // 替换为实际的提交按钮选择器
    const postResponse = await navigationPromise;
    const postStatusCode = postResponse.status();
    return postStatusCode
}

async function getDriverInformationExchangeResponse(rdNumber, date) {
    let browser = null
    let html = ''
    const tmpFolder = tmp.dirSync();
    console.log(`${tmpFolder.name} created for ${rdNumber} + ${date}`)
    try {     
        browser = await puppeteer.launch({
            // args: ['--no-sandbox', `--proxy-server=http://127.0.0.1:1080`],
            args:  ['--no-sandbox', '--disable-setuid-sandbox',`--proxy-server=${grabAnProxyServerBrightData()}`],
            headless: true,
            ignoreHTTPSErrors: true,
            userDataDir: tmpFolder.name
        });                                
        const page = await browser.newPage();    
        // Bright data
        await page.authenticate({username: 'brd-customer-hl_60aa431d-zone-zone1', password: 'lkl8tbg6up2o'})
        // Proxy mesh
        //await page.authenticate({username: 'emckibbin@accident-data.com', password: 'UzT8gAYJHixPa8S'})
        page.on('response', async (response) => {
            // console.log(`URL: ${response.url()}`);
            if(response.url() == 'https://crash.chicagopolice.org/DriverInformationExchange/home'){
                console.log(`${rdNumber} + ${date}: home page Status: ${response.status()}`);
                //console.log(`Headers:`, response.headers());
                //onsole.log(`Text:`, await response.text());
            }
            if(response.url() == 'https://crash.chicagopolice.org/DriverInformationExchange/driverInfo'){
                console.log(`${rdNumber} + ${date}: post page Status: ${response.status()}`);
                //console.log(`Headers:`, response.headers());
                //onsole.log(`Text:`, await response.text());
            }
            });
        let postGot200 = false        
        let postStatusCode = await subQueryStepsBrightData(page, rdNumber, date)
        if(postStatusCode == 200) {
            postGot200 = true
        }            
        if(postStatusCode == 429) {
            console.log(`${rdNumber} + ${date} Blocked by cloudflare 429, we need to hard delay 60s and retry`)                
            await Promise.delay(60000)
            console.log(`${rdNumber} + ${date} retrying`)                
            postStatusCode = await subQueryStepsBrightData(page, rdNumber, date)
            if(postStatusCode == 429) {
                console.log(`${rdNumber} + ${date} got 429 again after retry, end process`)                
            }
            if(postStatusCode == 200) {
                console.log(`${rdNumber} + ${date} got 200 after retry, continue`)    
                postGot200 = true
            }
        }       
        if(postGot200) {
            try {
                await page.waitForSelector(`.navbar-header`, {visible: true, timeout: 10000})                         
            }catch(error) {
                console.log("page was not loaded, html like below ")
                const errorHtml = await page.content();
                console.log(errorHtml)
            }
        
            html = await page.content()                                    
        }                        
        } catch (error) {
            console.error(error)
            return null
        } finally {
            await browser.close();            
            console.log(`Browser closed for ${rdNumber} and ${date}`)
            rimraf.sync(tmpFolder.name)
            console.log(`tmp profile ${tmpFolder.name} deleted for ${rdNumber} and ${date}`)            
            return html
        }

}


/** Configure request timeout and proixes if required*/
//rp = rp.defaults({proxy: 'http://127.0.0.1:1081', timeout: 30000});

/** compose url by yourself */

/** Single Req */
async function singleQuery(rd, date) {
    let year = date.split('-')[0];
    let month = date.split('-')[1];
    let day = date.split('-')[2];
    let rdDate = month + '/' + day + '/' + year    
    let entity = {rd: rd, driverdata: {}};
    console.log('start working on ' + rd + ' - ' + month + '/' + day + '/' + year);
    let body = await getDriverInformationExchangeResponse(rd, rdDate)
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
        let outerThis = $(this);
        $(this).find('dt').each(function (dtIndex, element) {
            entity.driverdata["" + mainKey]["" + $(this).text().trim()] = outerThis.find('dd').eq(dtIndex).text().trim();
        });
    });
    return entity;
}


module.exports = {
    singleQuery: singleQuery
}