let facemesh;
let video;
let predictions = [];
let stars = [];

// FaceMesh 點位編號定義
const lipOuter = [409, 270, 269, 267, 0, 37, 39, 40, 185, 61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291];
const lipInner = [76, 77, 90, 180, 85, 16, 315, 404, 320, 307, 306, 408, 304, 303, 302, 11, 72, 73, 74, 184];
const rightEyeOuter = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246];
const rightEyeInner = [130, 25, 110, 24, 23, 22, 26, 112, 243, 190, 56, 28, 27, 29, 30, 247];
const leftEyeOuter = [263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385, 386, 387, 388, 466];
const leftEyeInner = [359, 255, 339, 254, 253, 252, 256, 341, 463, 414, 286, 258, 257, 259, 260, 467];
const silhouette = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // 初始化攝影機
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  // 初始化 FaceMesh
  facemesh = ml5.facemesh(video, () => console.log("Model Ready!"));
  facemesh.on("predict", results => {
    predictions = results;
  });

  // 初始化星星
  for (let i = 0; i < 200; i++) {
    stars.push({
      x: random(width),
      y: random(height),
      size: random(1, 3),
      brightness: random(100, 255)
    });
  }
}

function draw() {
  background('#e7c6ff');

  // 計算顯示影像的寬高 (全螢幕的 50%)
  let displayW = width * 0.5;
  let displayH = height * 0.5;
  let xOffset = (width - displayW) / 2;
  let yOffset = (height - displayH) / 2;

  // 1. 繪製外太空黑色背景區域
  fill(0);
  noStroke();
  rect(xOffset, yOffset, displayW, displayH);

  // 繪製隨機星星
  drawStars(xOffset, yOffset, displayW, displayH);

  if (predictions.length > 0) {
    let points = predictions[0].scaledMesh;

    // 2. 只有臉部區域顯示影像 (使用 Masking 概念)
    push();
    drawingContext.save();
    
    // 定義裁切區域 (臉部輪廓)
    beginShape();
    for (let i of silhouette) {
      let p = points[i];
      let sx = map(p[0], 0, video.width, xOffset + displayW, xOffset); // 鏡像處理
      let sy = map(p[1], 0, video.height, yOffset, yOffset + displayH);
      vertex(sx, sy);
    }
    endShape(CLOSE);
    drawingContext.clip();

    // 繪製鏡像影像
    translate(xOffset + displayW, yOffset);
    scale(-1, 1);
    image(video, 0, 0, displayW, displayH);
    drawingContext.restore();
    pop();

    // 3. 繪製紅色的霓虹燈線條
    drawNeonLines(points, xOffset, yOffset, displayW, displayH);
  }
}

function drawStars(ox, oy, w, h) {
  push();
  for (let s of stars) {
    let sx = (s.x % w) + ox;
    let sy = (s.y % h) + oy;
    fill(255, s.brightness);
    noStroke();
    circle(sx, sy, s.size);
  }
  pop();
}

function drawNeonLines(points, ox, oy, dw, dh) {
  push();
  noFill();
  stroke(255, 0, 0);
  strokeWeight(1);
  
  // 設定霓虹燈光暈效果
  drawingContext.shadowBlur = 12;
  drawingContext.shadowColor = color(255, 0, 0);

  // 繪製各個特徵區域
  drawLoop(lipOuter, points, ox, oy, dw, dh);
  drawLoop(lipInner, points, ox, oy, dw, dh);
  drawLoop(rightEyeOuter, points, ox, oy, dw, dh);
  drawLoop(rightEyeInner, points, ox, oy, dw, dh);
  drawLoop(leftEyeOuter, points, ox, oy, dw, dh);
  drawLoop(leftEyeInner, points, ox, oy, dw, dh);
  drawLoop(silhouette, points, ox, oy, dw, dh);
  
  pop();
}

function drawLoop(indices, points, ox, oy, dw, dh) {
  beginShape();
  for (let i of indices) {
    let p = points[i];
    // 座標轉換：輸入影像點位 -> 畫布上的 50% 置中區域 (鏡像)
    let sx = map(p[0], 0, video.width, ox + dw, ox);
    let sy = map(p[1], 0, video.height, oy, oy + dh);
    vertex(sx, sy);
  }
  endShape(CLOSE);
}

// 處理手機旋轉與視窗調整
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  
  // 重新分布星星
  stars = [];
  for (let i = 0; i < 200; i++) {
    stars.push({
      x: random(width),
      y: random(height),
      size: random(1, 3),
      brightness: random(100, 255)
    });
  }
}
