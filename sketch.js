let video;
let faceMesh;
let handPose;
let faces = [];
let hands = [];
let options = { maxFaces: 1, refineLandmarks: false, flipHorizontal: false };

let styleIndex = 0; // 0: 黃金圓圈, 1: 珍珠, 2: 流蘇
let prevHandX = 0;
let switchCooldown = 0; // 防止切換過快

function preload() {
  faceMesh = ml5.faceMesh(options);
  handPose = ml5.handPose(options);
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();
  
  // 同時開始偵測臉部與手部
  faceMesh.detectStart(video, gotFaces);
  handPose.detectStart(video, gotHands);
}

function gotFaces(results) {
  faces = results;
}

function gotHands(results) {
  hands = results;
}

function draw() {
  background('#e7c6ff');

  let displayW = width * 0.5;
  let displayH = height * 0.5;

  push();
  translate(width / 2, height / 2);
  scale(-1, 1); // 左右翻轉
  
  // 繪製中間的影像
  image(video, -displayW / 2, -displayH / 2, displayW, displayH);

  // 偵測揮手切換樣式
  if (hands.length > 0) {
    let hand = hands[0];
    let currentHandX = hand.keypoints[8].x; // 取得食指尖 X 座標
    let speed = abs(currentHandX - prevHandX); // 計算水平位移量

    if (speed > 40 && switchCooldown <= 0) { // 如果移動速度夠快且冷卻結束
      styleIndex = (styleIndex + 1) % 3; // 切換 0, 1, 2 樣式
      switchCooldown = 30; // 設置 30 幀的冷卻時間，防止連續切換
    }
    prevHandX = currentHandX;
  }
  if (switchCooldown > 0) switchCooldown--;

  if (faces.length > 0) {
    let face = faces[0];
    let leftEarlobe = face.keypoints[132];
    let rightEarlobe = face.keypoints[361];

    if (leftEarlobe && rightEarlobe) {
      // 1. 計算兩耳之間的距離，作為「臉部遠近」的依據
      let d = dist(leftEarlobe.x, leftEarlobe.y, rightEarlobe.x, rightEarlobe.y);
      
      // 2. 根據距離動態決定圓圈大小與間距 (比例可視需求調整)
      let circleSize = d * 0.05; 
      let spacing = d * 0.06;

      drawEarring(leftEarlobe, displayW, displayH, circleSize, spacing);
      drawEarring(rightEarlobe, displayW, displayH, circleSize, spacing);
    }
  }
  pop();

  // 顯示當前樣式提示 (放在 pop 之後，文字才不會被鏡像)
  drawUI();
}

function drawUI() {
  fill(255, 200);
  noStroke();
  rect(20, 20, 220, 75, 8);
  fill(50);
  textAlign(LEFT, TOP);
  textSize(18);
  let styleNames = ["經典金圓", "優雅珍珠", "時尚流蘇"];
  text("✨ 樣式: " + styleNames[styleIndex], 35, 32);
  text("🆔 414730191 何鈺淇", 35, 58);
}

function drawEarring(pt, dw, dh, size, spacing) {
  let x = map(pt.x, 0, video.width, -dw / 2, dw / 2);
  let y = map(pt.y, 0, video.height, -dh / 2, dh / 2);

  if (styleIndex === 0) {
    // 樣式 0: 三個黃金圓圈
    fill(255, 215, 0);
    noStroke();
    for (let i = 1; i <= 3; i++) {
      circle(x, y + i * spacing, size);
    }
  } else if (styleIndex === 1) {
    // 樣式 1: 珍珠
    fill(245, 245, 235);
    stroke(200);
    strokeWeight(1);
    circle(x, y + spacing * 1.5, size * 2.5);
    // 珍珠反光效果
    fill(255, 180);
    noStroke();
    circle(x - size * 0.4, y + spacing * 1.2, size * 0.6);
  } else if (styleIndex === 2) {
    // 樣式 2: 流蘇
    stroke(255, 255, 0);
    strokeWeight(size * 0.4);
    for (let i = 0; i < 3; i++) {
      let offsetX = (i - 1) * (size * 0.6);
      line(x + offsetX, y + spacing, x + offsetX, y + spacing * 5);
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
