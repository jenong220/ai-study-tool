import axios from 'axios';
import * as cheerio from 'cheerio';

export async function scrapeWebContent(url: string): Promise<string> {
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
    timeout: 30000,
  });

  const $ = cheerio.load(response.data);

  // Remove script, style, nav, header, footer elements
  $('script, style, nav, header, footer, aside').remove();

  // Get main content (prioritize article, main, or body)
  const content = $('article').text() || $('main').text() || $('body').text();

  // Limit to 50,000 words
  const words = content.trim().split(/\s+/);
  return words.slice(0, 50000).join(' ');
}

