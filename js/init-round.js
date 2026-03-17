"use strict";

(function () {
  var TWO_PI = Math.PI * 2;
  var MAX_PARTICLES = 280;
  var COLOURS = [
    "#69D2E7",
    "#A7DBD8",
    "#E0E4CC",
    "#F38630",
    "#FA6900",
    "#FF4E50",
    "#F9D423",
  ];

  function random(min, max) {
    if (Array.isArray(min)) return min[Math.floor(Math.random() * min.length)];
    if (max === undefined) {
      max = min;
      min = 0;
    }
    return min + Math.random() * (max - min);
  }

  function Particle(x, y, radius) {
    this.alive = true;
    this.radius = radius || 10;
    this.wander = 0.15;
    this.theta = random(TWO_PI);
    this.drag = 0.92;
    this.color = "#fff";
    this.x = x || 0;
    this.y = y || 0;
    this.vx = 0;
    this.vy = 0;
  }

  Particle.prototype.move = function () {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= this.drag;
    this.vy *= this.drag;
    this.theta += random(-0.5, 0.5) * this.wander;
    this.vx += Math.sin(this.theta) * 0.1;
    this.vy += Math.cos(this.theta) * 0.1;
    this.radius *= 0.96;
    this.alive = this.radius > 0.5;
  };

  Particle.prototype.draw = function (ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, TWO_PI);
    ctx.fillStyle = this.color;
    ctx.fill();
  };

  var canvas = document.getElementById("round");
  var ctx = canvas.getContext("2d");
  var particles = [];
  var pool = [];
  var mouseX = 0;
  var mouseY = 0;
  var isMoving = false;
  var moveTimer = null;

  function resize() {
    var dpr = window.devicePixelRatio || 1;
    var parent = canvas.parentElement;
    canvas.width = parent.offsetWidth * dpr;
    canvas.height = parent.offsetHeight * dpr;
    canvas.style.width = parent.offsetWidth + "px";
    canvas.style.height = parent.offsetHeight + "px";
    ctx.scale(dpr, dpr);
  }

  function spawn(x, y) {
    if (particles.length >= MAX_PARTICLES) pool.push(particles.shift());
    var p = pool.length ? pool.pop() : new Particle();
    p.alive = true;
    p.radius = random(5, 40);
    p.wander = random(0.5, 2.0);
    p.color = random(COLOURS);
    p.drag = random(0.9, 0.99);
    p.x = x;
    p.y = y;
    var theta = random(TWO_PI);
    var force = random(2, 8);
    p.vx = Math.sin(theta) * force;
    p.vy = Math.cos(theta) * force;
    particles.push(p);
  }

  function loop() {
    var w = canvas.offsetWidth;
    var h = canvas.offsetHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (isMoving) {
      var max = Math.floor(random(1, 4));
      for (var j = 0; j < max; j++) {
        spawn(mouseX, mouseY);
      }
    }

    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      if (p.alive) {
        p.move();
      } else {
        pool.push(particles.splice(i, 1)[0]);
      }
    }

    ctx.globalCompositeOperation = "lighter";
    for (var k = particles.length - 1; k >= 0; k--) {
      particles[k].draw(ctx);
    }

    requestAnimationFrame(loop);
  }

  resize();
  window.addEventListener("resize", resize);

  // Initial particles
  var cw = canvas.offsetWidth * 0.5;
  var ch = canvas.offsetHeight * 0.5;
  for (var i = 0; i < 20; i++) {
    spawn(cw + random(-100, 100), ch + random(-100, 100));
  }

  canvas.addEventListener("mousemove", function (e) {
    var rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
    isMoving = true;
    clearTimeout(moveTimer);
    moveTimer = setTimeout(function () {
      isMoving = false;
    }, 100);
  });

  canvas.addEventListener("mouseleave", function () {
    isMoving = false;
  });

  canvas.addEventListener("touchmove", function (e) {
    var rect = canvas.getBoundingClientRect();
    for (var t = 0; t < e.touches.length; t++) {
      mouseX = e.touches[t].clientX - rect.left;
      mouseY = e.touches[t].clientY - rect.top;
      var max = Math.floor(random(1, 4));
      for (var j = 0; j < max; j++) {
        spawn(mouseX, mouseY);
      }
    }
  });

  loop();
})();
