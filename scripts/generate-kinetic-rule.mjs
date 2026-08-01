import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const width = 720;
const height = 10;
const lineY = 4;
const movingFrames = 12;
const restingFrames = 7;
const delayCentiseconds = 26;

const littleEndian = (value) => [value & 0xff, (value >> 8) & 0xff];

function packCodes(codes, codeSize) {
  const bytes = [];
  let buffer = 0;
  let bitCount = 0;

  for (const code of codes) {
    buffer |= code << bitCount;
    bitCount += codeSize;

    while (bitCount >= 8) {
      bytes.push(buffer & 0xff);
      buffer >>= 8;
      bitCount -= 8;
    }
  }

  if (bitCount > 0) {
    bytes.push(buffer & 0xff);
  }

  return bytes;
}

function encodeImage(pixels) {
  const clear = 4;
  const end = 5;
  const codes = [];

  // Resetting before each pixel keeps this small palette encoder deterministic.
  for (const pixel of pixels) {
    codes.push(clear, pixel);
  }
  codes.push(end);

  const encoded = packCodes(codes, 3);
  const blocks = [2];

  for (let offset = 0; offset < encoded.length; offset += 255) {
    const block = encoded.slice(offset, offset + 255);
    blocks.push(block.length, ...block);
  }

  blocks.push(0);
  return blocks;
}

function framePixels(frame) {
  const pixels = new Uint8Array(width * height);
  const progress = frame < movingFrames ? frame / (movingFrames - 1) : 1;
  const head = Math.round(progress * (width - 1));
  const tailStart = Math.max(0, head - 44);
  const brightStart = Math.max(0, head - 8);

  for (let x = 0; x < width; x += 1) {
    let color = 1;
    if (x >= tailStart && x < brightStart) color = 3;
    if (x >= brightStart && x <= head) color = 2;
    pixels[lineY * width + x] = color;
  }

  return pixels;
}

function gif(palette) {
  const bytes = [
    ...Buffer.from("GIF89a"),
    ...littleEndian(width),
    ...littleEndian(height),
    0xf1,
    0,
    0,
    ...palette.flat(),
    0x21,
    0xff,
    0x0b,
    ...Buffer.from("NETSCAPE2.0"),
    0x03,
    0x01,
    0x00,
    0x00,
    0x00,
  ];

  const totalFrames = movingFrames + restingFrames;

  for (let frame = 0; frame < totalFrames; frame += 1) {
    bytes.push(
      0x21,
      0xf9,
      0x04,
      0x09,
      ...littleEndian(delayCentiseconds),
      0x00,
      0x00,
      0x2c,
      0x00,
      0x00,
      0x00,
      0x00,
      ...littleEndian(width),
      ...littleEndian(height),
      0x00,
      ...encodeImage(framePixels(frame)),
    );
  }

  bytes.push(0x3b);
  return Buffer.from(bytes);
}

const palettes = {
  light: [
    [255, 255, 255],
    [212, 212, 216],
    [130, 80, 223],
    [196, 181, 253],
  ],
  dark: [
    [0, 0, 0],
    [63, 63, 70],
    [210, 168, 255],
    [139, 92, 246],
  ],
};

await mkdir(resolve("assets"), { recursive: true });
await Promise.all([
  writeFile(resolve("assets/kinetic-rule-light.gif"), gif(palettes.light)),
  writeFile(resolve("assets/kinetic-rule-dark.gif"), gif(palettes.dark)),
]);
