import FirecrawlApp from '@mendable/firecrawl-js';
import { writeFileSync } from 'fs';

// 替换为你自己的 API Key
const apiKey = "fc-06facd8daad942e1bde401e102a2b276";
const app = new FirecrawlApp({ apiKey });

/**
 * 移除代码块中仅包含数字的行（行号）
 * @param {string} codeStr 代码块文本
 * @returns {string} 处理后的代码文本
 */
function removeLineNumbers(codeStr) {
    return codeStr
      .split('\n')
      .filter(line => !/^\s*\d+\s*$/.test(line))
      .join('\n');
}

/**
 * 爬取指定网站，并将爬取结果以 Markdown 格式保存到本地文件
 * @param {string} url 要爬取的网址
 */
async function crawlWebsite(url) {
  console.log(`开始爬取: ${url}`);
  try {
    // 使用 crawlUrl 方法启动爬取任务
    const crawlResult = await app.crawlUrl(url, {
      limit: 10, // 限制最多爬取 10 个页面
      excludePaths: ['/login', '/admin'], // 排除特定路径
      // scrapeOptions 用于设置每个页面的抓取参数
      scrapeOptions: {
        formats: ['markdown']  // 只获取 Markdown 格式内容
      }
    });

    // 判断爬取是否成功，并合并所有页面的 Markdown 内容
    if (crawlResult.success && crawlResult.data) {
      let combinedMarkdown = '';
      for (const page of crawlResult.data) {
        // 假设每个页面对象包含 markdown 字段
        combinedMarkdown += page.markdown + '\n\n';
      }
      // 根据 URL 生成文件名
      const filename = url.replace(/https?:\/\//, '').replace(/\//g, '_') + '.md';
      writeFileSync(filename, combinedMarkdown, 'utf8');
      console.log(`成功保存文件: ${filename}`);
    } else {
      console.error('爬取失败:', crawlResult.error);
    }
  } catch (error) {
    console.error('发生错误:', error);
  }
}

// 示例：爬取目标网址
const targetUrl = 'https://zha-ge.cn/web/first_page_time.html';
crawlWebsite(targetUrl);
