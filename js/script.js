document.addEventListener('DOMContentLoaded', () => {
  const strips = document.querySelectorAll('.strip, .strip-about');
  
  strips.forEach(strip => {
    strip.addEventListener('wheel', (e) => {
      // Only map scroll explicitly to horizontal when on PC
      if (window.innerWidth <= 768) return;

      // If the scroll is mostly vertical, let's translate it to horizontal
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        strip.scrollLeft += e.deltaY;
      }
    }, { passive: false });
  });

  const logo = document.getElementById('logo');
  if (logo) {
    logo.addEventListener('click', (e) => {
      if (window.innerWidth <= 768) {
        e.preventDefault();
        document.body.classList.toggle('menu-open');
      }
    });
  }
});
