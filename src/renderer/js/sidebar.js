// sidebar.js

function initSidebar() {
  // ===================================================================
  // I. 요소 선택 (Element Selection)
  // ===================================================================
  const mainContainer = document.querySelector(".main");
  const sidebarComponent = document.getElementById("sidebar-component");

  // Popup Elements
  const popupOverlay = document.querySelector(".popup-overlay");
  const groupAddPopup = document.getElementById("group-add-popup");
  const projectAddPopup = document.getElementById("project-add-popup");

  // Button Elements
  const addGroupConfirmBtn = document.getElementById("confirm-group-add");
  const addProjectConfirmBtn = document.getElementById("confirm-project-add");

  // [💡 추가] 컨텍스트 메뉴 요소 (main.html에 있는 요소들)
  const projectContextMenu = document.getElementById("project-context-menu");
  const renameProjectBtn = document.getElementById("rename-project-btn");
  const deleteProjectBtn = document.getElementById("delete-project-btn");

  let activeProjectGroupWrap = null; // 프로젝트를 추가할 현재 그룹
  let activeProjectElement = null; // [💡 추가] 우클릭으로 선택된 프로젝트 요소

  // 필수 요소 확인
  if (
    !mainContainer ||
    !sidebarComponent ||
    !popupOverlay ||
    !groupAddPopup ||
    !projectAddPopup
  ) {
    console.error("필수 UI 요소를 찾을 수 없습니다. 스크립트를 중단합니다.");
    return;
  }

  // ===================================================================
  // II. 팝업 관리 함수 (Popup Management Functions)
  // ===================================================================

  // ✅ ================== 가장 중요한 수정 부분 ==================
  function openPopup(popupElement) {
    // 💡 방어 코드: 이미 팝업이 열려있으면 아무 동작도 하지 않고 즉시 종료합니다.
    // 💡 이것이 '먹통' 현상을 막는 가장 확실하고 근본적인 해결책입니다.
    if (document.querySelector(".popup.show")) {
      return;
    }
    // ✅ =======================================================

    if (popupElement) {
      popupOverlay.classList.add("show");
      popupElement.classList.add("show");
      const input = popupElement.querySelector("input");
      if (input) input.focus();
    }
  }

  function closePopups() {
    popupOverlay.classList.remove("show");
    document.querySelectorAll(".popup.show").forEach((p) => {
      p.classList.remove("show");
      const input = p.querySelector("input");
      if (input) input.value = "";
    });
  }

  // ===================================================================
  // III. 사이드바 접기/펼치기 (Sidebar Folding)
  // ===================================================================
  const handleSidebarFold = (shouldFold) => {
    mainContainer.classList.toggle("sidebar-folded", shouldFold);
  };

  const MOBILE_BREAKPOINT = 768;
  let isMobileView = window.innerWidth <= MOBILE_BREAKPOINT;
  handleSidebarFold(isMobileView); // 초기 로드 시 설정

  window.addEventListener("resize", () => {
    const currentIsMobile = window.innerWidth <= MOBILE_BREAKPOINT;
    if (currentIsMobile !== isMobileView) {
      isMobileView = currentIsMobile;
      handleSidebarFold(isMobileView);
    }
  });

  // ===================================================================
  // IV. 그룹/프로젝트 기능 (Group/Project Functions)
  // ===================================================================
  function toggleGroup(wrapElement) {
    const childWrap = wrapElement.querySelector(".child-wrap");
    if (!childWrap) return;

    const isCollapsed = wrapElement.classList.toggle("group-collapsed");
    childWrap.style.height = isCollapsed
      ? "0px"
      : `${childWrap.scrollHeight}px`;
  }

  function createGroupElement(groupName) {
    const useTag = (iconId) =>
      `<use href="../../assets/icons/icons.svg#${iconId}"></use>`;

    const newMenuContainer = document.createElement("div");
    newMenuContainer.className = "menu";

    const wrapDiv = document.createElement("div");
    // [💡 수정] "group-collapsed" 클래스를 제거하여 기본적으로 열려있도록 함
    wrapDiv.className = "wrap";

    wrapDiv.innerHTML = `
      <div class="group" data-tooltip="${groupName}" data-direction="right">
        <div class="left">
          <svg class="icon-group delayed-icon-fold">${useTag(
            "icon-folder-open"
          )}</svg>
          <span class="group-name"></span>
        </div>
        <div class="right">
          <button class="sidebar_function delayed-icon add-project-btn" aria-label="프로젝트 추가">
            <svg class="icon-item">${useTag("icon-add-project")}</svg>
          </button>
          <button class="sidebar_function delayed-icon group-toggle-btn" aria-label="그룹 토글">
            <svg class="icon-item">${useTag("icon-down")}</svg>
          </button>
        </div>
      </div>
      <div class="child-wrap"></div>
    `;
    wrapDiv.querySelector(".group-name").textContent = groupName;
    newMenuContainer.appendChild(wrapDiv);
    return newMenuContainer;
  }

  function addNewGroup() {
    const input = groupAddPopup.querySelector("input");
    const groupName = input.value.trim();
    if (!groupName) return;

    // 1. (수정된) createGroupElement 함수로 새 그룹 요소를 '열린' 상태로 생성
    const newGroupElement = createGroupElement(groupName);

    // [💡 추가] "기본 프로젝트" 요소 생성
    const defaultProject = createProjectElement("기본 프로젝트");
    const childWrap = newGroupElement.querySelector(".child-wrap");

    if (childWrap) {
      // 2. "기본 프로젝트"를 .child-wrap에 추가
      childWrap.appendChild(defaultProject);
    } else {
      console.error("Error: Could not find .child-wrap in new group element.");
    }

    // 3. 새 그룹을 DOM에 추가 (이전 요청사항)
    const topContainer = sidebarComponent.querySelector(".top");

    if (topContainer) {
      topContainer.appendChild(newGroupElement);
    } else {
      // .top을 찾지 못할 경우 비상 로직
      console.error(
        "Error: .top 컨테이너를 찾을 수 없습니다. 비상 로직을 실행합니다."
      );
      const lineSeparator = sidebarComponent.querySelector(".line");
      if (lineSeparator) {
        lineSeparator.before(newGroupElement);
      } else {
        const sidebarBottom = sidebarComponent.querySelector(".bottom");
        if (sidebarBottom) {
          sidebarBottom.before(newGroupElement);
        } else {
          console.error(
            "Error: Could not find an insertion point (.line or .bottom) for the new group."
          );
          return;
        }
      }
    }

    // [💡 추가] DOM에 추가된 후, .child-wrap의 실제 높이(scrollHeight)를 계산하여
    // style.height에 적용해야 CSS transition 애니메이션이 작동합니다.
    if (childWrap) {
      childWrap.style.height = `${childWrap.scrollHeight}px`;
    }

    if (typeof initTooltip === "function") {
      initTooltip();
    }
    closePopups();
  }

  function createProjectElement(projectName) {
    const projectDiv = document.createElement("div");
    projectDiv.className = "child";
    projectDiv.dataset.tooltip = projectName;
    projectDiv.dataset.direction = "right";

    const leftDiv = document.createElement("div");
    leftDiv.className = "left";

    const statusDiv = document.createElement("div");
    statusDiv.className = "status delayed-icon-fold";
    statusDiv.innerHTML = '<div class="dot"></div>';

    const span = document.createElement("span");
    span.textContent = projectName;

    leftDiv.appendChild(statusDiv);
    leftDiv.appendChild(span);
    projectDiv.appendChild(leftDiv);

    return projectDiv;
  }

  function addNewProject() {
    if (!activeProjectGroupWrap) return;
    const input = projectAddPopup.querySelector("input");
    const projectName = input.value.trim();
    if (!projectName) return;

    const childWrap = activeProjectGroupWrap.querySelector(".child-wrap");
    if (!childWrap) return;

    const newProject = createProjectElement(projectName);
    childWrap.appendChild(newProject);

    // [💡 수정된 부분]
    // 1. 현재 그룹이 닫혀 있는지 확인합니다.
    const isCurrentlyCollapsed =
      activeProjectGroupWrap.classList.contains("group-collapsed");

    if (isCurrentlyCollapsed) {
      // 2. 닫혀 있다면, toggleGroup 함수를 호출하여 그룹을 엽니다.
      // (toggleGroup 함수가 알아서 높이도 조절해 줍니다.)
      toggleGroup(activeProjectGroupWrap);
    } else {
      // 3. 이미 열려 있었다면, 새 프로젝트가 포함된 높이로 다시 계산하여 적용합니다.
      childWrap.style.height = `${childWrap.scrollHeight}px`;
    }
    // [여기까지 수정]

    if (typeof initTooltip === "function") initTooltip();
    closePopups();
  }

// ===================================================================
  // [💡 추가] VI. 컨텍스트 메뉴 관리 (Context Menu Management)
  // ===================================================================

  /**
   * 컨텍스트 메뉴를 엽니다. (우클릭 시)
   */
  function openContextMenu(event) {
    // 1. 기본 브라우저 우클릭 메뉴 차단
    event.preventDefault();

    // 2. 다른 팝업(그룹 추가 등)이 열려있으면 무시
    if (document.querySelector(".popup.show")) {
      return;
    }
    
    // 3. 우클릭한 대상이 .child(프로젝트)가 맞는지 확인
    const targetProject = event.target.closest('.child');
    if (!targetProject) return; 

    // 4. 클릭한 프로젝트를 전역 변수에 저장
    activeProjectElement = targetProject;

    // 5. 메뉴 위치를 마우스 좌표로 설정
    projectContextMenu.style.left = `${event.clientX}px`;
    projectContextMenu.style.top = `${event.clientY}px`;
    projectContextMenu.classList.add("show");
  }

  /**
   * 컨텍스트 메뉴를 닫습니다.
   */
  function closeContextMenu() {
    projectContextMenu.classList.remove("show");
    activeProjectElement = null; // 선택 해제
  }

  /**
   * 프로젝트 이름 변경 (기능 구현 필요)
   */
  function renameProject() {
    if (!activeProjectElement) return;
    const currentName = activeProjectElement.querySelector('span').textContent;
    
    // 💡 실제 구현: 여기서 이름 변경용 팝업(prompt 또는 커스텀 팝업)을 열어야 합니다.
    alert(`'${currentName}' 이름 바꾸기 (구현 필요)`);
    
    // 예시:
    // const newName = prompt("새 이름을 입력하세요", currentName);
    // if (newName && newName.trim()) {
    //   activeProjectElement.querySelector('span').textContent = newName.trim();
    //   activeProjectElement.dataset.tooltip = newName.trim();
    // }
    
    closeContextMenu();
  }

  /**
   * 프로젝트 삭제
   */
  function deleteProject() {
    if (!activeProjectElement) return;
    
    const childWrap = activeProjectElement.parentElement;
    const groupWrap = childWrap.closest('.wrap');
    
    // 1. DOM에서 요소 삭제
    activeProjectElement.remove();
    
    // 2. 부모(.child-wrap)의 높이를 다시 계산 (애니메이션)
    if (groupWrap && !groupWrap.classList.contains("group-collapsed")) {
       childWrap.style.height = `${childWrap.scrollHeight}px`;
    }
    
    closeContextMenu();
  }
  
// ===================================================================
  // V. 이벤트 리스너 연결 (Event Listener Attachment)
  // ===================================================================
  if (sidebarComponent) {
    sidebarComponent.addEventListener('click', (event) => {
      const target = event.target;
      const groupWrap = target.closest('.wrap');

      if (target.closest('#sidebar-fold-button')) {
        handleSidebarFold(!mainContainer.classList.contains("sidebar-folded"));
      } else if (target.closest('#add-group')) {
        openPopup(groupAddPopup);
      } else if (target.closest('.group-toggle-btn') && groupWrap) {
        toggleGroup(groupWrap);
      } else if (target.closest('.add-project-btn') && groupWrap) {
        activeProjectGroupWrap = groupWrap;
        openPopup(projectAddPopup);
      } else if (target.closest('.group') && mainContainer.classList.contains("sidebar-folded") && groupWrap) {
        toggleGroup(groupWrap);
      }
    });

    // [💡 추가] 사이드바에 'contextmenu' (우클릭) 이벤트 리스너 추가
    sidebarComponent.addEventListener('contextmenu', openContextMenu);
  }

  // [💡 추가] 컨텍스트 메뉴 버튼들에 클릭 리스너 연결
  if (renameProjectBtn) renameProjectBtn.addEventListener('click', renameProject);
  if (deleteProjectBtn) deleteProjectBtn.addEventListener('click', deleteProject);


  // 팝업 관련 이벤트 (컨텍스트 메뉴 닫기 추가)
  if (popupOverlay) {
    popupOverlay.addEventListener("click", (e) => {
      if (e.target === popupOverlay) {
        closePopups();
        closeContextMenu(); // [💡 추가]
      }
    });
  }
  
  document.querySelectorAll(".popup-close").forEach(btn => {
    btn.addEventListener("click", () => {
      closePopups();
      closeContextMenu(); // [💡 추가]
    });
  });

  if (addGroupConfirmBtn) addGroupConfirmBtn.addEventListener("click", addNewGroup);
  if (addProjectConfirmBtn) addProjectConfirmBtn.addEventListener("click", addNewProject);

  if (groupAddPopup) {
    groupAddPopup.querySelector('input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') addNewGroup();
    });
  }
  if (projectAddPopup) {
    projectAddPopup.querySelector('input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') addNewProject();
    });
  }

  // 팝업 내부 클릭 시 이벤트 전파 방지
  document.querySelectorAll('.popup').forEach(popup => {
    popup.addEventListener('click', (event) => {
      event.stopPropagation();
      closeContextMenu(); // [💡 추가] (다른 팝업 클릭 시 컨텍스트 메뉴 닫기)
    });
  });
  
  // [💡 추가] 화면의 다른 곳을 클릭하면 컨텍스트 메뉴 닫기
  window.addEventListener('click', (e) => {
    // 클릭한 곳이 컨텍스트 메뉴 자신이 아니고,
    // 클릭한 곳이 프로젝트(.child)도 아닐 때
    if (!e.target.closest("#project-context-menu") && !e.target.closest(".child")) {
      closeContextMenu();
    }
  });

  // 기존 그룹들 초기 상태 설정
  if (sidebarComponent) {
    sidebarComponent.querySelectorAll(".menu .wrap").forEach((wrap) => {
      if (wrap.querySelector(".child-wrap")) {
        wrap.classList.add("group-collapsed");
        wrap.querySelector('.child-wrap').style.height = '0px';
      }
    });
    }
}
