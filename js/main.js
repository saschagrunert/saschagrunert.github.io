"use strict";

(function () {
  var header = document.querySelector(".header-section");
  var menu = document.querySelector(".menu-list");

  // Sticky header via IntersectionObserver
  var intro = document.querySelector(".intro-section");
  var stickyObserver = new IntersectionObserver(
    function (entries) {
      if (entries[0].isIntersecting) {
        header.classList.remove("sticky");
      } else {
        header.classList.add("sticky");
      }
    },
    { rootMargin: "-70px 0px 0px 0px" },
  );
  stickyObserver.observe(intro);

  // Mobile menu toggle
  document.querySelector(".responsive").addEventListener("click", function (e) {
    header.classList.toggle("bgc");
    menu.classList.toggle("open");
    e.preventDefault();
  });

  document.querySelectorAll(".menu-list li a").forEach(function (link) {
    link.addEventListener("click", function () {
      if (window.innerWidth < 768) {
        menu.classList.remove("open");
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
  var reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (reducedMotion) {
    el.textContent = strings[1];
    document.querySelector(".typed-cursor").style.display = "none";
  } else {
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
  }
})();
