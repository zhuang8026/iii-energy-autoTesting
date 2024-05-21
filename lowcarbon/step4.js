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
let account = 'u0955318835@gmail.com';
let pwd = 'Enargy17885@';

//正式機 - 登入測試
async function test_login() {
  console.log('stage1 - 正式機 - 登入測試');

  await nightmare
    .goto('https://www.lowcarbon-hems.org.tw', headers) // 进度到当前网址，所以如果想返回，也可以只有.goto()
    .wait('div.login-page') //等待數秒
    .wait(() => {
      return document.querySelector('div.login-page') !== null;
    }) //确保div.login-page已经出现
    .wait(2000) //等待數秒
    .catch((err) => {
      console.log('ERROR:', err);
      // throw err;
    });
}

//正式機 - 管理用電
async function drivce() {
  console.log('stage4 - 管理用電');

  //輸入關鍵字，選擇地區，再按下搜尋
  await nightmare
    .goto('https://www.lowcarbon-hems.org.tw/login', headers) // 进度到当前网址，所以如果想返回，也可以只有.goto()
    .wait('div.login-container') //等待頁面加載完成
    .wait(1000) //等待數秒
    .type('input.el-input__inner', account) //輸入帳號
    .wait(1000) //等待數秒
    .type('div.el-input--suffix input.el-input__inner', pwd) //輸入密碼
    .wait(1000) //等待數秒
    .click('button.btn') //按下「登入」
    .wait('div.content-box') //等待數秒
    .wait(4000) //等待數秒
    // .click('li.el-menu-item:nth-child(3)') //按下「家庭能源報告」
    .goto('https://www.lowcarbon-hems.org.tw/remote', headers) // 进度到当前网址，所以如果想返回，也可以只有.goto()
    .wait('div.box1') // 檢查畫面是否有資料
    .wait(2000) // 等待數秒 
    .click('button.el-button') //按下「排程管理」
    .wait(2000) //等待數秒
    .click('button.btn-add') //按下「排程管理」
    .wait(2000) //等待數秒
    .catch((err) => {
      console.log('ERROR');
      // throw err;
    });
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
async function drivceParseHtml() {
  console.log('開始收集重要資訊');
  //取得滾動後，得到動態產生結果的 html 元素
  let html = await nightmare.evaluate(() => document.documentElement.innerHTML);

  //將重要資掀放到陣列中，以便後續儲存
  // 智慧插座
  let drivce = $(html).find('div.box1 .info');
  let drivceStatus = await elmStatus(4, '智慧插座', drivce);

  // 管理建議
  // let adviceDialog = $(html).find('ul.advice-dialog');
  // let adviceDialogStatus = await elmStatus(4, '管理建議', adviceDialog);

  // 新增排程
  let adds = $(html).find('div.container');
  let addsStatus = await elmStatus(4, '新增排程', adds);

  arrLink.push(drivceStatus);
  // arrLink.push(adviceDialogStatus);
  arrLink.push(addsStatus);
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
    test_login,
    drivce, // 用戶行為設定 
    drivceParseHtml, // 畫面掃描 & 檢查資料判斷
    close // 關閉
  ]).then(async function () {
    console.dir(arrLink, { depth: null });
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // 使用padStart()来确保月份为两位数
    const day = String(today.getDate()).padStart(2, '0'); // 使用padStart()来确保日期为两位数

    const formattedDate = `${year}-${month}-${day}`;
    await writeFile(
      `downloads/lowcarbon/${formattedDate}_step4.json`,
      JSON.stringify(arrLink, null, 4)
    );

    console.log('Done');
  });
} catch (err) {
  console.log('ERROR');
  // throw err;
}
