/**
 * 페이지에 열려있는 모든 컨텍스트 메뉴를 닫습니다.
 */
function hideAllContextMenus() {
  document.querySelectorAll('.context-menu.show').forEach((menu) => {
    menu.classList.remove('show');
  });
}

/**
 * [수정] 메뉴를 마우스 클릭 위치 기준으로 올바르게 위치시킵니다.
 * @param {MouseEvent} event - 클릭 이벤트 객체 (e)
 * @param {HTMLElement} menu - 표시할 메뉴 요소
 */
function positionContextMenu(event, menu) {
  const { clientX, clientY } = event; // 👈 마우스 커서의 X, Y 좌표
  const { offsetWidth: menuWidth, offsetHeight: menuHeight } = menu;
  const { innerWidth, innerHeight } = window;
  const margin = 8; // 👈 화면 가장자리로부터의 최소 여백

  // --- 1. 수평 (Left) 위치 계산 ---
  // 기본: 커서의 우측
  let left = clientX + margin;
  // 화면 우측을 벗어나면
  if (left + menuWidth > innerWidth - margin) {
    // 커서의 좌측으로 이동
    left = clientX - menuWidth - margin;
  }
  // (그래도) 화면 좌측을 벗어나면 (창이 너무 좁을 때)
  if (left < margin) {
    left = margin;
  }

  // --- 2. 수직 (Top) 위치 계산 (사용자 요청: 위쪽 우선) ---
  // [우선순위 1] 커서의 우측 "위"
  let top = clientY - menuHeight - margin;
  // 화면 상단을 벗어나면
  if (top < margin) {
    // [우선순위 2] 커서의 우측 "아래"
    top = clientY + margin;
  }
  // (그래도) 화면 하단을 벗어나면 (창이 너무 짧을 때)
  if (top + menuHeight > innerHeight - margin) {
    top = innerHeight - menuHeight - margin; // 화면 하단에 붙임
  }

  // 3. 최종 위치 적용
  menu.style.top = `${top}px`;
  menu.style.left = `${left}px`;
}

/**
 * 모든 'data-context-menu-target' 속성을 가진 트리거를 찾아
 * 클릭 이벤트를 바인딩합니다.
 */
function initContextMenus() {
  console.log("Initializing context menus...");

  // 1. 화면의 아무 곳이나 클릭하면 모든 메뉴를 닫습니다.
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-context-menu-target]');
    const menu = e.target.closest('.context-menu');
    
    if (!trigger && !menu) {
      hideAllContextMenus();
    }
  });

  // 2. 모든 트리거 요소를 찾습니다.
  const triggers = document.querySelectorAll('[data-context-menu-target]');
  console.log(`Found ${triggers.length} context menu triggers.`);

  triggers.forEach(trigger => {
    const menuId = trigger.dataset.contextMenuTarget;
    const menu = document.getElementById(menuId);

    if (!menu) {
      console.warn(`Context menu target '${menuId}' not found for trigger:`, trigger);
      return;
    }

    // 3. 각 트리거에 클릭 이벤트 리스너를 추가합니다.
    trigger.addEventListener('click', (e) => {
      e.stopPropagation(); // document 클릭 이벤트로 전파되는 것을 막음

      const isAlreadyOpen = menu.classList.contains('show');

      // 다른 메뉴들을 모두 닫습니다.
      hideAllContextMenus();

      if (!isAlreadyOpen) {
        // 이 메뉴를 엽니다.
        menu.classList.add('show');
        // 'show'가 된 후에 위치를 계산해야 정확한 크기를 알 수 있습니다.
        // [수정] 👈 trigger 대신 이벤트 객체 e를 전달
        positionContextMenu(e, menu);
      }
    });
  });
}