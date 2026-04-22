const fs = require("fs");
const path = require("path");
const { createCanvas } = require("@napi-rs/canvas");

const sizes = [72, 96, 128, 192, 512];
const outputDir = path.join(__dirname, "../public/icons");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

for (const size of sizes) {
  const canvas = createCanvas(size, size);
  const context = canvas.getContext("2d");

  context.fillStyle = "#1A3A5C";
  context.fillRect(0, 0, size, size);

  context.fillStyle = "#FFFFFF";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = `700 ${Math.round(size * 0.42)}px sans-serif`;
  context.fillText("DD", size / 2, size / 2);

  const pngBuffer = canvas.toBuffer("image/png");
  fs.writeFileSync(path.join(outputDir, `icon-${size}.png`), pngBuffer);
}

console.log("PWA icons generated successfully.");
