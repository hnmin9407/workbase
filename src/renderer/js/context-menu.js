/**
 * 페이지에 열려있는 모든 컨텍스트 메뉴를 닫습니다.
 */
function hideAllContextMenus() {
  document.querySelectorAll(".context-menu.show").forEach((menu) => {
    menu.classList.remove("show");
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

  // [수정] 이벤트 위임: document 전체에 이벤트 리스너를 설정합니다.
  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("[data-context-menu-target]");
    const clickedInsideMenu = e.target.closest(".context-menu");

    // [수정] 메뉴 내부의 빈 공간을 클릭한 경우는 무시합니다.
    if (clickedInsideMenu && e.target === clickedInsideMenu) {
      return;
    }

    // 어떤 좌클릭이든 항상 모든 컨텍스트 메뉴를 먼저 닫습니다.
    hideAllContextMenus();

    // 만약 클릭된 요소가 트리거이고, 프로젝트 메뉴가 아니라면 새 메뉴를 엽니다.
    if (trigger && trigger.dataset.contextMenuTarget !== "project-edit") {
      const menuId = trigger.dataset.contextMenuTarget;
      const menu = document.getElementById(menuId);
      if (menu) openMenu(e, menu);
    } else if (!trigger && !clickedInsideMenu) {
      // 메뉴 외부를 클릭했을 때도 메뉴를 닫습니다 (위에서 이미 처리됨).
      hideAllContextMenus();
    }
  });

  document.addEventListener("contextmenu", (e) => {
    const trigger = e.target.closest("[data-context-menu-target]");

    // 트리거 위에서 우클릭했을 때만 메뉴를 엽니다.
    if (trigger) {
      e.preventDefault();
      e.stopPropagation();
      const menuId = trigger.dataset.contextMenuTarget;
      const menu = document.getElementById(menuId);
      if (menu) {
        openMenu(e, menu);
      }
    }
  });

  /**
   * [추가] 메뉴를 열고 위치를 지정하는 헬퍼 함수
   * @param {MouseEvent} event
   * @param {HTMLElement} menu
   */
  function openMenu(event, menu) {
    const isAlreadyOpen = menu.classList.contains("show");

    // 다른 메뉴들을 모두 닫습니다.
    hideAllContextMenus();

    // 이미 열려있던 메뉴의 트리거를 다시 클릭한 게 아니라면 메뉴를 엽니다.
    if (!isAlreadyOpen) {
      menu.classList.add("show");
      // [수정] 브라우저가 .show 스타일을 렌더링하고 메뉴 크기를 계산할 시간을 줍니다.
      // requestAnimationFrame을 사용하여 다음 프레임에 위치를 계산합니다.
      requestAnimationFrame(() => {
        positionContextMenu(event, menu);
      });
    }
  }
  console.log("✅ Context menu system initialized with event delegation.");
}
