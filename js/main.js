"use strict";

(function () {
  // Sticky header
  var header = document.querySelector(".header-section");
  window.addEventListener("scroll", function () {
    if (window.scrollY > 70) {
      header.classList.add("sticky");
    } else {
      header.classList.remove("sticky");
    }
  });

  // Mobile menu toggle
  document.querySelector(".responsive").addEventListener("click", function (e) {
    var menu = document.querySelector(".menu-list");
    header.classList.toggle("bgc");
    if (menu.style.display === "block") {
      menu.style.display = "";
    } else {
      menu.style.display = "block";
    }
    e.preventDefault();
  });

  document.querySelectorAll(".menu-list li a").forEach(function (link) {
    link.addEventListener("click", function () {
      if (window.innerWidth < 768) {
        document.querySelector(".menu-list").style.display = "";
        header.classList.remove("bgc");
      }
    });
  });

  // Typed text effect
  var strings = [
    "Hi there",
    "I'm Sascha Grunert",
    "Graduate Engineer for Information Technology",
    "From Leipzig, Germany",
  ];
  var el = document.querySelector(".element");
  var stringIndex = 0;
  var charIndex = 0;
  var isDeleting = false;
  var typeSpeed = 10;
  var backSpeed = 5;
  var backDelay = 2000;

  function type() {
    var current = strings[stringIndex];

    if (isDeleting) {
      el.textContent = current.substring(0, charIndex - 1);
      charIndex--;
    } else {
      el.textContent = current.substring(0, charIndex + 1);
      charIndex++;
    }

    var delay = isDeleting ? backSpeed : typeSpeed;

    if (!isDeleting && charIndex === current.length) {
      delay = backDelay;
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      stringIndex = (stringIndex + 1) % strings.length;
      delay = 200;
    }

    setTimeout(type, delay);
  }

  type();
})();
