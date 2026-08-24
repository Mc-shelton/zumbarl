import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const THUMBNAIL_WIDTH = 960;
const THUMBNAIL_HEIGHT = 540;

const waitFor = (target, eventName, errorName = "error") => new Promise((resolve, reject) => {
  const onReady = () => { cleanup(); resolve(); };
  const onError = () => { cleanup(); reject(new Error("The resource preview could not be read.")); };
  const cleanup = () => {
    target.removeEventListener(eventName, onReady);
    target.removeEventListener(errorName, onError);
  };
  target.addEventListener(eventName, onReady, { once: true });
  target.addEventListener(errorName, onError, { once: true });
});

function createCanvas(width = THUMBNAIL_WIDTH, height = THUMBNAIL_HEIGHT) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function canvasHasVisibleContent(canvas) {
  const sample = createCanvas(96, 54);
  const context = sample.getContext("2d", { willReadFrequently: true });
  context.drawImage(canvas, 0, 0, sample.width, sample.height);
  const pixels = context.getImageData(0, 0, sample.width, sample.height).data;
  let minLuminance = 255;
  let maxLuminance = 0;
  let visiblePixels = 0;
  for (let index = 0; index < pixels.length; index += 4) {
    if (pixels[index + 3] < 24) continue;
    visiblePixels += 1;
    const luminance = (pixels[index] * 0.2126) + (pixels[index + 1] * 0.7152) + (pixels[index + 2] * 0.0722);
    minLuminance = Math.min(minLuminance, luminance);
    maxLuminance = Math.max(maxLuminance, luminance);
  }
  if (visiblePixels < sample.width * sample.height * 0.08) return false;
  return maxLuminance - minLuminance > 12 || (minLuminance > 14 && maxLuminance < 241);
}

function drawContained(source, sourceWidth, sourceHeight, background = "#f4f1f6") {
  const canvas = createCanvas();
  const context = canvas.getContext("2d");
  context.fillStyle = background;
  context.fillRect(0, 0, canvas.width, canvas.height);
  const scale = Math.min(canvas.width / sourceWidth, canvas.height / sourceHeight);
  const width = sourceWidth * scale;
  const height = sourceHeight * scale;
  context.drawImage(source, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
  return canvas;
}

const canvasToFile = (canvas, sourceName) => new Promise((resolve, reject) => {
  canvas.toBlob((blob) => {
    if (!blob) { reject(new Error("The generated thumbnail could not be saved.")); return; }
    const baseName = String(sourceName || "resource").replace(/\.[^.]+$/, "").replace(/[^a-z0-9_-]+/gi, "-");
    resolve(new File([blob], `${baseName || "resource"}-thumbnail.jpg`, { type: "image/jpeg", lastModified: Date.now() }));
  }, "image/jpeg", 0.86);
});

async function thumbnailFromImage(file) {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await waitFor(image, "load");
    const raw = createCanvas(image.naturalWidth, image.naturalHeight);
    raw.getContext("2d").drawImage(image, 0, 0);
    if (!canvasHasVisibleContent(raw)) return null;
    return canvasToFile(drawContained(image, image.naturalWidth, image.naturalHeight, "#ffffff"), file.name);
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function seekVideo(video, time) {
  if (Math.abs(video.currentTime - time) < 0.01) return;
  video.currentTime = time;
  await waitFor(video, "seeked");
}

async function thumbnailFromVideo(file) {
  const url = URL.createObjectURL(file);
  try {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.src = url;
    await waitFor(video, "loadedmetadata");
    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    const sampleTimes = [...new Set([0.1, Math.min(1, duration * 0.08), duration * 0.2].map((time) => Math.max(0, Math.min(time, Math.max(0, duration - 0.05)))) )];
    for (const time of sampleTimes) {
      await seekVideo(video, time);
      const raw = createCanvas(video.videoWidth, video.videoHeight);
      raw.getContext("2d").drawImage(video, 0, 0);
      if (canvasHasVisibleContent(raw)) return canvasToFile(drawContained(video, video.videoWidth, video.videoHeight, "#171924"), file.name);
    }
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function thumbnailFromPdf(file) {
  const task = getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  try {
    const pdf = await task.promise;
    const page = await pdf.getPage(1);
    const baseViewport = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: Math.min(2, 1100 / Math.max(baseViewport.width, baseViewport.height)) });
    const pageCanvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
    await page.render({ canvasContext: pageCanvas.getContext("2d"), viewport }).promise;
    if (!canvasHasVisibleContent(pageCanvas)) return null;
    return canvasToFile(drawContained(pageCanvas, pageCanvas.width, pageCanvas.height, "#e9e5ec"), file.name);
  } finally {
    await task.destroy();
  }
}

async function generateResourceThumbnail(file) {
  if (!file) return null;
  try {
    if (file.type.startsWith("image/")) return await thumbnailFromImage(file);
    if (file.type.startsWith("video/")) return await thumbnailFromVideo(file);
    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) return await thumbnailFromPdf(file);
  } catch {
    return null;
  }
  return null;
}

export { generateResourceThumbnail };
