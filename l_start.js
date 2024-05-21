const fs = require('fs');

// 定义要执行的文件数组
const files = ['step1.js' , 'step2.js', 'step3.js', 'step4.js', 'step5.js']; // 'step1.js' , 'step2.js', 'step3.js', 'step4.js', 'step5.js'

// 定义同步函数来按顺序执行文件
function executeFilesSync(index) {
    console.log("[新北市]自動化測試 version2.0.3")
    // 边界情况：当索引超出文件数组范围时，停止执行
    if (index >= files.length) {
        console.log('所有檔案執行完畢！');
        return;
    }

    // 读取当前要执行的文件
    const currentFile = files[index];

    try {
        // 同步读取文件内容
        const fileContent = fs.readFileSync(`./lowcarbon/${currentFile}`, 'utf8');
        // 执行文件内容
        eval(fileContent);
        console.log(`已執行文件 ${currentFile}`);

        // 间隔1分钟后执行下一个文件
        setTimeout(() => {
            executeFilesSync(index + 1);
        }, 60000); // 60000毫秒 = 1分钟
    } catch (error) {
        console.error(`執行文件 ${currentFile} 出錯：`, error);
    }
}

// 开始执行文件
executeFilesSync(0);
