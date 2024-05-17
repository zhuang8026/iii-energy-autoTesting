const Nightmare = require('nightmare'); // nightmare 是一个高层次浏览器自动化库
const nightmare = Nightmare({ show: true, width: 1280, height: 1024 }); // 浏览器宽度 高度
const util = require('util');
const fs = require('fs');

//引入 jQuery 機制
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const { window } = new JSDOM();
const $ = require('jquery')(window);

//使工具擁有 promise 的特性
const writeFile = util.promisify(fs.writeFile);

const headers = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
  'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
};

//放置網頁元素(物件)
let arrLink = [];

//關鍵字
let account = 'billdavid50814@gmail.com';
let pwd = 'Enargy17885@';

//正式機 - 日常用電追蹤
async function goMain() {
  console.log('stage2 - 日常用電追蹤');

  //輸入關鍵字，選擇地區，再按下搜尋
  await nightmare
    .goto('https://www.energy-active.org.tw/login', headers) // 进度到当前网址，所以如果想返回，也可以只有.goto()
    .wait('div.login-container') //等待數秒
    .wait(1000) //等待數秒
    .type('input.el-input__inner', account) //輸入帳號
    .wait(1000) //等待數秒
    .type('div.el-input--suffix input.el-input__inner', pwd) //輸入密碼
    .wait(1000) //等待數秒
    .click('button.btn') //按下「登入」
    .wait('div.w-block__body') //等待數秒
    .wait(4000) //等待數秒
    .click('div.label-bell') //按下「用電追蹤」
    .wait(1000) //等待數秒
    // .click('button.chart-btn:nth-child(1)') //按下「用電追蹤」
    // .wait(2000) //等待數秒
    // .click('button.chart-btn:nth-child(2)') //按下「用電追蹤」
    // .wait(2000) //等待數秒
    // .click('div.logout__title') //按下「登出」
    // .wait(1000) //等待數秒
    // .goto('https://dev.energy-active.org.tw/news') // 进度到当前网址，所以如果想返回，也可以只有.goto()
    // .click('div.second-floor-rect input[value="6001001000"]') //選擇台北市
    // .wait(1000)
    // .click('div.second-floor-rect input[value="6001002000"]') //選擇新北市
    // .wait(1000)
    // .click('button.category-picker-btn-primary') // 确定 按键
    // .wait(1000)
    // .click('button.btn.btn-primary.js-formCheck') // 搜索 按键
    .catch((err) => {
      console.log('ERROR');
      // throw err;
    });
}

//選擇全職、兼職等選項
async function setJobType() {
  console.log('選擇全職、兼職等選項');

  await nightmare.wait(2000).click('ul#js-job-tab > li[data-value="1"]'); //點選全職
}

//滾動頁面，將動態資料逐一顯示出來
async function scrollPage() {
  console.log('滾動頁面，將動態資料逐一顯示出來');

  let currentHeight = 0;
  let offset = 0;

  while (offset <= currentHeight) {
    currentHeight = await nightmare.evaluate(() => {
      //evaluate() 抓 return 返回的值放到 currentHeight 中
      return document.documentElement.scrollHeight;
    });
    offset += 500;
    await nightmare.scrollTo(offset, 0).wait(500);

    console.log(`offset = ${offset}, currentHeight = ${currentHeight}`);

    if (offset > 300) {
      break;
    }

    //接近底部時，按下一頁
    // if( (currentHeight - offset) < 2000 && await nightmare.exists('button.b-btn.b-btn--link.js-more-page')){
    //     await _checkPagination();
    // }
  }
}

//按「下一頁」
async function _checkPagination() {
  await nightmare
    .wait('button.b-btn.b-btn--link.js-more-page')
    .click('button.b-btn.b-btn--link.js-more-page');
}

async function elmStatus(stage, page, elm) {
  //存放主要資訊的物件
  let obj = {
    stage: 0, // 1, 2, 3, 4
    pathName: '', // 用戶登入, 每週節電建議, 家庭用電流向, 用電追蹤, 近期用電趨勢, 異常用電事件
    status: '', // N/A, Normal, Failed
  };

  obj.stage = stage;
  obj.pathName = page;

  if (elm.text() != '') {
    obj.status = 'Normal';
  } else {
    obj.status = 'Failed';
  }
  return obj;
}

//分析、整理、收集重要資訊
async function mainParseHtml() {
  console.log('開始收集重要資訊');
  //取得滾動後，得到動態產生結果的 html 元素
  let html = await nightmare.evaluate(() => document.documentElement.innerHTML);

  //將重要資掀放到陣列中，以便後續儲存
  // 用戶登入
  // let mianElm = $(html).find('div.track');
  // let loginStatus = await elmStatus(1, '用戶登入', mianElm);

  // 每週節電建議
  let dialogElm = $(html).find('div.el-dialog[aria-label="節電建議"]');
  let dialogStatus = await elmStatus(2, '每週節電建議', dialogElm);

  // 家庭用電流向
  let householdElm = $(html).find('div.track');
  let householdStatus = await elmStatus(2, '家庭用電流向', householdElm);

  // 用電追蹤
  let trackElm = $(html).find('div.number');
  let trackStatus = await elmStatus(2, '用電追蹤', trackElm);

  // 近期用電趨勢 - Recent electricity usage trends
  let RecentElectricityElm = $(html).find('div.el-dialog__body');
  let RecentElectricityStatus = await elmStatus(2, '近期用電趨勢', RecentElectricityElm);

  // 異常用電趨勢 - Abnormal electricity usage trends
  // let AbnormalElectricityElm = $(html).find('button.chart-btn:nth-child(2)');
  // let AbnormalElectricityStatus = await elmStatus(2, '異常用電趨勢', AbnormalElectricityElm);

  // arrLink.push(loginStatus);
  arrLink.push(dialogStatus);
  arrLink.push(householdStatus);
  arrLink.push(trackStatus);
  arrLink.push(RecentElectricityStatus);
  // arrLink.push(AbnormalElectricityStatus);

  // $(html)
  //   .find('div.w-layout')
  //   .each((index, element) => {
  //     let elm = $(element).find('div.w-block__header__title');
  //     console.log(elm.text());
  //     // let position = elm.find('h2.b-tit a.js-job-link').text(); //職缺名稱
  //     // let positionLink = 'https:' + elm.find('h2.b-tit a.js-job-link').attr('href');
  //     // let location = elm.find('ul.b-list-inline.b-clearfix.job-list-intro.b-content li:eq(0)').text();
  //     // let companyName = elm.find('ul.b-list-inline.b-clearfix li a').text().trim();
  //     // let companyLink = 'https:' + elm.find('ul.b-list-inline.b-clearfix li a').attr('href');
  //     // let category = elm.find('ul.b-list-inline.b-clearfix li:eq(2)').text();

  //     // obj.keyword = strKeyword;
  //     // obj.position = position;
  //     // obj.positionLink = positionLink;
  //     // obj.location = location;
  //     // obj.companyName = companyName;
  //     // obj.companyLink = companyLink;
  //     // obj.category = category;

  //     // arrLink.push(obj);

  //     // obj = {};
  //   });
}

//關閉 nightmare
async function close() {
  await nightmare.end(() => {
    console.log(`關閉 nightmare`);
  });
}

//進行檢索(搜尋職缺名稱)
async function asyncArray(functionList) {
  for (let func of functionList) {
    await func();
  }
}

try {
  asyncArray([
    goMain,
    mainParseHtml,
    // setJobType,
    // scrollPage,
    // mainParseHtml,
    close,
  ]).then(async function () {
    console.dir(arrLink, { depth: null });
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // 使用padStart()来确保月份为两位数
    const day = String(today.getDate()).padStart(2, '0'); // 使用padStart()来确保日期为两位数

    const formattedDate = `${year}-${month}-${day}`;
    await writeFile(
      `downloads/energy/${formattedDate}_step2.json`,
      JSON.stringify(arrLink, null, 4)
    );

    console.log('Done');
  });
} catch (err) {
  console.log('ERROR');
  // throw err;
}
