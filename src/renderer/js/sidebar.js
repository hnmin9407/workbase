/* sidebar.js
   Patched: Replaced Sortable.js with Native HTML5 Drag-and-Drop API.
   Refactored: Code split into manageable functions.
   Features: 
     - Intra-group sorting with "blue line" indicator.
     - Inter-group sorting with "blue line" indicator.
     - "Move to group" tooltip when dragging between groups.
     - Context menus, group management preserved.
*/

// ===================================================================
// I. Helper Functions
// ===================================================================

/**
 * Moves a context menu element to the document body.
 */
function moveMenuToBody(menuEl) {
  if (!menuEl) return null;
  if (menuEl.parentNode !== document.body) {
    try {
      document.body.appendChild(menuEl);
    } catch (err) {}
  }
  menuEl.classList.add("context-menu");
  menuEl.classList.remove("context-menu--visible");
  menuEl.setAttribute("aria-hidden", "true");
  return menuEl;
}

/**
 * Adjusts the height of a .child-wrap element.
 */
function refreshWrapHeight(
  wrap,
  { animate = true, itemToIgnore = null } = {}
) {
  if (!wrap) return;

  // Clear previous transitionend handler
  if (
    wrap._refreshWrap_onEnd &&
    typeof wrap._refreshWrap_onEnd === "function"
  ) {
    try {
      wrap.removeEventListener("transitionend", wrap._refreshWrap_onEnd);
    } catch (err) {}
    wrap._refreshWrap_onEnd = null;
  }

const prevTransition = wrap.style.transition;
  const targetTransition = "height 0.18s ease, margin-bottom 0.18s ease";

  wrap.style.transition = "none";
  wrap.style.height = "auto";
  let fullHeight = wrap.scrollHeight;

  const ghostClassNames = ["dragging", "drop-indicator"];

  if (
    itemToIgnore instanceof Element &&
    wrap.contains(itemToIgnore)
  ) {
    try {
      fullHeight -= itemToIgnore.offsetHeight;
    } catch (err) {}
  }

  const targetHeight = Math.max(2, fullHeight || 2); // 최소 2px 유지

  // Calculate visible child count
  const childCount = Array.from(wrap.children).filter((child) => {
    if (!child) return false;
    if (child === itemToIgnore) return false;
    if (child.classList) {
      for (const g of ghostClassNames) {
        if (child.classList.contains(g)) return false;
      }
    }
    const cs = window.getComputedStyle(child);
    if (cs && cs.display === "none") return false;
    return true;
  }).length;

  const targetMargin = childCount > 0 ? "" : "0px";

  // 2. Apply height immediately if animation is off
  if (!animate) {
    wrap.style.height = `${targetHeight}px`;
    wrap.style.marginBottom = targetMargin;
    wrap.style.transition = prevTransition || "";

    // ✅ 다음 프레임에 auto로 복구하여 이후 드래그에서 2px 표시선이 클리핑되지 않게 함
    requestAnimationFrame(() => {
      wrap.style.height = "auto";
    });
    return;
  }

  // 3. Apply height with animation
  const startPx = wrap.getBoundingClientRect().height;

  if (Math.abs(startPx - targetHeight) < 1) {
    wrap.style.height = "auto";
    wrap.style.marginBottom = targetMargin;
    wrap.style.transition = prevTransition || "";
    return;
  }

  wrap.style.height = `${startPx}px`;
  void wrap.offsetHeight; // Force reflow

  // transitionend listener
  const onEnd = function (e) {
    if (e && e.target === wrap && e.propertyName === "height") {
      wrap.style.transition = "none";
      wrap.style.height = "auto";
      void wrap.offsetHeight;
      wrap.style.transition = prevTransition || "";
      try {
        wrap.removeEventListener("transitionend", onEnd);
      } catch (err) {}
      wrap._refreshWrap_onEnd = null;
    }
  };

  wrap._refreshWrap_onEnd = onEnd;
  wrap.addEventListener("transitionend", onEnd);

  // Start animation
  wrap.style.transition = targetTransition;
  requestAnimationFrame(() => {
    wrap.style.height = `${targetHeight}px`;
    wrap.style.marginBottom = targetMargin;
  });
}

/**
 * Toggles the collapsed state of a group's project list.
 */
function toggleGroup(wrapElement) {
  const childWrap = wrapElement.querySelector(".child-wrap");
  if (!childWrap) return;

  childWrap.style.transition = "height 0.18s ease, margin-bottom 0.18s ease";
  const isCollapsing = !wrapElement.classList.contains("group-collapsed");
  wrapElement.classList.toggle("group-collapsed");

  const currentHeight = childWrap.getBoundingClientRect().height;
  childWrap.style.height = `${currentHeight}px`;

  requestAnimationFrame(() => {
    if (isCollapsing) {
      childWrap.style.height = "0px";
      childWrap.style.marginBottom = "0px";
    } else {
      childWrap.style.height = "0px";
      childWrap.style.marginBottom = "";
      const prevTransition = childWrap.style.transition;
      childWrap.style.transition = "none";
      childWrap.style.height = "auto";
      const target = childWrap.scrollHeight;
      childWrap.style.height = "0px";
      void childWrap.offsetHeight;
      childWrap.style.transition =
        prevTransition || "height 0.18s ease, margin-bottom 0.18s ease";
      childWrap.style.height = `${target}px`;
      const onEnd = (e) => {
        if (e.propertyName === "height") {
          childWrap.style.transition = "none";
          childWrap.style.height = "auto";
          void childWrap.offsetHeight;
          childWrap.style.transition =
            prevTransition || "height 0.18s ease, margin-bottom 0.18s ease";
          childWrap.removeEventListener("transitionend", onEnd);
        }
      };
      childWrap.addEventListener("transitionend", onEnd);
    }
  });
}

/**
 * Creates a new project DOM element (.child) and binds D&D events.
 */
function createProjectElement(projectName) {
  const projectDiv = document.createElement("div");
  projectDiv.className = "child";
  projectDiv.dataset.tooltip = projectName;
  projectDiv.dataset.direction = "right";
  projectDiv.innerHTML = `
    <div class="left">
      <div class="status delayed-icon-fold">
        <div class="dot"></div>
      </div>
      <span></span>
    </div>`;
  projectDiv.querySelector("span").textContent = projectName;

  // [Native D&D] Make draggable and add listeners
  projectDiv.setAttribute("draggable", "true");
  projectDiv.addEventListener("dragstart", handleChildDragStart);
  projectDiv.addEventListener("dragend", handleChildDragEnd);
  // [Native D&D] 툴팁을 위한 마우스 이벤트 추가
  projectDiv.addEventListener("mouseenter", () => {
    projectDiv.classList.add("show-tooltip-hover");
  });
  projectDiv.addEventListener("mouseleave", () => {
    projectDiv.classList.remove("show-tooltip-hover");
  });


  return projectDiv;
}

/**
 * Collects all group .menu elements.
 */
function collectGroupMenusBelowLine(groupListContainer) {
  const out = [];
  if (!groupListContainer) return out;
  let node = groupListContainer.firstElementChild;
  while (node) {
    if (node.classList && node.classList.contains("menu")) out.push(node);
    node = node.nextElementSibling;
  }
  return out;
}

/**
 * Inserts a menu element after the last existing group menu.
 */
function insertMenuAfterLastGroup(menuEl, groupListContainer, topContainer) {
  if (!groupListContainer) {
    topContainer.appendChild(menuEl); // Fallback
    return;
  }
  const groupMenus = collectGroupMenusBelowLine(groupListContainer);
  if (groupMenus.length === 0) {
    groupListContainer.insertBefore(
      menuEl,
      groupListContainer.firstElementChild
    );
  } else {
    groupListContainer.insertBefore(
      menuEl,
      groupMenus[groupMenus.length - 1].nextElementSibling
    );
  }
}

/**
 * Toggles the sidebar folded state.
 */
function handleSidebarFold(mainContainer, shouldFold) {
  mainContainer.classList.toggle("sidebar-folded", shouldFold);
}

// ===================================================================
// II. Native Drag-and-Drop
// ===================================================================

/**
 * Holds state for drag operations.
 */
const dragState = {
  draggedEl: null,
  dragSourceWrap: null,
  placeholder: null, // The "blue line" indicator
  dropSucceeded: false, // [추가] 드롭 성공 여부 플래그
};

/**
 * Creates a new group DOM element (.menu) and binds dropzone events.
 */
function createGroupElement(groupName) {
  const useTag = (iconId) =>
    `<use href="../../assets/icons/icons.svg#${iconId}"></use>`;
  const newMenuContainer = document.createElement("div");
  newMenuContainer.className = "menu";
  const wrapDiv = document.createElement("div");
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
        <button class="sidebar_function delayed-icon add-project-btn" aria-label="Add Project">
          <svg class="icon-item">${useTag("icon-add-project")}</svg>
        </button>
        <button class="sidebar_function delayed-icon group-toggle-btn" aria-label="Toggle Group">
          <svg class="icon-item">${useTag("icon-down")}</svg>
        </button>
      </div>
    </div>
    <div class="child-wrap"></div>
  `;
  wrapDiv.querySelector(".group-name").textContent = groupName;
  newMenuContainer.appendChild(wrapDiv);

  const childWrap = newMenuContainer.querySelector(".child-wrap");
  // ✅ 수정: groupHeader를 querySelector로 찾습니다.
  const groupHeader = newMenuContainer.querySelector(".group"); 

  // .child-wrap 리스너 (기존과 동일)
  if (childWrap) {
    childWrap.addEventListener("dragenter", handleWrapDragEnter);
    childWrap.addEventListener("dragover", handleWrapDragOver);
    childWrap.addEventListener("dragleave", handleWrapDragLeave);
    childWrap.addEventListener("drop", handleWrapDrop);
  }

  // .group 헤더 리스너 (이제 groupHeader 변수가 유효합니다)
  if (groupHeader) {
      groupHeader.addEventListener("dragover", handleGroupDragOver_Cursor); 
  }

  return newMenuContainer;
}

/**
 * [D&D] Drag starts on a .child
 */
function handleChildDragStart(e) {
  e.stopPropagation();

  dragState.draggedEl = e.currentTarget;
  dragState.dragSourceWrap = e.currentTarget.closest(".child-wrap");
  dragState.dropSucceeded = false;

  e.dataTransfer.setData("text/plain", "child");
  e.dataTransfer.effectAllowed = "move";

  if (dragState.invisibleImage) {
    e.dataTransfer.setDragImage(dragState.invisibleImage, 0, 0);
  }

  dragState.placeholder?.remove(); 
  dragState.placeholder = document.createElement("div");
  dragState.placeholder.className = "drop-indicator";

  // ✅ Add class to body to disable hover effects (유지)
  document.body.classList.add("disable-hover-effects");

  setTimeout(() => {
    e.currentTarget.classList.add("dragging");
  }, 0);
}

/**
 * [D&D] Drag ends on a .child
 */
function handleChildDragEnd(e) {
  e.stopPropagation();

  // ✅ Remove class from body to re-enable hover effects (추가)
  document.body.classList.remove("disable-hover-effects");

  dragState.draggedEl?.classList.remove("dragging");

  dragState.placeholder?.remove(); 
  dragState.placeholder = null;

  dragState.draggedEl = null;
  dragState.dragSourceWrap = null;
  dragState.dropSucceeded = false; 
}

/**
 * [D&D] Drag enters a .child-wrap container
 */
function handleWrapDragEnter(e) {
  e.preventDefault();
  e.stopPropagation();

  // [제거] 툴팁 관련 로직 모두 삭제
}

/**
 * [D&D] Dragging over a .child-wrap (Blue Line Logic)
 */
function handleWrapDragOver(e) {
  e.preventDefault(); 
  e.stopPropagation();
  e.dataTransfer.dropEffect = "move";

  const container = e.currentTarget;
  const afterElement = getDragAfterElement(container, e.clientY);

  // ✅ Placeholder가 아직 DOM에 없거나 위치가 바뀌어야 할 때만 처리
  const needsInsert = !dragState.placeholder.parentNode || 
                     (afterElement && dragState.placeholder.nextSibling !== afterElement) || 
                     (!afterElement && container.lastChild !== dragState.placeholder);

  if (needsInsert) {
    // 삽입 위치 결정
    if (afterElement == null) {
        container.appendChild(dragState.placeholder);
    } else {
        container.insertBefore(dragState.placeholder, afterElement);
    }

    // ✅ 애니메이션 적용: 초기 상태 -> 최종 상태
    // 1. 초기 상태 클래스 추가 (height 0, opacity 0)
    dragState.placeholder.classList.add("drop-indicator-enter");
    
    // 2. 브라우저가 초기 상태를 렌더링할 시간을 줌 (reflow 강제)
    void dragState.placeholder.offsetHeight; 

    // 3. 다음 프레임에서 초기 상태 클래스 제거 -> transition 발동
    requestAnimationFrame(() => {
        dragState.placeholder.classList.remove("drop-indicator-enter");
    });
  }
}

/**
 * [D&D] Drag leaves a .child-wrap container
 */
function handleWrapDragLeave(e) {
  e.stopPropagation();
  
  const toWrap = e.currentTarget;

  if (e.relatedTarget && toWrap.contains(e.relatedTarget)) {
      return; // 깜빡임 방지
  }

  // "진짜로" 벗어났을 때 '파란색 선' 제거 애니메이션 시작
  if (dragState.placeholder && dragState.placeholder.parentNode === toWrap) {
    // ✅ 제거 전 애니메이션 적용: 최종 상태 -> 초기 상태
    dragState.placeholder.classList.add("drop-indicator-enter");
    
    // ✅ 애니메이션(0.15초) 후 실제 DOM 제거
    setTimeout(() => {
        // 타이머 실행 시점에도 여전히 제거해야 하는지 확인
        if (dragState.placeholder && 
            dragState.placeholder.parentNode === toWrap && 
            dragState.placeholder.classList.contains('drop-indicator-enter')) 
        {
            dragState.placeholder.remove();
        }
    }, 150); // CSS transition 시간과 일치
  }
}

/**
 * [D&D] Drop happens on a .child-wrap
 */
function handleWrapDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  dragState.dropSucceeded = true;

  const toWrap = e.currentTarget;
  const fromWrap = dragState.dragSourceWrap;

  // ✅ replaceChild 전에 placeholder가 존재하는지 확인
  if (dragState.placeholder && dragState.placeholder.parentNode) {
    // ✅ 애니메이션 없이 즉시 교체 (깜빡임 방지)
    const parent = dragState.placeholder.parentNode;
    parent.replaceChild(dragState.draggedEl, dragState.placeholder);
  } else {
    // 만약 placeholder가 없다면 (오류 상황 대비) 그냥 추가
    toWrap.appendChild(dragState.draggedEl);
  }

  // 높이 갱신
  if (toWrap !== fromWrap) {
    refreshWrapHeight(fromWrap, { animate: true });
    refreshWrapHeight(toWrap, { animate: true });
  } else {
    setTimeout(() => {
        refreshWrapHeight(toWrap, { animate: true }); 
    }, 0);
  }
}

/**
 * [D&D Helper] Finds the sibling element to insert before.
 */
function getDragAfterElement(container, y) {
  const draggableElements = [
    ...container.querySelectorAll(".child:not(.dragging)"),
  ];

  return draggableElements.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2; // Find center
      
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    },
    { offset: Number.NEGATIVE_INFINITY }
  ).element;
}


/**
 * Removes static groups and adds a default dynamic one.
 */
function replaceStaticGroupsWithJS(groupListContainer, topContainer) {
  if (!groupListContainer || !topContainer) return;

  // Remove existing static .menu elements
  let node = groupListContainer.firstElementChild;
  while (node) {
    const next = node.nextElementSibling;
    if (node.classList && node.classList.contains("menu")) {
      // [Native D&D] No Sortable instance to destroy
      node.remove();
    }
    node = next;
  }

  // Create default group
const defaultMenu = createGroupElement("기본 그룹");
  const defaultChildWrap = defaultMenu.querySelector(".child-wrap");
  const defaultProject = createProjectElement("기본 프로젝트");

  if (defaultChildWrap) defaultChildWrap.appendChild(defaultProject);
  insertMenuAfterLastGroup(defaultMenu, groupListContainer, topContainer);

  if (defaultChildWrap) {
    // ✅ 초기 상태를 auto로 설정하여 자연스러운 높이를 갖도록 함
    defaultChildWrap.style.height = "auto"; 
    defaultChildWrap.style.transition = "none"; // 초기에는 애니메이션 없앰
    defaultChildWrap.style.marginBottom = "8px"; // 기본 마진
  }
}

/**
 * [D&D] Prevents the 'not allowed' cursor when dragging over the group header.
 * This handler is only for cursor appearance, not for dropping logic.
 */
function handleGroupDragOver_Cursor(e) {
  // Check if we are actually dragging a .child element
  if (dragState.draggedEl) {
    e.preventDefault(); // Prevent the default 'not allowed' behavior
    // Signal that a 'move' operation is visually allowed here
    e.dataTransfer.dropEffect = "move"; 
  }
}

// ===================================================================
// III. Popup & Context Menu Logic
// ===================================================================

/**
 * Shared state for active elements.
 */
const activeElementState = {
  projectGroupWrap: null,
  projectElement: null,
  groupMenuElement: null,
};

/**
 * Opens a specified popup.
 */
function openPopup(popupElement, popupOverlay) {
  if (!popupElement || !popupOverlay) return;
  if (document.querySelector(".popup.show")) return;

  popupOverlay.classList.add("show");
  popupElement.classList.add("show");
  const input = popupElement.querySelector("input");
  if (input) input.focus();
}

/**
 * Closes all popups.
 */
function closePopups(popupOverlay) {
  if (!popupOverlay) return;
  popupOverlay.classList.remove("show");
  document.querySelectorAll(".popup.show").forEach((p) => {
    p.classList.remove("show");
    const input = p.querySelector("input");
    if (input) input.value = "";
  });
  activeElementState.projectElement = null;
}

/**
 * Closes all context menus.
 */
function closeContextMenuAll(projectContextMenu, groupContextMenu) {
  if (projectContextMenu) {
    projectContextMenu.classList.remove("context-menu--visible");
    projectContextMenu.setAttribute("aria-hidden", "true");
  }
  if (groupContextMenu) {
    groupContextMenu.classList.remove("context-menu--visible");
    groupContextMenu.setAttribute("aria-hidden", "true");
  }
  activeElementState.projectElement = null;
  activeElementState.groupMenuElement = null;
}

/**
 * Main click handler for the sidebar.
 */
function handleSidebarClick(event, elements) {
  const {
    mainContainer,
    groupAddPopup,
    projectAddPopup,
    popupOverlay,
  } = elements;
  const target = event.target;
  const groupWrap = target.closest(".wrap");

  if (target.closest("#sidebar-fold-button")) {
    handleSidebarFold(mainContainer, !mainContainer.classList.contains("sidebar-folded"));
  } else if (target.closest("#add-group")) {
    openPopup(groupAddPopup, popupOverlay);
  } else if (target.closest(".group-toggle-btn") && groupWrap) {
    toggleGroup(groupWrap);
  } else if (target.closest(".add-project-btn") && groupWrap) {
    activeElementState.projectGroupWrap = groupWrap;
    openPopup(projectAddPopup, popupOverlay);
  } else if (
    target.closest(".group") &&
    mainContainer.classList.contains("sidebar-folded") &&
    groupWrap
  ) {
    toggleGroup(groupWrap);
  }
}

/**
 * Main contextmenu handler for the sidebar.
 */
function handleSidebarContextMenu(event, elements) {
  event.preventDefault();
  // Check for dragging
  if (dragState.draggedEl) {
    return;
  }

  const { projectRenamePopup, groupRenamePopup } = elements;
  const targetProject = event.target.closest(".child");
  const targetGroup = event.target.closest(".group");
  const x = event.clientX ?? event.x;
  const y = event.clientY ?? event.y;

  if (targetProject) {
    activeElementState.projectElement = targetProject;
    const span = targetProject.querySelector("span");
    const pi = projectRenamePopup?.querySelector("input");
    if (pi) pi.value = span?.textContent || "";
    window.electronAPI?.showContextMenu({ type: "project", x, y });
    return;
  }

  if (targetGroup) {
    activeElementState.groupMenuElement = targetGroup.closest(".menu");
    const nameSpan = targetGroup.querySelector(".group-name");
    const gi = groupRenamePopup?.querySelector("input");
    if (gi) gi.value = nameSpan?.textContent || "";
    window.electronAPI?.showContextMenu({ type: "group", x, y });
  }
}

/**
 * Binds all popup confirmation and close button listeners.
 */
function initPopupHandlers(elements) {
  const {
    popupOverlay,
    groupAddPopup,
    projectAddPopup,
    projectRenamePopup,
    groupRenamePopup,
    groupDeletePopup,
    projectDeletePopup,
    addGroupConfirmBtn,
    addProjectConfirmBtn,
    renameProjectConfirmBtn,
    confirmGroupRenameBtn,
    confirmGroupDeleteBtn,
    confirmProjectDeleteBtn,
    groupListContainer,
    topContainer,
  } = elements;

  const closeAll = () => {
    closePopups(popupOverlay);
    closeContextMenuAll(elements.projectContextMenu, elements.groupContextMenu);
  };

  popupOverlay?.addEventListener("click", (e) => {
    if (e.target === popupOverlay) closeAll();
  });
  document.querySelectorAll(".popup-close").forEach((btn) => {
    btn.addEventListener("click", closeAll);
  });

  // Add Group
  const addNewGroup = () => {
    const input = groupAddPopup.querySelector("input");
    let groupName = input.value.trim() || "기본 그룹";
    const newMenu = createGroupElement(groupName); // Binds D&D
    const childWrap = newMenu.querySelector(".child-wrap");
    const defaultProject = createProjectElement("기본 프로젝트"); // Binds D&D

    if (childWrap) childWrap.appendChild(defaultProject);
    insertMenuAfterLastGroup(newMenu, groupListContainer, topContainer);

    if (childWrap) {
      childWrap.style.transition = "height 0.18s ease";
      childWrap.style.height = `${childWrap.scrollHeight}px`;
      childWrap.style.marginBottom = "8px";
    }
    if (typeof initTooltip === "function") initTooltip();
    closeAll();
  };
  addGroupConfirmBtn?.addEventListener("click", addNewGroup);
  groupAddPopup?.querySelector("input")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addNewGroup();
  });

  // Add Project
  const addNewProject = () => {
    if (!activeElementState.projectGroupWrap) return;
    const input = projectAddPopup.querySelector("input");
    let projectName = input.value.trim() || "기본 프로젝트";
    const childWrap = activeElementState.projectGroupWrap.querySelector(".child-wrap");
    if (!childWrap) return;

    childWrap.appendChild(createProjectElement(projectName)); // Binds D&D

    if (activeElementState.projectGroupWrap.classList.contains("group-collapsed")) {
      toggleGroup(activeElementState.projectGroupWrap);
    } else {
      refreshWrapHeight(childWrap, { animate: true });
    }
    if (typeof initTooltip === "function") initTooltip();
    closeAll();
  };
  addProjectConfirmBtn?.addEventListener("click", addNewProject);
  projectAddPopup?.querySelector("input")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addNewProject();
  });

  // Rename Project
  const renameProject = () => {
    if (!activeElementState.projectElement) return;
    const input = projectRenamePopup.querySelector("input");
    const newName = input.value.trim();
    if (!newName) return;
    activeElementState.projectElement.querySelector("span").textContent = newName;
    activeElementState.projectElement.dataset.tooltip = newName;
    if (typeof initTooltip === "function") initTooltip();
    closeAll();
  };
  renameProjectConfirmBtn?.addEventListener("click", renameProject);
  projectRenamePopup?.querySelector("input")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") renameProject();
  });

  // Rename Group
  const renameGroup = () => {
    if (!activeElementState.groupMenuElement) {
      closeAll();
      return;
    }
    const input = groupRenamePopup?.querySelector("input");
    const newName = input.value.trim() || "Default Group";
    const groupHeader = activeElementState.groupMenuElement.querySelector(".group");
    if (groupHeader) {
      groupHeader.querySelector(".group-name").textContent = newName;
      groupHeader.dataset.tooltip = newName;
    }
    if (typeof initTooltip === "function") initTooltip();
    closeAll();
    activeElementState.groupMenuElement = null;
  };
  confirmGroupRenameBtn?.addEventListener("click", renameGroup);
  groupRenamePopup?.querySelector("input")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") renameGroup();
  });

  // Delete Group
  confirmGroupDeleteBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!activeElementState.groupMenuElement) {
      closeAll();
      return;
    }
    
    // [Native D&D] No Sortable instance to destroy
    
    // [Native D&D] Remove D&D listeners from the child-wrap
    const childWrap = activeElementState.groupMenuElement.querySelector(".child-wrap");
    if (childWrap) {
        childWrap.removeEventListener("dragenter", handleWrapDragEnter);
        childWrap.removeEventListener("dragover", handleWrapDragOver);
        childWrap.removeEventListener("dragleave", handleWrapDragLeave);
        childWrap.removeEventListener("drop", handleWrapDrop);
    }

// [추가] .group 헤더의 dragover 리스너 제거
    const groupHeader = activeElementState.groupMenuElement.querySelector(".group");
    if (groupHeader) {
        groupHeader.removeEventListener("dragover", handleGroupDragOver_Cursor);
    }
    
    activeElementState.groupMenuElement.remove();
    closeAll();
    activeElementState.groupMenuElement = null;
  });

  // Delete Project
  confirmProjectDeleteBtn?.addEventListener("click", () => {
    if (!activeElementState.projectElement) {
      closeAll();
      return;
    }
    const childWrap = activeElementState.projectElement.parentElement;
    
    // [Native D&D] Remove D&D listeners from the child
    activeElementState.projectElement.removeEventListener("dragstart", handleChildDragStart);
    activeElementState.projectElement.removeEventListener("dragend", handleChildDragEnd);
    
    activeElementState.projectElement.remove();
    refreshWrapHeight(childWrap, { animate: true });
    closeAll();
  });
}

/**
 * Binds listeners for the context menu buttons.
 */
function initContextMenuHandlers(elements) {
  const {
    groupUpBtn,
    groupDownBtn,
    renameGroupBtn,
    deleteGroupBtn,
    renameProjectBtn,
    deleteProjectBtn,
    groupRenamePopup,
    groupDeletePopup,
    projectRenamePopup,
    projectDeletePopup,
    popupOverlay,
    groupListContainer,
  } = elements;

  const closeAllContext = () =>
    closeContextMenuAll(elements.projectContextMenu, elements.groupContextMenu);

  groupUpBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!activeElementState.groupMenuElement) return;
    const groupMenus = collectGroupMenusBelowLine(groupListContainer);
    const idx = groupMenus.indexOf(activeElementState.groupMenuElement);
    if (idx > 0) {
      const target = groupMenus[idx - 1];
      target.parentNode.insertBefore(activeElementState.groupMenuElement, target);
    }
    closeAllContext();
  });

  groupDownBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!activeElementState.groupMenuElement) return;
    const groupMenus = collectGroupMenusBelowLine(groupListContainer);
    const idx = groupMenus.indexOf(activeElementState.groupMenuElement);
    if (idx !== -1 && idx < groupMenus.length - 1) {
      const next = groupMenus[idx + 1];
      groupListContainer.insertBefore(activeElementState.groupMenuElement, next.nextElementSibling);
    }
    closeAllContext();
  });

  renameGroupBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!activeElementState.groupMenuElement) return;
    openPopup(groupRenamePopup, popupOverlay);
    closeAllContext();
  });

  deleteGroupBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!activeElementState.groupMenuElement) return;
    openPopup(groupDeletePopup, popupOverlay);
    closeAllContext();
  });

  renameProjectBtn?.addEventListener("click", () => {
    if (!activeElementState.projectElement) return;
    openPopup(projectRenamePopup, popupOverlay);
    closeAllContext();
  });

  deleteProjectBtn?.addEventListener("click", () => {
    if (!activeElementState.projectElement) return;
    openPopup(projectDeletePopup, popupOverlay);
    closeAllContext();
  });
}

/**
 * Binds global listeners (window resize, click, keydown) and Electron IPC.
 * @param {object} elements - A map of required DOM elements.
 */
function initGlobalListeners(elements) {
  const {
    mainContainer,
    popupOverlay,
    projectContextMenu,
    groupContextMenu,
    groupRenamePopup,
    groupDeletePopup,
    projectRenamePopup,
    projectDeletePopup,
    groupListContainer,
  } = elements;

  // Responsive folding
  const MOBILE_BREAKPOINT = 768;
  let isMobileView = window.innerWidth <= MOBILE_BREAKPOINT;
  handleSidebarFold(mainContainer, isMobileView);

  window.addEventListener("resize", () => {
    const currentIsMobile = window.innerWidth <= MOBILE_BREAKPOINT;
    if (currentIsMobile !== isMobileView) {
      isMobileView = currentIsMobile;
      handleSidebarFold(mainContainer, isMobileView);
    }
  });

  // Global click to close context menus
  window.addEventListener("click", (e) => {
    if (
      projectContextMenu &&
      !projectContextMenu.contains(e.target) &&
      !e.target.closest(".child")
    ) {
      closeContextMenuAll(projectContextMenu, groupContextMenu);
    }
    if (
      groupContextMenu &&
      !groupContextMenu.contains(e.target) &&
      !e.target.closest(".group")
    ) {
      closeContextMenuAll(projectContextMenu, groupContextMenu);
    }
  });

  // Escape key
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeContextMenuAll(projectContextMenu, groupContextMenu);
      closePopups(popupOverlay);
    }
  });

  // Electron IPC
  if (window.electronAPI?.onContextAction) {
    window.electronAPI.onContextAction((action) => {
      const { groupMenuElement, projectElement } = activeElementState;
      
      // [수정] 팝업을 띄우는 액션은 상태를 초기화하지 않도록 'resetState' 변수 추가
      let resetStateAfterAction = true; 

      switch (action) {
        case "rename-group":
          if (groupMenuElement) {
            openPopup(groupRenamePopup, popupOverlay);
            resetStateAfterAction = false; // 팝업이 상태를 사용해야 함
          }
          break;
        case "delete-group":
          if (groupMenuElement) {
            openPopup(groupDeletePopup, popupOverlay);
            resetStateAfterAction = false; // 팝업이 상태를 사용해야 함
          }
          break;
        case "move-up-group":
          if (groupMenuElement) {
            const groupMenus = collectGroupMenusBelowLine(groupListContainer);
            const idx = groupMenus.indexOf(groupMenuElement);
            if (idx > 0) {
              const target = groupMenus[idx - 1];
              target.parentNode.insertBefore(groupMenuElement, target);
            }
          }
          break; // 즉시 실행되므로 상태 초기화 (resetStateAfterAction = true)
        case "move-down-group":
          if (groupMenuElement) {
            const groupMenus = collectGroupMenusBelowLine(groupListContainer);
            const idx = groupMenus.indexOf(groupMenuElement);
            if (idx !== -1 && idx < groupMenus.length - 1) {
              const next = groupMenus[idx + 1];
              groupListContainer.insertBefore(
                groupMenuElement,
                next.nextElementSibling
              );
            }
          }
          break; // 즉시 실행되므로 상태 초기화 (resetStateAfterAction = true)
        case "rename-project":
          if (projectElement) {
            openPopup(projectRenamePopup, popupOverlay);
            resetStateAfterAction = false; // 팝업이 상태를 사용해야 함
          }
          break;
        case "delete-project":
          if (projectElement) {
            openPopup(projectDeletePopup, popupOverlay);
            resetStateAfterAction = false; // 팝업이 상태를 사용해야 함
          }
          break;
      }
      
      // [수정] resetStateAfterAction이 true일 때만 상태 초기화
      if (resetStateAfterAction) {
        activeElementState.projectElement = null;
        activeElementState.groupMenuElement = null;
      }
    });
  }
}

// ===================================================================
// IV. Main Initialization Function
// ===================================================================

/**
 * Sidebar initialization function
 */
function initSidebar() {
  // [Native D&D] No Sortable.js check needed

  // --- 1. Element Selection ---
  const elements = {
    mainContainer: document.querySelector(".main"),
    sidebarComponent: document.getElementById("sidebar-component"),
    popupOverlay: document.querySelector(".popup-overlay"),
    // ... (all other element selections remain the same) ...
    groupAddPopup: document.getElementById("group-add-popup"),
    projectAddPopup: document.getElementById("project-add-popup"),
    projectRenamePopup: document.getElementById("project-rename-popup"),
    groupRenamePopup: document.getElementById("group-rename-popup"),
    groupDeletePopup: document.getElementById("group-delete-popup"),
    projectDeletePopup: document.getElementById("project-delete-popup"),
    addGroupConfirmBtn: document.getElementById("confirm-group-add"),
    addProjectConfirmBtn: document.getElementById("confirm-project-add"),
    renameProjectConfirmBtn: document.getElementById("confirm-project-rename"),
    confirmGroupRenameBtn: document.getElementById("confirm-group-rename"),
    confirmGroupDeleteBtn: document.getElementById("confirm-group-delete"),
    confirmProjectDeleteBtn: document.getElementById("confirm-project-delete"),
    projectContextMenu: document.getElementById("project-context-menu"),
    renameProjectBtn: document.getElementById("rename-project-btn"),
    deleteProjectBtn: document.getElementById("delete-project-btn"),
    groupContextMenu: document.getElementById("group-context-menu"),
    groupUpBtn: document.getElementById("group-up-button"),
    groupDownBtn: document.getElementById("group-down-button"),
    renameGroupBtn: document.getElementById("rename-group-btn"),
    deleteGroupBtn: document.getElementById("delete-group-btn"),
  };

  elements.topContainer = elements.sidebarComponent
    ? elements.sidebarComponent.querySelector(".top")
    : null;
  elements.groupListContainer = elements.topContainer
    ? elements.topContainer.querySelector(".group-list-container")
    : null;

  // --- 2. Validation ---
  const essentialElements = [
    "mainContainer", "sidebarComponent", "popupOverlay",
    "groupAddPopup", "projectAddPopup", "projectRenamePopup",
    "groupDeletePopup", "projectDeletePopup", "topContainer", "groupListContainer",
  ];

  for (const key of essentialElements) {
    if (!elements[key]) {
      console.error(`Essential UI element "${key}" not found. Stopping script.`);
      return;
    }
  }

  // --- 3. Initial Setup ---
  elements.groupContextMenu = moveMenuToBody(elements.groupContextMenu);
  elements.projectContextMenu = moveMenuToBody(elements.projectContextMenu);

// [수정] 
  // '파란색 선'을 여기서 생성하지 않고, null로 초기화합니다.
  // 드래그 시작 시 매번 새로 생성하도록 변경합니다.
  dragState.placeholder = null;

  // [수정] 
  // 1x1 픽셀짜리 투명한 이미지를 미리 생성하여 DOM에 추가하고 저장합니다.
  const invisibleDragImage = document.createElement("div");
  invisibleDragImage.style.width = "1px";
  invisibleDragImage.style.height = "1px";
  invisibleDragImage.style.opacity = "0";
  invisibleDragImage.style.position = "fixed"; // DOM 흐름에 영향 X
  invisibleDragImage.style.top = "-10px";      // 화면 밖
  invisibleDragImage.style.left = "-10px";     // 화면 밖
  invisibleDragImage.style.pointerEvents = "none";
  document.body.appendChild(invisibleDragImage);
  dragState.invisibleImage = invisibleDragImage; // dragState에 저장

  // --- 4. Initialize Groups & D&D ---
  replaceStaticGroupsWithJS(elements.groupListContainer, elements.topContainer);

  // --- 5. Bind Event Handlers ---
  elements.sidebarComponent.addEventListener("click", (e) =>
    handleSidebarClick(e, elements)
  );
  elements.sidebarComponent.addEventListener("contextmenu", (e) =>
    handleSidebarContextMenu(e, elements)
  );

  initPopupHandlers(elements);
  initContextMenuHandlers(elements);
  initGlobalListeners(elements);

  // --- 6. Final Height Adjustment ---
  elements.sidebarComponent.querySelectorAll(".child-wrap").forEach((wrap) => {
    refreshWrapHeight(wrap, { animate: false });
  });

  console.log(
    "initSidebar initialized (Refactored, Native D&D activated)"
  );
} // End of initSidebar function

// --- Run Initialization ---
// window.addEventListener('DOMContentLoaded', initSidebar);
// 또는
// initSidebar();