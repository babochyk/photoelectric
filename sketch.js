/* TODO
- Photons:
  - Flickering
- Electrons:
  - Non-overlapping placement
*/

let frequencySlider, frequencySliderLength, frequencySliderLengthScale, frequency;
let minFrequency = 50, maxFrequency = 1350;

let intensitySlider, intensity;

let lampaImg;

let lampSprite, lightbulbSprite;

let photons = [];
let SwitchPhotonFormButton, photonWaveForm = true;

let atomCount = 2
let currentElement;
let PlateSelectMenu;

let electrons = []
let flyingElectrons = []

let PhotonSpeedSlider;

const electronRadius = 12.5
let electronDiameter = electronRadius * 2
let ResetElectronsButton;
let InfiniteElectronsCheck, infiniteElectrons;

let waveTailMaxLength = 50, waveAmplitude = 10;
let waveScale = 1 / 3000000000 // holy magic number
let photonSpeed;

class Photon {
  constructor(frequency, position, angle) {
    this.frequency = frequency;
    this.position = position;
    this.angle = angle;
    this.col = get_frequency_color(this.frequency)
    this.lifeTick = 0
  }
}

let PlateOptions = {
  "Sodium": {thresholdF: 440, col: "#c4c3ab", atomicNum: 11},
  "Zinc": {thresholdF: 1020, col: "#abb9c4", atomicNum: 30},
  "Iron": {thresholdF: 1040, col: "#d1d1d1", atomicNum: 26},
  "Copper": {thresholdF: 1130, col: "#ff9340", atomicNum: 29},
  "Gold": {thresholdF: 1230, col: "#ffd86e", atomicNum: 79},
  "Silver": {thresholdF: 9710, col: "#EBEBEB", atomicNum: 47}, // Sturdy dude
  "Double Helix": {thresholdF: 1200, col: "#FFF", atomicNum: 30}
}

function setup() {
  let canvas = createCanvas(600, 600);
  canvas.parent("sketch-holder");
  
  lampSprite = loadImage("lamp.png")
  
  lightbulbSprite = loadImage("lightbulb.png");
  
  PlateSelectMenu = createSelect()
  for (let key in PlateOptions) {
    PlateSelectMenu.option(key);
  }
  PlateSelectMenu.position(width - PlateSelectMenu.width - 83, 52);
  PlateSelectMenu.selected("Zinc");
  PlateSelectMenu.changed(generateElectrons)
  currentElement = PlateOptions[PlateSelectMenu.selected()];
  
  frequencySlider = createSlider(minFrequency, maxFrequency, 443)
  frequencySliderLength = width - 10 * 2;
  frequencySliderLengthScale = frequencySliderLength / (maxFrequency - minFrequency)
  frequencySlider.size(frequencySliderLength);
  frequencySlider.position(width - frequencySlider.width - 12.5, 25)
  //frequencySlider.style('overflow', 'hidden');
  
  intensitySlider = createSlider(0, 100, 33)
  intensitySlider.style('transform', 'rotate(270deg)');
  intensitySlider.position(width - 209.5, intensitySlider.width + height / 2 - 8)
  
  ResetElectronsButton = createButton("Reset Electrons");
  ResetElectronsButton.mousePressed(generateElectrons);
  ResetElectronsButton.position(10, 52);
  
  InfiniteElectronsCheck = createCheckbox("Infinite Electrons")
  InfiniteElectronsCheck.style("background", "white")
  InfiniteElectronsCheck.position(10, 85)
  
  SwitchPhotonFormButton = createButton("Switch Photon Visual Form")
  SwitchPhotonFormButton.position(width - SwitchPhotonFormButton.width - 7.5, height - 60);
  SwitchPhotonFormButton.mousePressed(() => { 
    photonWaveForm = !photonWaveForm;
  });
  
  PhotonSpeedSlider = createSlider(1, 20, 10)
  PhotonSpeedSlider.position(width - PhotonSpeedSlider.width - 10, height - 26)
  
  PlateSelectMenu.parent("sketch-holder");
  frequencySlider.parent("sketch-holder");
  intensitySlider.parent("sketch-holder");
  ResetElectronsButton.parent("sketch-holder");
  InfiniteElectronsCheck.parent("sketch-holder");
  SwitchPhotonFormButton.parent("sketch-holder");
  PhotonSpeedSlider.parent("sketch-holder");
  
  generateElectrons();
}

function draw() {
  background(128);
  currentElement = PlateOptions[PlateSelectMenu.selected()];
  
  infiniteElectrons = InfiniteElectronsCheck.checked()
  
  photonSpeed = PhotonSpeedSlider.value()
  
  slider();
  
  light();
  
  plate();
  
  if (PlateSelectMenu.selected() != "Double Helix") {
    current();
  }
}

function current() {
  let current = 0;
  if (frequency / currentElement.thresholdF > 1) {
    current = (0.01 + (frequency / currentElement.thresholdF - 1) / 0.32 * (0.2 - 0.01)).toFixed(3)
    //current = frequency / currentElement.thresholdF
  }
  fill(255)
  stroke(255, 255, 0)
  strokeWeight(3)
  rect(8, height - 31, 160, 24)
  noStroke();
  fill(0)
  textSize(24)
  text(`Current: ${current}`, 10, height - 10)
  textSize(12)
}

let visibleFrequencies = [400,790];
let segmentThresholds = [
      0.1,
      0.1 + 0.8 / 6,
      0.1 + 0.8 / 6 * 2,
      0.1 + 0.8 / 6 * 3,
      0.1 + 0.8 / 6 * 4,
      0.1 + 0.8,
      1
    ]
function get_frequency_color(sliderProgress) {
  if (sliderProgress < visibleFrequencies[0] || sliderProgress > visibleFrequencies[1]) {
    return color(0)
  }
  else {
    let segment, segmentProgress;
    let visibleFrequencyProgress = (sliderProgress - visibleFrequencies[0]) / (visibleFrequencies[1] - visibleFrequencies[0]);
    
    for (let i = 0; i <= segmentThresholds.length; i++) {
      if (visibleFrequencyProgress <= segmentThresholds[i]) {
        segment = i
        break;
      }
    }
    if (segment == 0) {
      segmentProgress = visibleFrequencyProgress / segmentThresholds[segment]
    }
    else {
      segmentProgress = (visibleFrequencyProgress - segmentThresholds[segment - 1]) / (segmentThresholds[segment] - segmentThresholds[segment - 1])
    }
    
    switch (segment) {
      case 0:
        return color(255 * segmentProgress, 0, 0)
      case 1:
        return color(255, 255 * segmentProgress, 0)
      case 2:
        return color(255 * (-segmentProgress + 1), 255, 0)
      case 3:
        return color(0, 255, 255 * segmentProgress)
      case 4:
        return color(0, 255 * (-segmentProgress + 1), 255)
      case 5:
        return color(150 * segmentProgress, 0, 255)
      case 6:
        return color((1 - segmentProgress) * 150, 0, (1 - segmentProgress) * 255)
    }
  }
}

function slider() {
  frequency = frequencySlider.value()
  fill(255)
  noStroke()
  text(`Frequency: ${frequency} THz`, width / 2 - 50, 60)
  
  let h = 30
  let x = 10
  let y = 10
  for (let i = 0; i < frequencySliderLength; i++) {
    let sliderProgress = minFrequency + i / frequencySliderLength * (maxFrequency - minFrequency)
    let f_color = get_frequency_color(sliderProgress)
    stroke(f_color)
    
    line(x + i, y, x + i, y + h)
  }
  noStroke();
  fill(255)
  text("IR", 12, 23)
  text("UV", width - 30, 23)
}

let lightCounterReset = 500;
let lightCounter = lightCounterReset;
function light() {
  intensity = intensitySlider.value()
  
  stroke(0)
  strokeWeight(3)
  fill(224, 112, 38)
  ellipse(width * 3 / 4 + 7, height - 92, 140, 20)
  strokeWeight(12);
  line(width * 3 / 4 + 7, height / 2, width * 3 / 4 + 7, height - 94)
  strokeWeight(6);
  stroke(224, 112, 38)
  line(width * 3 / 4 + 7, height / 2, width * 3 / 4 + 7, height - 94)
  noStroke();
  strokeWeight(1);
  
  lampSprite.resize(140, 0);
  image(lampSprite,
        width * 3 / 4 - lampSprite.width / 2,
        height / 2 - lampSprite.height / 2)
  lightbulbSprite.resize(53, 0);
  image(lightbulbSprite,
        width / 2 + 47,
        height / 2 - lightbulbSprite.height / 2)
  
  fill(255)
  noStroke()
  text(`Intensity: ${intensity}%`, width - 175, height / 2 + 5)
  
  
  let f_color = get_frequency_color(frequencySlider.value())
  fill(red(f_color), green(f_color), blue(f_color), 255 * (intensitySlider.value() / 100))
  circle(width / 2 + 73.5,
        height / 2, 50)
  
  lightCounter -= intensity * photonSpeed / 10
  if (lightCounter <= 0) {
    lightCounter = lightCounterReset
    let photon = new Photon(frequencySlider.value(), [width / 2 + 73.5,
        height / 2, 50], PI + (Math.random() - 0.5) * PI / 3)
    photon.tailLength = 0
    photon.polarity = Math.random() < 0.5
    photons.push(photon)
  }
  
  for (let p = 0; p < photons.length; p++) {
    let photon = photons[p];
    photon.lifeTick++
      
      velocity = [photonSpeed * cos(photon.angle), photonSpeed * sin(photon.angle)]
    photon.position[0] += velocity[0]
    photon.position[1] += velocity[1]
      if (photon.tailLength < waveTailMaxLength) {
      photon.tailLength = photon.lifeTick * photonSpeed
    }
    else {
      photon.tailLength = waveTailMaxLength
    }
    
    
    if (photonWaveForm) {
      dimCol = color(red(photon.col), green(photon.col), blue(photon.col), 60)
      angle = photon.angle + PI
      //plane
      // stroke(dimCol)
      // line(photon.position[0], photon.position[1],
      //      photon.position[0] + waveTailLength * cos(angle), photon.position[1] + waveTailLength * sin(angle))

      noFill()
      beginShape()
      strokeWeight(2)
      //wave
      let k = 2 * photon.frequency ** 3 * waveScale      // radians per pixel
      let omega = photonSpeed * k                        // radians per tick
      let step = photon.lifeTick * omega
      for (let i = 0; i <= photon.tailLength; i++) {
        let x = photon.position[0] + i * cos(angle) + waveAmplitude * sin(i * k - step - PI * photon.polarity) * cos(angle + PI / 2)
        let y = photon.position[1] + i * sin(angle) + waveAmplitude * sin(i * k - step - PI * photon.polarity) * sin(angle + PI / 2)
        stroke(photon.col)
        vertex(x, y)
        //circle(x, y, 3)
      }
      endShape()
      strokeWeight(1)
      
      //head
//       fill(photon.col)
//       let headx = photon.position[0] + waveAmplitude * sin(-step) * cos(angle + PI / 2)
//       let heady = photon.position[1] + waveAmplitude * sin(-step) * sin(angle + PI / 2)
//       let headangle = PI / 2 * cos(step)

//       triangle(headx - 10 * cos(angle + headangle), heady - 10 * sin(angle + headangle),
//                headx - 5 * cos(angle - PI * 2 / 3 + headangle), heady - 5 * sin(angle - PI * 2 / 3 + headangle),
//                headx - 5 * cos(angle - PI * 4 / 3 + headangle), heady - 5 * sin(angle - PI * 4 / 3 + headangle))
    }
    else {
      fill(photon.col)
    circle(photon.position[0], photon.position[1], 10)
    }
    
    if (photon.position[0] <= platex + plateWidth &&
        photon.position[1] <= platey + plateHeight &&
        photon.position[0] >= platex &&
        photon.position[1] >= platey
       ) {
      photons.splice(p, 1) //stinky js
      //причина тряски
      disturbElectrons(photon.frequency);
    }
  }
  fill(255)
  noStroke();
  text("Photon Speed", width - PhotonSpeedSlider.width - 100, height - 10)
}


const platex = 10;
const platey = 120;
const plateWidth = 150;
const plateHeight = 400;

let electronSpeed = 20;

let helixColors = [
  "red",
  "orange",
  "blue",
  "green",
  "black"
]
function plate() {
  let atomicNumber = currentElement.atomicNum
  noFill()
  
  if (PlateSelectMenu.selected() == "Double Helix") {
    strokeWeight(20)
    stroke("#6B7C98")
    beginShape();
    for (let i = 0; i <= plateHeight; i++) {
      let x = platex + 10 + plateWidth / 2 + sin(i / plateHeight * 5 * PI + PI / 2 + PI) * plateWidth / 2
      let y = platey + i
      vertex(x, y)
    }
    endShape()
    stroke("#9CB2D5")
    beginShape();
    for (let i = 0; i <= plateHeight; i++) {
      let x = platex + 10 + plateWidth / 2 + sin(i / plateHeight * 5 * PI + PI / 2) * plateWidth / 2
      let y = platey + i
      vertex(x, y)
    }
    endShape()
    strokeWeight(3)
    let colorCounter = 0
    for (let j = 1; j < 21; j++) {
      i = j * plateHeight / 21
      let x1 = platex + 10 + plateWidth / 2 + sin(i / plateHeight * 5 * PI + PI / 2) * plateWidth / 2
      let x2 = platex + 10 + plateWidth / 2 + sin(i / plateHeight * 5 * PI + PI / 2 + PI) * plateWidth / 2
      let y = platey + i
      stroke(helixColors[colorCounter])
      colorCounter = (colorCounter + 1) % helixColors.length
      line(x1, y, x1 + (x2 - x1) / 2, y)
      stroke(helixColors[colorCounter])
      colorCounter = (colorCounter + 1) % helixColors.length
      line(x1 + (x2 - x1) / 2, y, x2, y)
    }
    strokeWeight(1)
    
    if (infiniteElectrons && electrons.length < atomCount * atomicNumber) {
      let coinFlip = Math.random() < 0.5
    if (coinFlip) {
      let rng = Math.random() * (plateHeight - 2 * electronRadius)
      let x = platex + 10 + plateWidth / 2 + sin(rng / plateHeight * 5 * PI + PI / 2 + PI) * plateWidth / 2
      let y = platey + rng
      electrons.push({x: x, y: y, shake: 0});
    }
    else {
      let rng = Math.random() * (plateHeight - 2 * electronRadius)
      let x = platex + 10 + plateWidth / 2 + sin(rng / plateHeight * 5 * PI + PI / 2) * plateWidth / 2
      let y = platey + rng
      electrons.push({x: x, y: y, shake: 0});
    }
    }
  }
  else {
      fill(currentElement.col)
    noStroke();
    rect(platex, platey, plateWidth, plateHeight)
    
    if (infiniteElectrons && electrons.length < atomCount * atomicNumber) {
      let x = platex + 1.5 * electronRadius
        x = x + Math.random() * (plateWidth - 3 * electronRadius)
        let y = platey + 1.5 * electronRadius
        y = y + Math.random() * (plateHeight - 3 * electronRadius)
        electrons.push({x: x, y: y, shake: 0})
    }
  }
  for (let i = 0; i < electrons.length; i++) {
      let e = electrons[i]
      electron(e)
    }
  for (let i = 0; i < flyingElectrons.length; i++) {
      let e = flyingElectrons[i]
      e.x += e.speed * cos(e.angle)
      e.y += e.speed * sin(e.angle)
      electron(e)
    }
  
  
}

let shakingThreshold = 0.5;

function disturbElectrons(frequency) {
  if (electrons.length <= 0) { return }
  let e = electrons[Math.floor(Math.random() * electrons.length)]
  let thresholdFrequency = currentElement.thresholdF;
  if (frequency < thresholdFrequency) {
    e.shake = 7 * frequency / thresholdFrequency
  }
  if (frequency >= thresholdFrequency) {
    e.shake = 0
    flyingElectrons.push({x: e.x, y: e.y, angle: 0 + (Math.random() - 0.5) * PI / 3, speed: electronSpeed * (frequency / thresholdFrequency) ** 3})
    let index = electrons.indexOf(e)
    electrons.splice(index, 1)
  }
}

function electron(electron) {
  let x = electron.x * 1
  let y = electron.y * 1
  if (typeof electron.shake !== 'undefined') {
    x += (electron.shake ** 3) / 5
    electron.shake *= -0.9
  }
  fill(85, 222, 67);
  stroke(71, 191, 55);
  ellipse(x, y, electronRadius * 2, electronRadius * 2);
  noStroke();
  fill(255, 255, 255);
  let crossWidth = electronRadius / 4
  let crossOffset = 3
  rect(x - electronRadius + crossOffset, y - crossWidth / 2,
  electronRadius * 2 - crossOffset * 2, crossWidth)
}

function generateElectrons() {
  currentElement = PlateOptions[PlateSelectMenu.selected()];
  photons = []
  flyingElectrons = []
  electrons = []
  let atomicNumber = currentElement.atomicNum
  if (PlateSelectMenu.selected() == "Double Helix") {
    for (let i = 0; i <= atomCount * atomicNumber / 2; i++) {
      let rng = Math.random() * (plateHeight - 2 * electronRadius)
      let x = platex + 10 + plateWidth / 2 + sin(rng / plateHeight * 5 * PI + PI / 2 + PI) * plateWidth / 2
      let y = platey + rng
      electrons[i] = {x: x, y: y, shake: 0}
    }
    for (let i = 0; i <= atomCount * atomicNumber / 2; i++) {
      let rng = Math.random() * (plateHeight - 2 * electronRadius)
      let x = platex + 10 + plateWidth / 2 + sin(rng / plateHeight * 5 * PI + PI / 2) * plateWidth / 2
      let y = platey + rng
      electrons[i + atomCount * atomicNumber / 2] = {x: x, y: y, shake: 0}
    }
  } 
  else {
    for (let i = 0; i < atomCount * atomicNumber; i++) {
      //let x = Math.floor(Math.random() * (plateWidth - electronRadius * 2)) + platex + electronRadius;
      let x = platex + 1.5 * electronRadius
      x = x + Math.random() * (plateWidth - 3 * electronRadius)
      let y = platey + 1.5 * electronRadius
      y = y + Math.random() * (plateHeight - 3 * electronRadius)
      electrons[i] = {x: x, y: y, shake: 0}
    }
  }
}
