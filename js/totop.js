(function() {
  'use strict';

  var rocket = document.getElementById('rocket');
  if (!rocket) return;

  var ticking = false;
  function updateVisibility() {
    rocket.classList.toggle('show', window.scrollY > 500);
    ticking = false;
  }

  window.addEventListener('scroll', function() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateVisibility);
  }, { passive: true });

  rocket.addEventListener('click', function(event) {
    event.preventDefault();
    rocket.classList.add('launch');
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({
      top: 0,
      behavior: reduceMotion ? 'auto' : 'smooth'
    });
    window.setTimeout(function() {
      rocket.classList.remove('show', 'launch');
    }, reduceMotion ? 0 : 450);
  });

  updateVisibility();
})();
