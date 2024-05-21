const puppeteer = require('puppeteer');
const util = require('util');
const fs = require('fs');

// 引入 jQuery 机制
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const { window } = new JSDOM();
const $ = require('jquery')(window);

// 使工具拥有 promise 的特性
const writeFile = util.promisify(fs.writeFile);

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
  'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7'
};

// 放置网页元素（对象）
let arrLink = [];

// 关键字
let account = 'u0955318835@gmail.com';
let pwd = 'Enargy17885@';

async function test_login(page) {
  console.log('stage1 - 正式机 - 登入测试');
  await page.setExtraHTTPHeaders(headers);
  await page.goto('https://www.energy-active.org.tw', { waitUntil: 'networkidle2', timeout: 60000 });

  await page.waitForSelector('div.login-page', { timeout: 20000 });
}

async function login(page) {
  console.log('stage1 - 忘记密码');
  console.log('开始登入（用户: billdavid50814）');

  await page.goto('https://www.energy-active.org.tw/login', { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForSelector('div.login-page', { timeout: 20000 });
  await page.click('div.forget');
  await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 2000))); // 等待数秒
}

async function goMain(page) {
  console.log('stage1 - 登入');

  await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 1000))); // 等待数秒
  await page.type('input.el-input__inner', account);
  await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 1000))); // 等待数秒
  await page.type('div.el-input--suffix input.el-input__inner', pwd);
  await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 1000))); // 等待数秒
  await page.click('button.el-dialog__headerbtn');
  await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 1000))); // 等待数秒
  await page.click('button.el-button');
  await page.waitForSelector('div.w-block__body', { timeout: 20000 });
  await page.waitForSelector('div.electricity-device-container', { timeout: 20000 });
  await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 4000))); // 等待数秒
}

async function _checkPagination(page) {
  await page.waitForSelector('button.b-btn.b-btn--link.js-more-page');
  await page.click('button.b-btn.b-btn--link.js-more-page');
}

async function elmStatus(stage, page, elm) {
  // 存放主要资讯的对象
  let obj = {
    stage: 0, // 1, 2, 3, 4
    pathName: '', // 用户登入, 每周节电建议, 家庭用电流向, 用电追踪, 近期用电趋势, 异常用电事件
    status: '', // N/A, Normal, Failed
  };

  obj.stage = stage;
  obj.pathName = page;

  if (elm.text() !== '') {
    obj.status = 'Normal';
  } else {
    obj.status = 'Failed';
  }
  return obj;
}

async function loginParseHtml(page) {
  console.log('开始收集重要资讯');
  let html = await page.content();

  let forgetPassword = $(html).find('div.el-dialog__body');
  let forgetPasswordStatus = await elmStatus(1, '忘记密码', forgetPassword);

  arrLink.push(forgetPasswordStatus);
}

async function mainParseHtml(page) {
  console.log('开始收集重要资讯');
  let html = await page.content();

  let mainElm = $(html).find('div.track');
  let loginStatus = await elmStatus(1, '用户登入', mainElm);

  arrLink.push(loginStatus);
}

async function main() {
  const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  await page.setViewport({ width: 1280, height: 1024 });

  try {
    await test_login(page);
    await login(page);
    await loginParseHtml(page);
    await goMain(page);
    await mainParseHtml(page);
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await browser.close();
  }

  console.dir(arrLink, { depth: null });

  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const formattedDate = `${year}-${month}-${day}`;

  await writeFile(`downloads/energy/${formattedDate}_step1.json`, JSON.stringify(arrLink, null, 4));
  console.log('Done');
}

main().catch(err => console.error('ERROR:', err));
