const puppeteer = require("puppeteer-extra");
const stealthPlugin = require("puppeteer-extra-plugin-stealth")();
const fs = require('fs');
const https = require('https');

["chrome.runtime", "navigator.languages"].forEach(element =>
    stealthPlugin.enabledEvasions.delete(element)
  );
  
puppeteer.use(stealthPlugin);

main();
async function main(){

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.evaluateOnNewDocument(() => {
    delete navigator.__proto__.webdriver;
  });

  await page.setRequestInterception(true);
  page.on('request', (request) => {
    if (['image', 'stylesheet', 'font'].includes(request.resourceType())) {
      request.abort();
    }else {
      request.continue();
    }
  })

  let inputLink = process.argv[2];


  await page.goto(inputLink);
  const username = inputLink.slice(23).replace(/([?=&])\w+/g, "");
    
  await scrollPage(page);
    
  const urls = await page.evaluate(() =>
    Array.from(document.querySelectorAll('div.tiktok-1qb12g8-DivThreeColumnContainer > div > div > div > a'), element => element.href)
  );
    
  const urlsIndex = urls.length;
  const folderPath = "./" + username;

  const checkFolderExists = async () =>{
    if ( !(fs.existsSync(folderPath)) ) {
      fs.mkdirSync(folderPath);
    }
  }
  await checkFolderExists();
    
        
  for(let i = urls.length - 1 ; i >= 0; i--) {
    const linkId = urls[i].slice(-19);
    const filePath = "./" + username + "/" + linkId + ".mp4";
    const checkFileExists = async () =>{
      if (fs.existsSync(filePath)) {
        urls.splice(i, 1);
      }

    }
  await checkFileExists();
  }

  await page.waitForTimeout(200);

  let urlsIndexAfterSplice = urlsIndex - urls.length;
  console.log('\x1b[33m ' + urlsIndex + '\x1b[37m videos in [' + username + '] Tiktok profile / \x1b[32m' + urlsIndexAfterSplice + '\x1b[37m files already downloaded in folder.')
  if(urls.length > 0){
    console.log('Downloading ' + '\x1b[31m' + urls.length + '\x1b[37m file/s...\n')
  }else{
    console.log("All files downloaded")
  }


  for(let i = 0; i< urls.length; i++){

    const linkId = urls[i].slice(-19);
    var VideoFile;

    await page.goto('https://snaptik.app/');
    await page.waitForSelector('input[name="url"]');
    await page.type('input[name="url"]', (urls[i]), { delay: 50 }); 
    await page.click('.button-go');

    await page.waitForXPath('//*[@id="download"]/div[1]');
    const children = await page.evaluate(() => {
      return (Array.from(document.querySelector('div[id="download"]').children).length);
    })
    console.log("COUNT : " , children)

    if(parseInt(children) > 2){

      const renderButton = (await page.$x('/html/body/section/div/div[2]/div[1]/div[2]/button'))[0];
      await renderButton.evaluate( renderButton => renderButton.click())

      await page.waitForXPath('//a[contains(concat(" ", normalize-space(@class), " "), " show ")]');
      VideoFile = (await page.$x('/html/body/section/div/div[2]/div[2]/a'))[0];

    }
    else{
      await page.waitForXPath('//*[@id="download"]/div/div[2]/a[1]');
      VideoFile = (await page.$x('//*[@id="download"]/div/div[2]/a[1]'))[0];
    }

    const VideoLink = await page.evaluate(element => {return element.href;}, VideoFile);
    const downloadURL = decodeURIComponent(VideoLink);
  
    const request = https.get(downloadURL, function (response) {
      if (response.statusCode === 200) {
        var writableStreamFile  = fs.createWriteStream(folderPath + "/" + linkId + '.mp4');
        response.pipe(writableStreamFile );
        console.log(linkId + ' downloaded!')
      }
    });

  }
  browser.close();
}

async function scrollPage(page) {

    await page.evaluate(async () => { await new Promise((resolve) => {
        let totalHeight = 0;
        let timer = setInterval(() => {
          window.scrollBy(0, 100);
          totalHeight += 100;
  
          if (totalHeight >= document.body.scrollHeight){
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });
}
