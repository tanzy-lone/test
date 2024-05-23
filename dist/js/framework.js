class Vector2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
  add(v) {
    this.x += v.x;
    this.y += v.y;
    return this;
  }
  multiplyScalar(s) {
    this.x *= s;
    this.y *= s;
    return this;
  }
  clone() {
    return new Vector2(this.x, this.y);
  }
}
class Time {
  constructor() {
    const now = Time.now();
    this.delta = 0;
    this.elapsed = 0;
    this.start = now;
    this.previous = now;
  }
  update() {
    const now = Time.now();
    this.delta = now - this.previous;
    this.elapsed = now - this.start;
    this.previous = now;
  }
  static now() {
    return Date.now() / 1000;
  }
}
class Particle {
  constructor(
    position,
    velocity = new Vector2(),
    color = "white",
    radius = 1,
    lifetime = 1,
    mass = 1
  ) {
    this.position = position;
    this.velocity = velocity;
    this.color = color;
    this.radius = radius;
    this.lifetime = lifetime;
    this.mass = mass;
    this.isInCanvas = true;
    this.createdOn = Time.now();
  }
  update(time) {
    if (!this.getRemainingLifetime()) {
      return;
    }
    this.velocity.add(Particle.GRAVITATION.clone().multiplyScalar(this.mass));
    this.position.add(this.velocity.clone().multiplyScalar(time.delta));
  }
  render(canvas, context) {
    const remainingLifetime = this.getRemainingLifetime();
    if (!remainingLifetime) return;
    const radius = this.radius * remainingLifetime;
    context.globalAlpha = remainingLifetime;
    context.globalCompositeOperation = "lighter";
    context.fillStyle = this.color;
    context.beginPath();
    context.arc(this.position.x, this.position.y, radius, 0, Math.PI * 2);
    context.fill();
  }
  getRemainingLifetime() {
    const elapsedLifetime = Time.now() - this.createdOn;
    return Math.max(0, this.lifetime - elapsedLifetime) / this.lifetime;
  }
}
Particle.GRAVITATION = new Vector2(0, 9.81);
class Trail extends Particle {
  constructor(
    childFactory,
    position,
    velocity = new Vector2(),
    lifetime = 1,
    mass = 1
  ) {
    super(position, velocity);
    this.childFactory = childFactory;
    this.children = [];
    this.lifetime = lifetime;
    this.mass = mass;
    this.isAlive = true;
  }
  update(time) {
    super.update(time);
    // Add a new child on every frame
    if (this.isAlive && this.getRemainingLifetime()) {
      this.children.push(this.childFactory(this));
    }
    // Remove particles that are dead
    this.children = this.children.filter(function (child) {
      if (child instanceof Trail) {
        return child.isAlive;
      }
      return child.getRemainingLifetime();
    });
    // Kill trail if all particles fade away
    if (!this.children.length) {
      this.isAlive = false;
    }
    // Update particles
    this.children.forEach(function (child) {
      child.update(time);
    });
  }
  render(canvas, context) {
    // Render all children
    this.children.forEach(function (child) {
      child.render(canvas, context);
    });
  }
}
class Rocket extends Trail {
  constructor(
    childFactory,
    explosionFactory,
    position,
    velocity = new Vector2()
  ) {
    super(childFactory, position, velocity);
    this.explosionFactory = explosionFactory;
    this.lifetime = 10;
  }
  update(time) {
    if (this.getRemainingLifetime() && this.velocity.y > 0) {
      this.explosionFactory(this);
      this.lifetime = 0;
    }
    super.update(time);
  }
}
const canvas = document.createElement("canvas");
const context = canvas.getContext("2d");
const time = new Time();
let rockets = [];
const getTrustParticleFactory = function (baseHue) {
  function getColor() {
    const hue = Math.floor(Math.random() * 15 + 30);
    return `hsl(${hue}, 100%, 75%`;
  }
  return function (parent) {
    const position = this.position.clone();
    const velocity = this.velocity.clone().multiplyScalar(-0.1);
    velocity.x += (Math.random() - 0.5) * 8;
    const color = getColor();
    const radius = 1 + Math.random();
    const lifetime = 0.5 + Math.random() * 0.5;
    const mass = 0.01;
    return new Particle(position, velocity, color, radius, lifetime, mass);
  };
};
const getExplosionFactory = function (baseHue) {
  function getColor() {
    const hue = Math.floor(baseHue + Math.random() * 15) % 360;
    const lightness = Math.floor(Math.pow(Math.random(), 2) * 50 + 50);
    return `hsl(${hue}, 100%, ${lightness}%`;
  }

  function getChildFactory() {
    return function (parent) {
      const direction = Math.random() * Math.PI * 2;
      const force = 8;
      const velocity = new Vector2(
        Math.cos(direction) * force,
        Math.sin(direction) * force
      );
      const color = getColor();
      const radius = 1 + Math.random();
      const lifetime = 1;
      const mass = 0.1;
      return new Particle(
        parent.position.clone(),
        velocity,
        color,
        radius,
        lifetime,
        mass
      );
    };
  }

  function getTrail(position) {
    const direction = Math.random() * Math.PI * 2;
    const force = Math.random() * 128;
    const velocity = new Vector2(
      Math.cos(direction) * force,
      Math.sin(direction) * force
    );
    const lifetime = 0.5 + Math.random();
    const mass = 0.075;
    return new Trail(getChildFactory(), position, velocity, lifetime, mass);
  }
  return function (parent) {
    let trails = 32;
    while (trails--) {
      parent.children.push(getTrail(parent.position.clone()));
    }
  };
};
const addRocket = function () {
  const trustParticleFactory = getTrustParticleFactory();
  const explosionFactory = getExplosionFactory(Math.random() * 360);
  const position = new Vector2(Math.random() * canvas.width, canvas.height);
  const thrust = window.innerHeight * 0.75;
  const angle = Math.PI / -2 + ((Math.random() - 0.5) * Math.PI) / 8;
  const velocity = new Vector2(
    Math.cos(angle) * thrust,
    Math.sin(angle) * thrust
  );
  const lifetime = 3;
  rockets.push(
    new Rocket(
      trustParticleFactory,
      explosionFactory,
      position,
      velocity,
      lifetime
    )
  );
  rockets = rockets.filter(function (rocket) {
    return rocket.isAlive;
  });
};
const render = function () {
  requestAnimationFrame(render);
  time.update();
  context.clearRect(0, 0, canvas.width, canvas.height);
  rockets.forEach(function (rocket) {
    rocket.update(time);
    rocket.render(canvas, context);
  });
};
const resize = function () {
  canvas.height = window.innerHeight;
  canvas.width = window.innerWidth;
};
canvas.onclick = addRocket;
document.body.appendChild(canvas);
window.onresize = resize;
resize();
setInterval(addRocket, 500);
render();

var canvas1 = document.querySelector("#canvas");
console.log(canvas1);
canvas1.width = window.innerWidth;
canvas1.height = window.innerHeight;
var ctx = canvas1.getContext("2d");
window.addEventListener("resize", function () {
  canvas1.width = window.innerWidth;
  canvas1.height = window.innerHeight;
  ctx.fillStyle = "#000003";
  ctx.fillRect(0, 0, canvas1.width, canvas1.height);
  center = {
    x: canvas1.width / 2,
    y: canvas1.height / 2,
  };
});
ctx.fillStyle = "#000003";
ctx.fillRect(0, 0, canvas1.width, canvas1.height);
var listFire = [];
var listFirework = [];
var listText = [];
var listSpecial = [];
var listSpark = [];
var lights = [];
var fireNumber = 10;
var center = {
  x: canvas1.width / 2,
  y: canvas1.height / 2,
};
var range = 100;
var fired = 0;
var onHold = 0;
var supprise = false;
var textIndex = 0;
var actions = [
  makeDoubleFullCircleFirework,
  makePlanetCircleFirework,
  makeFullCircleFirework,
  makeDoubleCircleFirework,
  makeHeartFirework,
  makeCircleFirework,
  makeRandomFirework,
];
for (var i = 0; i < fireNumber; i++) {
  var fire = {
    x: (Math.random() * range) / 2 - range / 4 + center.x,
    y: Math.random() * range * 2.5 + canvas1.height,
    size: Math.random() + 0.5,
    fill: "#ff3",
    vx: Math.random() - 0.5,
    vy: -(Math.random() + 4),
    ax: Math.random() * 0.06 - 0.03,
    delay: Math.round(Math.random() * range) + range * 4,
    hold: false,
    alpha: 1,
    far: Math.random() * range + (center.y - range),
  };
  fire.base = {
    x: fire.x,
    y: fire.y,
    vx: fire.vx,
    vy: fire.vy,
  };
  listFire.push(fire);
  playLaunchSound();
}
var textString = "happylunarnewyear2017";
var textMatrix = [
  4.5, 0, 5.5, 0, 6.5, 0, 7.5, 0, 8.5, 0, 0, 1, 1, 1, 2, 1, 3, 1, 4, 1, 6, 1, 7,
  1, 8, 1, 10, 1, 11, 1, 12, 1, 13, 1, 5, 2, 6, 2, 7, 2, 8, 2,
];
var chars = {
  h: [
    0, 0, 0, 1, 0, 2, 0, 3, 0, 4, 0, 5, 0, 6, 0, 7, 1, 3, 2, 3, 3, 3, 4, 3, 5,
    0, 5, 1, 5, 2, 5, 3, 5, 4, 5, 5, 5, 6, 5, 7,
  ],
  a: [
    2, 0, 2, 1, 2, 2, 1, 2, 1, 3, 1, 4, 1, 5, 0, 5, 0, 6, 0, 7, 2, 5, 3, 0, 3,
    1, 3, 2, 4, 2, 4, 3, 4, 4, 4, 1, 5, 5, 5, 6, 5, 7, 3, 5,
  ],
  p: [
    0, 0, 0, 1, 0, 2, 0, 3, 0, 4, 0, 5, 0, 6, 0, 7, 1, 0, 2, 0, 3, 0, 4, 1, 5,
    2, 4, 3, 3, 4, 2, 4, 1, 4,
  ],
  y: [
    0, 0, 0, 1, 1, 1, 1, 2, 1, 3, 2, 3, 2, 4, 2, 5, 2, 6, 2, 7, 3, 2, 3, 3, 4,
    1, 4, 2, 5, 0, 5, 1,
  ],
  l: [
    0, 0, 0, 1, 0, 2, 0, 3, 0, 4, 0, 5, 0, 6, 0, 7, 1, 7, 2, 7, 3, 7, 4, 7, 5,
    7,
  ],
  u: [
    0, 0, 0, 1, 0, 2, 0, 3, 0, 4, 0, 5, 0, 6, 1, 7, 2, 7, 3, 7, 4, 7, 5, 0, 5,
    1, 5, 2, 5, 3, 5, 4, 5, 5, 5, 6,
  ],
  n: [
    0, 0, 0, 1, 0, 2, 0, 3, 0, 4, 0, 5, 0, 6, 0, 7, 1, 1, 1, 2, 2, 2, 2, 3, 2,
    4, 3, 4, 3, 5, 4, 5, 4, 6, 5, 0, 5, 1, 5, 2, 5, 3, 5, 4, 5, 5, 5, 6, 5, 7,
  ],
  e: [
    0, 0, 0, 1, 0, 2, 0, 3, 0, 4, 0, 5, 0, 6, 0, 7, 1, 0, 2, 0, 3, 0, 4, 0, 5,
    0, 1, 3, 2, 3, 3, 3, 4, 3, 1, 7, 2, 7, 3, 7, 4, 7, 5, 7,
  ],
  w: [
    0, 0, 0, 1, 0, 2, 0, 3, 0, 4, 0, 5, 1, 6, 2, 1, 2, 2, 2, 3, 2, 4, 2, 5, 2,
    6, 2, 7, 3, 7, 5, 0, 5, 1, 5, 2, 5, 3, 5, 4, 5, 5, 4, 5, 4, 6,
  ],
  r: [
    0, 0, 0, 1, 0, 2, 0, 3, 0, 4, 0, 5, 0, 6, 0, 7, 1, 0, 2, 0, 3, 0, 4, 1, 5,
    2, 4, 3, 3, 4, 2, 4, 1, 4, 1, 5, 2, 5, 3, 6, 4, 6, 5, 7,
  ],
  2: [
    0, 1, 0, 0, 1, 0, 2, 0, 3, 0, 4, 0, 5, 0, 5, 1, 5, 2, 5, 3, 4, 3, 3, 3, 2,
    3, 2, 4, 1, 4, 1, 5, 0, 5, 0, 6, 0, 7, 1, 7, 2, 7, 3, 7, 4, 7, 5, 7, 5, 6,
  ],
  0: [
    0, 1, 0, 2, 0, 3, 0, 4, 0, 5, 0, 6, 1, 0, 2, 0, 3, 0, 4, 0, 1, 7, 2, 7, 3,
    7, 4, 7, 5, 1, 5, 2, 5, 3, 5, 4, 5, 5, 5, 6,
  ],
  1: [
    1, 2, 2, 2, 2, 1, 3, 1, 3, 0, 4, 0, 4, 1, 4, 2, 4, 3, 4, 4, 4, 5, 4, 6, 4,
    7, 1, 7, 2, 7, 3, 7, 5, 7,
  ],
  7: [
    0, 0, 1, 0, 2, 0, 3, 0, 4, 0, 5, 0, 5, 1, 5, 2, 5, 3, 4, 3, 4, 4, 3, 4, 3,
    5, 3, 6, 3, 7,
  ],
};

function initText() {
  var i = textIndex;
  var velocity = Math.random() * 0.25 + 1;
  var shift = {
    x: -(Math.random() + 2),
    y: -(Math.random() + 3),
  };
  var char = chars[textString[i]];
  var width = 80;
  var half = 6.5 * width;
  var left = textMatrix[i * 2] * width - half;
  var top = textMatrix[i * 2 + 1] * range * 1.2 - range * 2.4;
  for (var j = 0; j < fireNumber * char.length * 0.25; j++) {
    var rand = Math.floor(Math.random() * char.length * 0.5);
    var x = char[rand * 2] + shift.x;
    var y = char[rand * 2 + 1] + shift.y;
    var text = {
      x: center.x + left * 0.9,
      y: center.y + top,
      left: center.x + left,
      size: Math.random() + 0.5,
      fill: "#ff3",
      vx: x * (velocity + (Math.random() - 0.5) * 0.5),
      vy: y * (velocity + (Math.random() - 0.5) * 0.5),
      ay: 0.08,
      alpha: 1,
      life: Math.round((Math.random() * range) / 2) + range / 1.5,
    };
    text.base = {
      life: text.life,
      size: text.size,
    };
    text.direct = (text.left - text.x) * 0.08;
    listText.push(text);
  }
  playExpSound();
  lights.push({
    x: center.x + left * 0.9,
    y: center.y + top,
    color: text.fill,
    radius: range * 2,
  });
  if (++textIndex < textString.length) {
    setTimeout(initText, 10);
  } else {
    textIndex = 0;
  }
}

function initSpark() {
  var x = Math.random() * range * 3 - range * 1.5 + center.x;
  var vx = Math.random() - 0.5;
  var vy = -(Math.random() + 4);
  var ax = Math.random() * 0.04 - 0.02;
  var far = Math.random() * range * 4 - range + center.y;
  var direct = ax * 10 * Math.PI;
  var max = fireNumber * 0.5;
  for (var i = 0; i < max; i++) {
    var special = {
      x: x,
      y: Math.random() * range * 0.25 + canvas1.height,
      size: Math.random() + 2,
      fill: "#ff3",
      vx: vx,
      vy: vy,
      ax: ax,
      direct: direct,
      alpha: 1,
    };
    special.far = far - (special.y - canvas1.height);
    listSpecial.push(special);
    playLaunchSound();
  }
}

function randColor() {
  var r = Math.floor(Math.random() * 256);
  var g = Math.floor(Math.random() * 256);
  var b = Math.floor(Math.random() * 256);
  var color = "rgb($r, $g, $b)";
  color = color.replace("$r", r);
  color = color.replace("$g", g);
  color = color.replace("$b", b);
  return color;
}

function playExpSound() {
  // 播放爆炸声音
}

function playLaunchSound() {
  // 播放启动声音
}

function makeCircleFirework(fire) {
  var color = randColor();
  var velocity = Math.random() * 2 + 6;
  var max = fireNumber * 5;
  for (var i = 0; i < max; i++) {
    var rad = (i * Math.PI * 2) / max;
    var firework = {
      x: fire.x,
      y: fire.y,
      size: Math.random() + 1.5,
      fill: color,
      vx: Math.cos(rad) * velocity + (Math.random() - 0.5) * 0.5,
      vy: Math.sin(rad) * velocity + (Math.random() - 0.5) * 0.5,
      ay: 0.04,
      alpha: 1,
      life: Math.round((Math.random() * range) / 2) + range / 2,
    };
    firework.base = {
      life: firework.life,
      size: firework.size,
    };
    listFirework.push(firework);
  }
  return color;
}

function makeDoubleCircleFirework(fire) {
  var color = randColor();
  var velocity = Math.random() * 2 + 8;
  var max = fireNumber * 3;
  for (var i = 0; i < max; i++) {
    var rad = (i * Math.PI * 2) / max;
    var firework = {
      x: fire.x,
      y: fire.y,
      size: Math.random() + 1.5,
      fill: color,
      vx: Math.cos(rad) * velocity + (Math.random() - 0.5) * 0.5,
      vy: Math.sin(rad) * velocity + (Math.random() - 0.5) * 0.5,
      ay: 0.04,
      alpha: 1,
      life: Math.round((Math.random() * range) / 2) + range / 1.5,
    };
    firework.base = {
      life: firework.life,
      size: firework.size,
    };
    listFirework.push(firework);
  }
  color = randColor();
  velocity = Math.random() * 3 + 4;
  for (var i = 0; i < max; i++) {
    var rad = (i * Math.PI * 2) / max;
    var firework = {
      x: fire.x,
      y: fire.y,
      size: Math.random() + 1.5,
      fill: color,
      vx: Math.cos(rad) * velocity + (Math.random() - 0.5) * 0.5,
      vy: Math.sin(rad) * velocity + (Math.random() - 0.5) * 0.5,
      ay: 0.04,
      alpha: 1,
      life: Math.round((Math.random() * range) / 2) + range / 1.5,
    };
    firework.base = {
      life: firework.life,
      size: firework.size,
    };
    listFirework.push(firework);
  }
  return color;
}

function makePlanetCircleFirework(fire) {
  var color = "#aa0609";
  var velocity = Math.random() * 2 + 4;
  var max = fireNumber * 2;
  for (var i = 0; i < max; i++) {
    var rad = (i * Math.PI * 2) / max;
    var firework = {
      x: fire.x,
      y: fire.y,
      size: Math.random() + 1.5,
      fill: color,
      vx: Math.cos(rad) * velocity + (Math.random() - 0.5) * 0.5,
      vy: Math.sin(rad) * velocity + (Math.random() - 0.5) * 0.5,
      ay: 0.04,
      alpha: 1,
      life: Math.round((Math.random() * range) / 2) + range / 1.5,
    };
    firework.base = {
      life: firework.life,
      size: firework.size,
    };
    listFirework.push(firework);
  }
  max = fireNumber * 4;
  for (var i = 0; i < max; i++) {
    var rad = (i * Math.PI * 2) / max;
    var firework = {
      x: fire.x,
      y: fire.y,
      size: Math.random() + 1.5,
      fill: color,
      vx: Math.cos(rad) * velocity * Math.random(),
      vy: Math.sin(rad) * velocity * Math.random(),
      ay: 0.04,
      alpha: 1,
      life: Math.round((Math.random() * range) / 2) + range / 1.5,
    };
    firework.base = {
      life: firework.life,
      size: firework.size,
    };
    listFirework.push(firework);
  }
  max = fireNumber * 3;
  color = "#ff9";
  var rotate = Math.random() * Math.PI * 2;
  var vx = velocity * (Math.random() + 2);
  var vy = velocity * 0.6;
  for (var i = 0; i < max; i++) {
    var rad = (i * Math.PI * 2) / max;
    var cx = Math.cos(rad) * vx + (Math.random() - 0.5) * 0.5;
    var cy = Math.sin(rad) * vy + (Math.random() - 0.5) * 0.5;
    var firework = {
      x: fire.x,
      y: fire.y,
      size: Math.random() + 1.5,
      fill: color,
      vx: cx * Math.cos(rotate) - cy * Math.sin(rotate),
      vy: cx * Math.sin(rotate) + cy * Math.cos(rotate),
      ay: 0.02,
      alpha: 1,
      life: Math.round((Math.random() * range) / 2) + range / 1.5,
    };
    firework.base = {
      life: firework.life,
      size: firework.size,
    };
    listFirework.push(firework);
  }
  return "#aa0609";
}

function makeFullCircleFirework(fire) {
  var color = randColor();
  var velocity = Math.random() * 8 + 8;
  var max = fireNumber * 3;
  for (var i = 0; i < max; i++) {
    var rad = (i * Math.PI * 2) / max;
    var firework = {
      x: fire.x,
      y: fire.y,
      size: Math.random() + 1.5,
      fill: color,
      vx: Math.cos(rad) * velocity + (Math.random() - 0.5) * 0.5,
      vy: Math.sin(rad) * velocity + (Math.random() - 0.5) * 0.5,
      ay: 0.06,
      alpha: 1,
      life: Math.round((Math.random() * range) / 2) + range / 1.5,
    };
    firework.base = {
      life: firework.life,
      size: firework.size,
    };
    listFirework.push(firework);
  }
  max = fireNumber * Math.round(Math.random() * 4 + 4);
  for (var i = 0; i < max; i++) {
    var rad = (i * Math.PI * 2) / max;
    var firework = {
      x: fire.x,
      y: fire.y,
      size: Math.random() + 1.5,
      fill: color,
      vx: Math.cos(rad) * velocity * Math.random(),
      vy: Math.sin(rad) * velocity * Math.random(),
      ay: 0.06,
      alpha: 1,
      life: Math.round((Math.random() * range) / 2) + range / 1.5,
    };
    firework.base = {
      life: firework.life,
      size: firework.size,
    };
    listFirework.push(firework);
  }
  return color;
}

function makeDoubleFullCircleFirework(fire) {
  var color = randColor();
  var velocity = Math.random() * 8 + 8;
  var max = fireNumber * 3;
  for (var i = 0; i < max; i++) {
    var rad = (i * Math.PI * 2) / max;
    var firework = {
      x: fire.x,
      y: fire.y,
      size: Math.random() + 1.5,
      fill: color,
      vx: Math.cos(rad) * velocity + (Math.random() - 0.5) * 0.5,
      vy: Math.sin(rad) * velocity + (Math.random() - 0.5) * 0.5,
      ay: 0.04,
      alpha: 1,
      life: Math.round((Math.random() * range) / 2) + range / 1.5,
    };
    firework.base = {
      life: firework.life,
      size: firework.size,
    };
    listFirework.push(firework);
  }
  color = randColor();
  velocity = Math.random() * 3 + 4;
  max = fireNumber * 2;
  for (var i = 0; i < max; i++) {
    var rad = (i * Math.PI * 2) / max;
    var firework = {
      x: fire.x,
      y: fire.y,
      size: Math.random() + 1.5,
      fill: color,
      vx: Math.cos(rad) * velocity + (Math.random() - 0.5) * 0.5,
      vy: Math.sin(rad) * velocity + (Math.random() - 0.5) * 0.5,
      ay: 0.06,
      alpha: 1,
      life: Math.round((Math.random() * range) / 2) + range / 1.5,
    };
    firework.base = {
      life: firework.life,
      size: firework.size,
    };
    listFirework.push(firework);
  }
  max = fireNumber * 4;
  for (var i = 0; i < max; i++) {
    var rad = (i * Math.PI * 2) / max;
    var firework = {
      x: fire.x,
      y: fire.y,
      size: Math.random() + 1.5,
      fill: color,
      vx: Math.cos(rad) * velocity * Math.random(),
      vy: Math.sin(rad) * velocity * Math.random(),
      ay: 0.06,
      alpha: 1,
      life: Math.round((Math.random() * range) / 2) + range / 1.5,
    };
    firework.base = {
      life: firework.life,
      size: firework.size,
    };
    listFirework.push(firework);
  }
  return color;
}

function makeHeartFirework(fire) {
  var color = randColor();
  var velocity = Math.random() * 3 + 3;
  var max = fireNumber * 5;
  var rotate = Math.random() * Math.PI * 2;
  for (var i = 0; i < max; i++) {
    var rad = (i * Math.PI * 2) / max + rotate;
    var v, p;
    if (rad - rotate < Math.PI * 0.5) {
      p = (rad - rotate) / (Math.PI * 0.5);
      v = velocity + velocity * p;
    } else if (rad - rotate > Math.PI * 0.5 && rad - rotate < Math.PI) {
      p = (rad - rotate - Math.PI * 0.5) / (Math.PI * 0.5);
      v = velocity * (2 - p);
    } else if (rad - rotate > Math.PI && rad - rotate < Math.PI * 1.5) {
      p = (rad - rotate - Math.PI) / (Math.PI * 0.5);
      v = velocity * (1 - p);
    } else if (rad - rotate > Math.PI * 1.5 && rad - rotate < Math.PI * 2) {
      p = (rad - rotate - Math.PI * 1.5) / (Math.PI * 0.5);
      v = velocity * p;
    } else {
      v = velocity;
    }
    v = v + (Math.random() - 0.5) * 0.25;
    var firework = {
      x: fire.x,
      y: fire.y,
      size: Math.random() + 1.5,
      fill: color,
      vx: Math.cos(rad) * v,
      vy: Math.sin(rad) * v,
      ay: 0.02,
      alpha: 1,
      life: Math.round((Math.random() * range) / 2) + range / 1.5,
    };
    firework.base = {
      life: firework.life,
      size: firework.size,
    };
    listFirework.push(firework);
  }
  return color;
}

function makeRandomFirework(fire) {
  var color = randColor();
  for (var i = 0; i < fireNumber * 5; i++) {
    var firework = {
      x: fire.x,
      y: fire.y,
      size: Math.random() + 1.5,
      fill: color,
      vx: Math.random() * 15 - 7.5,
      vy: Math.random() * -15 + 5,
      ay: 0.05,
      alpha: 1,
      life: Math.round((Math.random() * range) / 2) + range / 2,
    };
    firework.base = {
      life: firework.life,
      size: firework.size,
    };
    listFirework.push(firework);
  }
  return color;
}

function makeSpark(special) {
  var color = special.fill;
  var velocity = Math.random() * 6 + 12;
  var max = fireNumber;
  for (var i = 0; i < max; i++) {
    var rad =
      Math.random() * Math.PI * 0.3 + Math.PI * 0.35 + Math.PI + special.direct;
    var spark = {
      x: special.x,
      y: special.y,
      size: Math.random() + 1,
      fill: color,
      vx: Math.cos(rad) * velocity + (Math.random() - 0.5) * 0.5,
      vy: Math.sin(rad) * velocity + (Math.random() - 0.5) * 0.5,
      ay: 0.02,
      alpha: 1,
      rad: rad,
      direct: special.direct,
      chain: Math.round(Math.random() * 2) + 2,
      life: Math.round((Math.random() * range) / 2) + range / 2,
    };
    spark.base = {
      life: spark.life,
      velocity: velocity,
    };
    listSpark.push(spark);
  }
  return color;
}

function chainSpark(parentSpark) {
  var color = parentSpark.fill;
  if (parentSpark.chain > 0) {
    var velocity = parentSpark.base.velocity * 0.6;
    var max = Math.round(Math.random() * 5);
    for (var i = 0; i < max; i++) {
      var rad =
        Math.random() * Math.PI * 0.3 -
        Math.PI * 0.15 +
        parentSpark.rad +
        parentSpark.direct;
      var spark = {
        x: parentSpark.x,
        y: parentSpark.y,
        size: parentSpark.size * 0.6,
        fill: color,
        vx: Math.cos(rad) * velocity + (Math.random() - 0.5) * 0.5,
        vy: Math.sin(rad) * velocity + (Math.random() - 0.5) * 0.5,
        ay: 0.02,
        alpha: 1,
        rad: rad,
        direct: parentSpark.direct,
        chain: parentSpark.chain,
        life: parentSpark.base.life * 0.8,
      };
      spark.base = {
        life: spark.life,
        size: spark.size,
        velocity: velocity,
      };
      listSpark.push(spark);
    }
    if (Math.random() > 0.9 && parentSpark.chain > 1) {
      playExpSound();
    }
  }
  return color;
}
(function loop() {
  requestAnimationFrame(loop);
  update();
  draw();
})();

function update() {
  for (var i = 0; i < listFire.length; i++) {
    var fire = listFire[i];
    if (fire.y <= fire.far) {
      playExpSound();
      fired++;
      var color = actions[Math.floor(Math.random() * actions.length)](fire);
      lights.push({
        x: fire.x,
        y: fire.y,
        color: color,
        radius: range * 2,
      });
      fire.y = fire.base.y;
      fire.x = fire.base.x;
      if (fired % 33 == 0) {
        initSpark();
      }
      supprise = fired % 100 == 0 ? true : supprise;
      if (supprise) {
        fire.vx = 0;
        fire.vy = 0;
        fire.ax = 0;
        fire.hold = true;
        onHold++;
      } else {
        fire.vx = fire.base.vx;
        fire.vy = fire.base.vy;
        fire.ax = Math.random() * 0.06 - 0.03;
        playLaunchSound();
      }
    }
    if (fire.hold && fire.delay <= 0) {
      onHold--;
      fire.hold = false;
      fire.delay = Math.round(Math.random() * range) + range * 4;
      fire.vx = fire.base.vx;
      fire.vy = fire.base.vy;
      fire.ax = Math.random() * 0.06 - 0.03;
      fire.alpha = 1;
      playLaunchSound();
    } else if (fire.hold && fire.delay > 0) {
      fire.delay--;
    } else {
      fire.x += fire.vx;
      fire.y += fire.vy;
      fire.vx += fire.ax;
      fire.alpha = (fire.y - fire.far) / fire.far;
    }
  }
  for (var i = listFirework.length - 1; i >= 0; i--) {
    var firework = listFirework[i];
    if (firework) {
      firework.vx *= 0.9;
      firework.vy *= 0.9;
      firework.x += firework.vx;
      firework.y += firework.vy;
      firework.vy += firework.ay;
      firework.alpha = firework.life / firework.base.life;
      firework.size = firework.alpha * firework.base.size;
      firework.alpha = firework.alpha > 0.6 ? 1 : firework.alpha;
      firework.life--;
      if (firework.life <= 0) {
        listFirework.splice(i, 1);
      }
    }
  }
  if (supprise && onHold == 10) {
    supprise = false;
    setTimeout(initText, 3000);
  }
  for (var i = listText.length - 1; i >= 0; i--) {
    var text = listText[i];
    text.vx *= 0.9;
    text.vy *= 0.9;
    text.direct *= 0.9;
    text.x += text.vx + text.direct;
    text.y += text.vy;
    text.vy += text.ay;
    text.alpha = text.life / text.base.life;
    text.size = text.alpha * text.base.size;
    text.alpha = text.alpha > 0.6 ? 1 : text.alpha;
    text.life--;
    if (text.life <= 0) {
      listText.splice(i, 1);
    }
  }
  for (var i = listSpecial.length - 1; i >= 0; i--) {
    var special = listSpecial[i];
    if (special.y <= special.far) {
      playExpSound();
      lights.push({
        x: special.x,
        y: special.y,
        color: special.fill,
        alpha: 0.02,
        radius: range * 2,
      });
      makeSpark(special);
      listSpecial.splice(i, 1);
    } else {
      special.x += special.vx;
      special.y += special.vy;
      special.vx += special.ax;
      special.alpha = (special.y - special.far) / special.far;
    }
  }
  for (var i = listSpark.length - 1; i >= 0; i--) {
    var spark = listSpark[i];
    if (spark) {
      spark.vx *= 0.9;
      spark.vy *= 0.9;
      spark.x += spark.vx;
      spark.y += spark.vy;
      spark.vy += spark.ay;
      spark.alpha = spark.life / spark.base.life + 0.2;
      spark.life--;
      if (spark.life < spark.base.life * 0.8 && spark.life > 0) {
        spark.chain--;
        chainSpark(spark);
      }
      if (spark.life <= 0) {
        listSpark.splice(i, 1);
      }
    }
  }
}

function draw() {
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = "#000003";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = "screen";
  for (var i = 0; i < listFire.length; i++) {
    var fire = listFire[i];
    ctx.globalAlpha = fire.alpha;
    ctx.beginPath();
    ctx.arc(fire.x, fire.y, fire.size, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fillStyle = fire.fill;
    ctx.fill();
  }
  for (var i = 0; i < listFirework.length; i++) {
    var firework = listFirework[i];
    ctx.globalAlpha = firework.alpha;
    ctx.beginPath();
    ctx.arc(firework.x, firework.y, firework.size, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fillStyle = firework.fill;
    ctx.fill();
  }
  for (var i = 0; i < listSpecial.length; i++) {
    var special = listSpecial[i];
    ctx.globalAlpha = special.alpha;
    ctx.fillStyle = special.fill;
    ctx.fillRect(
      special.x - special.size,
      special.y - special.size,
      special.size * 2,
      special.size * 2
    );
  }
  for (var i = 0; i < listSpark.length; i++) {
    var spark = listSpark[i];
    ctx.globalAlpha = spark.alpha;
    ctx.fillStyle = spark.fill;
    ctx.fillRect(
      spark.x - spark.size,
      spark.y - spark.size,
      spark.size * 2,
      spark.size * 2
    );
  }
  while (lights.length) {
    var light = lights.pop();
    var gradient = ctx.createRadialGradient(
      light.x,
      light.y,
      0,
      light.x,
      light.y,
      light.radius
    );
    gradient.addColorStop(0, "#fff");
    gradient.addColorStop(0.2, light.color);
    gradient.addColorStop(0.8, "rgba(0, 0, 0, 0)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.globalAlpha = light.alpha ? light.alpha : 0.25;
    ctx.fillStyle = gradient;
    ctx.fillRect(
      light.x - light.radius,
      light.y - light.radius,
      light.radius * 2,
      light.radius * 2
    );
  }
  for (var i = 0; i < listText.length; i++) {
    var text = listText[i];
    ctx.globalAlpha = text.alpha;
    ctx.fillStyle = text.fill;
    ctx.fillRect(
      text.x - text.size,
      text.y - text.size,
      text.size * 2,
      text.size * 2
    );
  }
}

// 第三版
var RENDERER = {
  LEAF_INTERVAL_RANGE: { min: 100, max: 200 },
  FIREWORK_INTERVAL_RANGE: { min: 20, max: 200 },
  SKY_COLOR: "hsla(210, 60%, %luminance%, 0.2)",
  STAR_COUNT: 100,

  init: function () {
    this.setParameters();
    this.reconstructMethod();
    this.createTwigs();
    this.createStars();
    this.render();
  },
  setParameters: function () {
    this.$container = $("#jsi-fireworks-container");
    this.width = this.$container.width();
    this.height = this.$container.height();
    this.distance = Math.sqrt(
      Math.pow(this.width / 2, 2) + Math.pow(this.height / 2, 2)
    );
    this.contextFireworks = $("<canvas />")
      .attr({ width: this.width, height: this.height })
      .appendTo(this.$container)
      .get(0)
      .getContext("2d");
    this.contextTwigs = $("<canvas />")
      .attr({ width: this.width, height: this.height })
      .appendTo(this.$container)
      .get(0)
      .getContext("2d");

    this.twigs = [];
    this.leaves = [new LEAF(this.width, this.height, this)];
    this.stars = [];
    this.fireworks = [new FIREWORK(this.width, this.height, this)];

    this.leafInterval = this.getRandomValue(this.LEAF_INTERVAL_RANGE) | 0;
    this.maxFireworkInterval =
      this.getRandomValue(this.FIREWORK_INTERVAL_RANGE) | 0;
    this.fireworkInterval = this.maxFireworkInterval;
  },
  reconstructMethod: function () {
    this.render = this.render.bind(this);
  },
  getRandomValue: function (range) {
    return range.min + (range.max - range.min) * Math.random();
  },
  createTwigs: function () {
    this.twigs.push(
      new TWIG(this.width, this.height, 0, 0, (Math.PI * 3) / 4, 0)
    );
    this.twigs.push(
      new TWIG(
        this.width,
        this.height,
        this.width,
        0,
        (-Math.PI * 3) / 4,
        Math.PI
      )
    );
    this.twigs.push(
      new TWIG(this.width, this.height, 0, this.height, Math.PI / 4, Math.PI)
    );
    this.twigs.push(
      new TWIG(
        this.width,
        this.height,
        this.width,
        this.height,
        -Math.PI / 4,
        0
      )
    );
  },
  createStars: function () {
    for (var i = 0, length = this.STAR_COUNT; i < length; i++) {
      this.stars.push(
        new STAR(this.width, this.height, this.contextTwigs, this)
      );
    }
  },
  render: function () {
    requestAnimationFrame(this.render);

    var maxOpacity = 0,
      contextTwigs = this.contextTwigs,
      contextFireworks = this.contextFireworks;

    for (var i = this.fireworks.length - 1; i >= 0; i--) {
      maxOpacity = Math.max(maxOpacity, this.fireworks[i].getOpacity());
    }
    contextTwigs.clearRect(0, 0, this.width, this.height);
    contextFireworks.fillStyle = this.SKY_COLOR.replace(
      "%luminance",
      5 + maxOpacity * 15
    );
    contextFireworks.fillRect(0, 0, this.width, this.height);

    for (var i = this.fireworks.length - 1; i >= 0; i--) {
      if (!this.fireworks[i].render(contextFireworks)) {
        this.fireworks.splice(i, 1);
      }
    }
    for (var i = this.stars.length - 1; i >= 0; i--) {
      this.stars[i].render(contextTwigs);
    }
    for (var i = this.twigs.length - 1; i >= 0; i--) {
      this.twigs[i].render(contextTwigs);
    }
    for (var i = this.leaves.length - 1; i >= 0; i--) {
      if (!this.leaves[i].render(contextTwigs)) {
        this.leaves.splice(i, 1);
      }
    }
    if (--this.leafInterval == 0) {
      this.leaves.push(new LEAF(this.width, this.height, this));
      this.leafInterval = this.getRandomValue(this.LEAF_INTERVAL_RANGE) | 0;
    }
    if (--this.fireworkInterval == 0) {
      this.fireworks.push(new FIREWORK(this.width, this.height, this));
      this.maxFireworkInterval =
        this.getRandomValue(this.FIREWORK_INTERVAL_RANGE) | 0;
      this.fireworkInterval = this.maxFireworkInterval;
    }
  },
};
var TWIG = function (width, height, x, y, angle, theta) {
  this.width = width;
  this.height = height;
  this.x = x;
  this.y = y;
  this.angle = angle;
  this.theta = theta;
  this.rate = Math.min(width, height) / 500;
};
TWIG.prototype = {
  SHAKE_FREQUENCY: Math.PI / 300,
  MAX_LEVEL: 4,
  COLOR: "hsl(120, 60%, 1%)",

  renderBlock: function (context, x, y, length, level, angle) {
    context.save();
    context.translate(x, y);
    context.rotate(this.angle + angle * (level + 1));
    context.scale(this.rate, this.rate);
    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(0, -length);
    context.stroke();
    context.fill();

    if (level == this.MAX_LEVEL) {
      length = length / (1 - level / 10);

      context.save();
      context.beginPath();
      context.scale(1 - level / 10, 1 - level / 10);
      context.moveTo(0, -length);
      context.quadraticCurveTo(30, -length - 20, 0, -length - 80);
      context.quadraticCurveTo(-30, -length - 20, 0, -length);
      context.stroke();
      context.fill();
      context.restore();
      context.restore();
    } else {
      for (var i = -1; i <= 1; i += 2) {
        context.save();
        context.translate(0, -40);
        context.rotate((Math.PI / 3 - (Math.PI / 20) * level) * i);
        context.scale(1 - level / 10, 1 - level / 10);
        context.beginPath();
        context.moveTo(0, 0);
        context.lineTo(0, -length * 0.8);
        context.quadraticCurveTo(30, -length * 0.8 - 20, 0, -length * 0.8 - 80);
        context.quadraticCurveTo(-30, -length * 0.8 - 20, 0, -length * 0.8);
        context.stroke();
        context.fill();
        context.restore();
      }
      context.restore();
      level++;
      this.renderBlock(
        context,
        x + 40 * Math.sin(this.angle + angle * level),
        y - 40 * Math.cos(this.angle + angle * level),
        length,
        level,
        angle
      );
    }
  },
  render: function (context) {
    context.fillStyle = this.COLOR;
    context.strokeStyle = this.COLOR;
    context.lineWidth = 3;
    this.renderBlock(
      context,
      this.x,
      this.y,
      40,
      0,
      (Math.PI / 48) * Math.sin(this.theta)
    );
    this.theta += this.SHAKE_FREQUENCY;
    this.theta %= Math.PI * 2;
  },
};
var LEAF = function (width, height, renderer) {
  this.width = width;
  this.height = height;
  this.renderer = renderer;
  this.init();
};
LEAF.prototype = {
  OFFSET: 100,
  VELOCITY_Y: 3,
  COLOR: "hsl(120, 60%, 1%)",

  init: function () {
    this.x = this.renderer.getRandomValue({ min: 0, max: this.width });
    this.y = -this.OFFSET;
    this.vx =
      this.renderer.getRandomValue({ min: 0, max: 1 }) *
      (this.x <= this.width / 2 ? 1 : -1);
    this.vy = this.VELOCITY_Y;

    this.rate = this.renderer.getRandomValue({ min: 0.4, max: 0.8 });
    this.theta = this.renderer.getRandomValue({ min: 0, max: Math.PI * 2 });
    this.deltaTheta = this.renderer.getRandomValue({
      min: -Math.PI / 300,
      max: Math.PI / 300,
    });
  },
  render: function (context) {
    context.save();
    context.filleStyle = this.COLOR;
    context.translate(this.x, this.y);
    context.rotate(this.theta);
    context.scale(this.rate, this.rate);
    context.beginPath();
    context.moveTo(0, 0);
    context.quadraticCurveTo(30, -20, 0, -80);
    context.quadraticCurveTo(-30, -20, 0, 0);
    context.fill();
    context.restore();

    this.x += this.vx * this.rate;
    this.y += this.vy * this.rate;
    this.theta += this.deltaTheta;
    this.theta %= Math.PI * 2;

    return (
      this.y <= this.height + this.OFFSET &&
      this.x >= -this.OFFSET &&
      this.x <= this.width + this.OFFSET
    );
  },
};
var STAR = function (width, height, context, renderer) {
  this.width = width;
  this.height = height;
  this.renderer = renderer;
  this.init(context);
};
STAR.prototype = {
  RADIUS_RANGE: { min: 1, max: 4 },
  COUNT_RANGE: { min: 100, max: 1000 },
  DELTA_THETA: Math.PI / 30,
  DELTA_PHI: Math.PI / 50000,

  init: function (context) {
    this.x = this.renderer.getRandomValue({ min: 0, max: this.width });
    this.y = this.renderer.getRandomValue({ min: 0, max: this.height });
    this.radius = this.renderer.getRandomValue(this.RADIUS_RANGE);
    this.maxCount = this.renderer.getRandomValue(this.COUNT_RANGE) | 0;
    this.count = this.maxCount;
    this.theta = 0;
    this.phi = 0;

    this.gradient = context.createRadialGradient(0, 0, 0, 0, 0, this.radius);
    this.gradient.addColorStop(0, "hsla(220, 80%, 100%, 1)");
    this.gradient.addColorStop(0.1, "hsla(220, 80%, 80%, 1)");
    this.gradient.addColorStop(0.25, "hsla(220, 80%, 50%, 1)");
    this.gradient.addColorStop(1, "hsla(220, 80%, 30%, 0)");
  },
  render: function (context) {
    context.save();
    context.globalAlpha = Math.abs(Math.cos(this.theta));
    context.translate(this.width / 2, this.height / 2);
    context.rotate(this.phi);
    context.translate(this.x - this.width / 2, this.y - this.height / 2);
    context.beginPath();
    context.fillStyle = this.gradient;
    context.arc(0, 0, this.radius, 0, Math.PI * 2, false);
    context.fill();
    context.restore();

    if (--this.count == 0) {
      this.theta = Math.PI;
      this.count = this.maxCount;
    }
    if (this.theta > 0) {
      this.theta -= this.DELTA_THETA;
    }
    this.phi += this.DELTA_PHI;
    this.phi %= Math.PI / 2;
  },
};
var FIREWORK = function (width, height, renderer) {
  this.width = width;
  this.height = height;
  this.renderer = renderer;
  this.init();
};
FIREWORK.prototype = {
  COLOR: "hsl(%hue, 80%, 60%)",
  PARTICLE_COUNT: 300,
  DELTA_OPACITY: 0.01,
  RADIUS: 2,
  VELOCITY: -3,
  WAIT_COUNT_RANGE: { min: 30, max: 60 },
  THRESHOLD: 50,
  DELTA_THETA: Math.PI / 10,
  GRAVITY: 0.002,

  init: function () {
    this.setParameters();
    this.createParticles();
  },
  setParameters: function () {
    var hue = (256 * Math.random()) | 0;

    this.x = this.renderer.getRandomValue({
      min: this.width / 8,
      max: (this.width * 7) / 8,
    });
    this.y = this.renderer.getRandomValue({
      min: this.height / 4,
      max: this.height / 2,
    });
    this.x0 = this.x;
    this.y0 = this.height + this.RADIUS;
    this.color = this.COLOR.replace("%hue", hue);
    this.status = 0;
    this.theta = 0;
    this.waitCount = this.renderer.getRandomValue(this.WAIT_COUNT_RANGE);
    this.opacity = 1;
    this.velocity = this.VELOCITY;
    this.particles = [];
  },
  createParticles: function () {
    for (var i = 0, length = this.PARTICLE_COUNT; i < length; i++) {
      this.particles.push(new PARTICLE(this.x, this.y, this.renderer));
    }
  },
  getOpacity: function () {
    return this.status == 2 ? this.opacity : 0;
  },
  render: function (context) {
    switch (this.status) {
      case 0:
        context.save();
        context.fillStyle = this.color;
        context.globalCompositeOperation = "lighter";
        context.globalAlpha =
          this.y0 - this.y <= this.THRESHOLD
            ? (this.y0 - this.y) / this.THRESHOLD
            : 1;
        context.translate(this.x0 + Math.sin(this.theta) / 2, this.y0);
        context.scale(0.8, 2.4);
        context.beginPath();
        context.arc(0, 0, this.RADIUS, 0, Math.PI * 2, false);
        context.fill();
        context.restore();

        this.y0 += this.velocity;

        if (this.y0 <= this.y) {
          this.status = 1;
        }
        this.theta += this.DELTA_THETA;
        this.theta %= Math.PI * 2;
        this.velocity += this.GRAVITY;
        return true;
      case 1:
        if (--this.waitCount <= 0) {
          this.status = 2;
        }
        return true;
      case 2:
        context.save();
        context.globalCompositeOperation = "lighter";
        context.globalAlpha = this.opacity;
        context.fillStyle = this.color;

        for (var i = 0, length = this.particles.length; i < length; i++) {
          this.particles[i].render(context, this.opacity);
        }
        context.restore();
        this.opacity -= this.DELTA_OPACITY;
        return this.opacity > 0;
    }
  },
};
var PARTICLE = function (x, y, renderer) {
  this.x = x;
  this.y = y;
  this.renderer = renderer;
  this.init();
};
PARTICLE.prototype = {
  RADIUS: 1.5,
  VELOCITY_RANGE: { min: 0, max: 3 },
  GRAVITY: 0.02,
  FRICTION: 0.98,

  init: function () {
    var radian = Math.PI * 2 * Math.random(),
      velocity = (1 - Math.pow(Math.random(), 6)) * this.VELOCITY_RANGE.max,
      rate = Math.random();

    this.vx = velocity * Math.cos(radian) * rate;
    this.vy = velocity * Math.sin(radian) * rate;
  },
  render: function (context, opacity) {
    context.beginPath();
    context.arc(this.x, this.y, this.RADIUS, 0, Math.PI * 2, false);
    context.fill();

    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.GRAVITY;
    this.vx *= this.FRICTION;
    this.vy *= this.FRICTION;
  },
};
$(function () {
  RENDERER.init();
});
