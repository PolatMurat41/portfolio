import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const outputDir = path.resolve(process.cwd(), "public", "projects");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--ignore-certificate-errors",
    ],
    defaultViewport: {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
    },
  });

  const projects = await prisma.project.findMany({ orderBy: { sortOrder: "asc" } });

  for (const project of projects) {
    const slug = project.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const filename = `${slug}.png`;
    const filepath = path.join(outputDir, filename);
    const publicUrl = `/projects/${filename}`;

    console.log(`Processing ${project.title} (${project.href})...`);
    try {
      const page = await browser.newPage();
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      );
      await page.goto(project.href, { waitUntil: "networkidle2", timeout: 30000 });
      // Give a little time for animations / rendering
      await new Promise((res) => setTimeout(res, 3000));

      await page.screenshot({ path: filepath, type: "png" });
      await page.close();

      console.log(`  Saved screenshot to ${filepath}`);

      // Update in database
      await prisma.project.update({
        where: { id: project.id },
        data: { image: publicUrl },
      });
      console.log(`  Updated project DB image: ${publicUrl}`);
    } catch (err) {
      console.error(`  Failed to capture ${project.href}:`, err.message);
    }
  }

  await browser.close();
  console.log("Done taking screenshots!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
