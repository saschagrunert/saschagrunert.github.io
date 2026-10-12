"use strict";

(function () {
  var TWO_PI = Math.PI * 2;
  var MAX_PARTICLES = 280;
  var AMBIENT_RATE = 0.03; // ambient particles spawned per 60 Hz frame
  var SPRITE_SIZE = 64;
  var COLOURS = [
    "#69D2E7",
    "#A7DBD8",
    "#E0E4CC",
    "#F38630",
    "#FA6900",
    "#FF4E50",
    "#F9D423",
  ].map(function (hex) {
    return [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16),
    ].join(", ");
  });

  function random(min, max) {
    if (Array.isArray(min)) return min[Math.floor(Math.random() * min.length)];
    if (max === undefined) {
      max = min;
      min = 0;
    }
    return min + Math.random() * (max - min);
  }

  // One pre-rendered glow per colour; particles draw it scaled instead of
  // building a gradient each frame.
  function makeSprite(rgb) {
    var c = document.createElement("canvas");
    c.width = c.height = SPRITE_SIZE;
    var g = c.getContext("2d");
    var half = SPRITE_SIZE / 2;
    var gradient = g.createRadialGradient(half, half, 0, half, half, half);
    gradient.addColorStop(0, "rgba(" + rgb + ", 0.55)");
    gradient.addColorStop(0.45, "rgba(" + rgb + ", 0.22)");
    gradient.addColorStop(1, "rgba(" + rgb + ", 0)");
    g.fillStyle = gradient;
    g.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);
    return c;
  }

  function Particle() {
    this.reset(0, 0, 10, 0, 120, 0.15);
  }

  Particle.prototype.reset = function (x, y, radius, force, frames, wander) {
    this.alive = true;
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.wander = wander;
    this.theta = random(TWO_PI);
    this.drag = random(0.94, 0.985);
    this.colour = Math.floor(random(COLOURS.length));
    this.life = 1;
    this.age = 0;
    this.decay = 1 / frames;
    this.vx = Math.sin(this.theta) * force;
    this.vy = Math.cos(this.theta) * force;
  };

  // dt is the elapsed time in 60 Hz frames, so the effect runs at the same
  // speed regardless of the display refresh rate.
  Particle.prototype.move = function (dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    var drag = Math.pow(this.drag, dt);
    this.vx *= drag;
    this.vy *= drag;
    this.theta += random(-0.5, 0.5) * this.wander * dt;
    this.vx += Math.sin(this.theta) * 0.05 * dt;
    this.vy += Math.cos(this.theta) * 0.05 * dt;
    this.life -= this.decay * dt;
    this.age += dt;
    this.alive = this.life > 0;
  };

  Particle.prototype.draw = function (ctx, sprites, strokes) {
    // Grow in over the first few frames, then shrink and fade gently.
    var t = this.life;
    var grow = Math.min(1, this.age / 8);
    grow = 1 - (1 - grow) * (1 - grow);
    var r = this.radius * grow * (0.35 + 0.65 * t * (2 - t));
    var alpha = grow * t * t * (3 - 2 * t);

    // Short motion streak behind fast particles, covering the distance
    // travelled in the last four 60 Hz frames.
    if (this.vx * this.vx + this.vy * this.vy > 1) {
      ctx.globalAlpha = alpha * 0.12;
      ctx.strokeStyle = strokes[this.colour];
      ctx.lineWidth = r * 0.6;
      ctx.beginPath();
      ctx.moveTo(this.x - this.vx * 4, this.y - this.vy * 4);
      ctx.lineTo(this.x, this.y);
      ctx.stroke();
    }

    ctx.globalAlpha = alpha;
    ctx.drawImage(sprites[this.colour], this.x - r, this.y - r, r * 2, r * 2);
  };

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var canvas = document.getElementById("round");
  var ctx = canvas.getContext("2d");
  var sprites = COLOURS.map(makeSprite);
  var strokes = COLOURS.map(function (rgb) {
    return "rgb(" + rgb + ")";
  });
  var particles = [];
  var pool = [];
  var width = 0;
  var height = 0;
  var dpr = 0;
  var mouseX = 0;
  var mouseY = 0;
  var isMoving = false;
  var moveTimer = null;
  var lastTouch = -Infinity;
  var isVisible = true;
  var animationId = null;
  var lastTime = 0;
  var burstBudget = 0;
  var ambientBudget = 0;

  function resize() {
    var parent = canvas.parentElement;
    var w = parent.offsetWidth;
    var h = parent.offsetHeight;
    var ratio = window.devicePixelRatio || 1;
    // Setting the size clears the canvas, so skip it when nothing changed
    // (mobile browsers fire resize whenever the URL bar shows or hides).
    if (w === width && h === height && ratio === dpr) return;
    width = w;
    height = h;
    dpr = ratio;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
  }

  function spawn(x, y, radius, force, frames, wander) {
    if (particles.length >= MAX_PARTICLES) pool.push(particles.shift());
    var p = pool.length ? pool.pop() : new Particle();
    p.reset(x, y, radius, force, frames, wander);
    particles.push(p);
  }

  function burst(x, y) {
    spawn(
      x,
      y,
      random(8, 40),
      random(0.8, 3.2),
      random(70, 150),
      random(0.5, 2),
    );
  }

  function ambient() {
    spawn(
      random(width),
      random(height),
      random(6, 24),
      random(0.1, 0.5),
      random(240, 420),
      random(0.1, 0.4),
    );
  }

  function loop(now) {
    if (!isVisible) {
      animationId = null;
      lastTime = 0;
      return;
    }

    if (now === undefined) now = performance.now();
    var dt = lastTime
      ? Math.min(Math.max(0, now - lastTime) / (1000 / 60), 3)
      : 1;
    lastTime = now;

    ctx.clearRect(0, 0, width, height);

    // Spawn rates are budgets per 60 Hz frame so that fast displays do not
    // round them down to nothing.
    if (isMoving) {
      burstBudget += random(1, 2) * dt;
      while (burstBudget >= 1) {
        burst(mouseX, mouseY);
        burstBudget -= 1;
      }
    } else {
      burstBudget = 0;
    }

    ambientBudget += AMBIENT_RATE * dt;
    while (ambientBudget >= 1) {
      ambient();
      ambientBudget -= 1;
    }

    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.move(dt);
      if (!p.alive) pool.push(particles.splice(i, 1)[0]);
    }

    ctx.globalCompositeOperation = "lighter";
    for (var k = particles.length - 1; k >= 0; k--) {
      particles[k].draw(ctx, sprites, strokes);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";

    animationId = requestAnimationFrame(loop);
  }

  resize();
  window.addEventListener("resize", resize);

  // Pause animation when canvas is not visible
  var observer = new IntersectionObserver(
    function (entries) {
      isVisible = entries[0].isIntersecting;
      if (isVisible && !animationId) {
        animationId = requestAnimationFrame(loop);
      }
    },
    { threshold: 0 },
  );
  observer.observe(canvas);

  // Initial particles
  for (var i = 0; i < 20; i++) {
    burst(width * 0.5 + random(-100, 100), height * 0.5 + random(-100, 100));
  }
  for (var a = 0; a < 12; a++) {
    ambient();
  }

  function stir(clientX, clientY) {
    var rect = canvas.getBoundingClientRect();
    mouseX = clientX - rect.left;
    mouseY = clientY - rect.top;
    isMoving = true;
    clearTimeout(moveTimer);
    moveTimer = setTimeout(function () {
      isMoving = false;
    }, 100);
  }

  function stop() {
    isMoving = false;
    clearTimeout(moveTimer);
  }

  canvas.addEventListener("mousemove", function (e) {
    // Browsers emulate mouse events after a tap; ignore those.
    if (performance.now() - lastTouch < 500) return;
    stir(e.clientX, e.clientY);
  });
  canvas.addEventListener("mouseleave", stop);

  // Touch: a finger moving over the hero behaves like the mouse cursor. The
  // effect follows the first remaining finger until all are lifted.
  function onTouch(e) {
    lastTouch = performance.now();
    var t = e.touches[0];
    if (t) {
      stir(t.clientX, t.clientY);
    } else {
      stop();
    }
  }
  canvas.addEventListener("touchstart", onTouch, { passive: true });
  canvas.addEventListener("touchmove", onTouch, { passive: true });
  canvas.addEventListener("touchend", onTouch, { passive: true });
  canvas.addEventListener("touchcancel", onTouch, { passive: true });

  loop();
})();
