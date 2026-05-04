document.addEventListener('DOMContentLoaded', () => {
  const isTouchDevice = () => window.innerWidth <= 1024;

  /* ── PC 전용: 수직 스크롤 → 수평 스크롤 변환 ── */
  const strips = document.querySelectorAll('.strip, .strip-about');
  strips.forEach(strip => {
    strip.addEventListener('wheel', (e) => {
      // 터치 기기(태블릿/모바일)에서는 시스템 기본 스크롤 사용
      if (isTouchDevice()) return;

      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        strip.scrollLeft += e.deltaY;
      }
    }, { passive: false });
  });

  /* ── 모바일/태블릿 전용: 탭으로 앞뒤 표지 전환 ── */
  if (isTouchDevice()) {
    document.querySelectorAll('.img').forEach(imgEl => {
      imgEl.addEventListener('click', (e) => {
        // 상세 페이지 이동이 아닌 이미지 영역 탭인 경우만 표지 전환
        if (e.target.tagName === 'A' || e.target.closest('a')) return;
        imgEl.classList.toggle('tapped');
      });
    });
  }

  /* ── 로고 클릭: 새로운 고정 레이아웃에 맞게 동작 ── */
  const logo = document.getElementById('logo');
  if (logo) {
    logo.addEventListener('click', (e) => {
      if (isTouchDevice()) {
        // 새로운 레이아웃에서는 메뉴가 고정되어 있으므로 토글 없이 메인 이동(기본동작) 허용
        return;
      }
    });
  }
});
