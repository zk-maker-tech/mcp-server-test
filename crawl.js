import FirecrawlApp from '@mendable/firecrawl-js';
import { writeFileSync } from 'fs';

// 替换为你自己的 API Key
const apiKey = "fc-06facd8daad942e1bde401e102a2b276";
const app = new FirecrawlApp({ apiKey });

/**
 * 移除代码块后仅包含数字的行（行号）
 * @param {string} markdownContent Markdown 文本
 * @returns {string} 处理后的 Markdown 文本
 */
function removeTrailingLineNumbers(content) {
  const lines = content.trim().split('\n');
  let cleanedLines = [];
  let inCodeBlock = false;

  // 用于存储代码块内容的临时数组
  let codeBlockLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // 检查是否进入或退出代码块
    if (trimmedLine === '```' || trimmedLine.startsWith('```')) {
      if (!inCodeBlock) {
        // 开始代码块
        inCodeBlock = true;
        codeBlockLines.push(line); // 保留 ``` 开头行
      } else {
        // 结束代码块
        inCodeBlock = false;
        codeBlockLines.push(line); // 保留 ``` 结束行
        cleanedLines.push(...codeBlockLines); // 将整个代码块加入结果
        codeBlockLines = [];
      }
      continue;
    }

    if (inCodeBlock) {
      // 在代码块内，保留原始行（包括空白行、空格、Tab）
      codeBlockLines.push(line);
    } else {
      // 在代码块外，移除独立数字行和多余空行
      if (trimmedLine && !/^\d+$/.test(trimmedLine)) {
        cleanedLines.push(line);
      }
    }
  }

  // 处理连续空行，仅保留一个空行（代码块外）
  const result = [];
  let lastLineWasEmpty = false;
  for (const line of cleanedLines) {
    const isEmpty = line.trim() === '';
    if (isEmpty && lastLineWasEmpty && !inCodeBlock) {
      continue; // 跳过代码块外的连续空行
    }
    result.push(line);
    lastLineWasEmpty = isEmpty;
  }

  return result.join('\n');
}

/**
 * 爬取指定网站，并将爬取结果以 Markdown 格式保存到本地文件
 * 对代码块内容进行处理，移除代码块后多余的行号。
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
      
      // 移除代码块后多余的行号
      const cleanedMarkdown = removeTrailingLineNumbers(combinedMarkdown);

      // 根据 URL 生成文件名（将 http:// 或 https:// 去除，并用下划线替换斜杠）
      const filename = url.replace(/https?:\/\//, '').replace(/\//g, '_') + '.md';
      writeFileSync(filename, cleanedMarkdown, 'utf8');
      console.log(`成功保存文件: ${filename}`);
    } else {
      console.error('爬取失败:', crawlResult.error);
    }
  } catch (error) {
    console.error('发生错误:', error);
  }
}

// 示例：爬取目标网址
const targetUrl = 'https://www.fangzhenxiu.com/course/9634717/10553490';
crawlWebsite(targetUrl);
