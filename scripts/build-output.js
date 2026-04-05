const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const outputDir = path.join(projectRoot, "01_OUTPUT");
const dataDir = path.join(projectRoot, "data");
const outputJsonPath = path.join(dataDir, "output.json");

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function getCardData(folderName) {
  const folderPath = path.join(outputDir, folderName);
  const stat = fs.statSync(folderPath);

  if (!stat.isDirectory()) {
    return null;
  }

  const metaPath = path.join(folderPath, "meta.json");
  const textPath = path.join(folderPath, "text.md");
  const imagePath = path.join(folderPath, "image.jpg");

  if (!fileExists(metaPath)) {
    console.warn(`[skip] meta.json not found: ${folderName}`);
    return null;
  }

  let meta;
  try {
    meta = readJson(metaPath);
  } catch (error) {
    console.warn(`[skip] invalid meta.json: ${folderName}`);
    return null;
  }

  if (!meta.title || !meta.date || !meta.status) {
    console.warn(`[skip] missing required fields: ${folderName}`);
    return null;
  }

  if (meta.status !== "published") {
    return null;
  }

  let excerpt = "";

  if (fileExists(textPath)) {
    const rawText = fs.readFileSync(textPath, "utf-8");
    excerpt = rawText
      .replace(/^#+\s/gm, "")
      .replace(/[*_`>-]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 40);
  }

  return {
    slug: folderName,
    title: meta.title,
    date: meta.date,
    status: meta.status,
    tags: Array.isArray(meta.tags) ? meta.tags : [],
    excerpt,
    hasText: fileExists(textPath),
    hasImage: fileExists(imagePath),
    textPath: fileExists(textPath) ? `01_OUTPUT/${folderName}/text.md` : null,
    imagePath: fileExists(imagePath) ? `01_OUTPUT/${folderName}/image.jpg` : null
  };
}

function build() {
  if (!fileExists(outputDir)) {
    throw new Error(`01_OUTPUT folder not found: ${outputDir}`);
  }

  if (!fileExists(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const folderNames = fs.readdirSync(outputDir);

  const cards = folderNames
    .map(getCardData)
    .filter(Boolean)
    .sort((a, b) => b.date.localeCompare(a.date));

  fs.writeFileSync(outputJsonPath, JSON.stringify(cards, null, 2), "utf-8");

  console.log(`[done] output.json created: ${outputJsonPath}`);
  console.log(`[done] published cards: ${cards.length}`);
}

build();