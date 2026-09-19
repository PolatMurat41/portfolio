import puppeteer from "puppeteer-core";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-gpu"],
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
  });

  const page = await browser.newPage();

  // 1. Home page Hero & About
  console.log("Capturing homepage hero...");
  await page.goto("http://localhost:3050", { waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({ path: "public/preview-home.png" });

  // 2. Projects section (showing screenshots!)
  console.log("Capturing projects section...");
  await page.evaluate(() => {
    const el = document.getElementById("projects");
    if (el) el.scrollIntoView();
  });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: "public/preview-projects.png" });

  // 3. Articles section
  console.log("Capturing articles section...");
  await page.evaluate(() => {
    const el = document.getElementById("articles");
    if (el) el.scrollIntoView();
  });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: "public/preview-articles.png" });

  // 4. Blog page
  console.log("Capturing blog list page...");
  await page.goto("http://localhost:3050/blog", { waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: "public/preview-blog.png" });

  // 5. Article detail page
  console.log("Capturing article detail page...");
  await page.goto("http://localhost:3050/blog/nowcasting-inflation-using-online-prices", { waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: "public/preview-article-detail.png" });

  // 6. Admin login
  console.log("Capturing admin login...");
  await page.goto("http://localhost:3050/admin/login", { waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: "public/preview-admin-login.png" });

  await browser.close();
  console.log("All previews successfully captured!");
}

main().catch(console.error);
