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

//正式機 - 登入
async function login() {
  console.log('stage1 - 忘記密碼');
  console.log('開始登入(用戶:billdavid50814)');

  // 忘記密碼
  await nightmare
    .goto('https://www.energy-active.org.tw/login', headers) // 进度到当前网址，所以如果想返回，也可以只有.goto()
    .wait('div.login-container') //等待數秒
    .wait(10000) //等待數秒
    .click('div.forget') //按下「登入」
    .wait(10000) //等待數秒
    .catch((err) => {
      console.log('ERROR');
      // throw err;
    });
}

async function goMain() {
  console.log('stage1 - 登入');

  //輸入關鍵字，選擇地區，再按下搜尋
  await nightmare
    // .goto('https://dev.energy-active.org.tw/login', headers) // 进度到当前网址，所以如果想返回，也可以只有.goto()
    .wait(1000) //等待數秒
    .type('input.el-input__inner', account) //輸入帳號
    .wait(1000) //等待數秒
    .type('div.el-input--suffix input.el-input__inner', pwd) //輸入密碼
    .wait(1000) //等待數秒
    .click('button.btn') //按下「登入」
    .wait('div.w-block__body') //等待數秒
    .wait('div.electricity-device-container') //等待數秒
    .wait(4000) //等待數秒
    .catch((err) => {
      console.log('ERROR');
      // throw err;
    });
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
async function loginParseHtml() {
  console.log('開始收集重要資訊');
  //取得滾動後，得到動態產生結果的 html 元素
  let html = await nightmare.evaluate(() => document.documentElement.innerHTML);

  //將重要資掀放到陣列中，以便後續儲存
  // 用戶登入
  let forgetPassword = $(html).find('div.el-dialog__body');
  let forgetPasswordStatus = await elmStatus(1, '忘記密碼', forgetPassword);

  arrLink.push(forgetPasswordStatus);
}

async function mainParseHtml() {
  console.log('開始收集重要資訊');
  //取得滾動後，得到動態產生結果的 html 元素
  let html = await nightmare.evaluate(() => document.documentElement.innerHTML);

  //將重要資掀放到陣列中，以便後續儲存
  // 用戶登入
  let mianElm = $(html).find('div.track');
  let loginStatus = await elmStatus(1, '用戶登入', mianElm);

  arrLink.push(loginStatus);
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
    login,
    loginParseHtml, //
    goMain,
    mainParseHtml,
    close,
  ]).then(async function () {
    console.dir(arrLink, { depth: null });
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // 使用padStart()来确保月份为两位数
    const day = String(today.getDate()).padStart(2, '0'); // 使用padStart()来确保日期为两位数

    const formattedDate = `${year}-${month}-${day}`;
    await writeFile(
      `downloads/energy/${formattedDate}_step1.json`,
      JSON.stringify(arrLink, null, 4)
    );

    console.log('Done');
  });
} catch (err) {
  console.log('ERROR');
  // throw err;
}
