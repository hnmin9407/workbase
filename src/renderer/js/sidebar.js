/**
 * DOM 콘텐츠가 로드된 후 모든 사이드바 기능을 초기화합니다.
 */
function initializeSidebarApp() {
  console.log("✅ Initializing sidebar app...");

  // [수정] 모든 내부 함수에서 공유할 변수
  let projectsRef = null;

  function initSidebarFold() {
    const MOBILE_BREAKPOINT = 768;
    const foldButton = document.getElementById("sidebar-fold-button");
    const overlay = document.getElementById("sidebar-overlay");
    const sidebar = document.getElementById("sidebar");

    if (!foldButton || !overlay || !sidebar) {
      console.warn("필수 요소(버튼, 오버레이, 사이드바)를 찾을 수 없습니다.");
      return;
    }

    const toggleSidebar = () => {
      sidebar.classList.remove("no-transition");
      if (window.innerWidth <= MOBILE_BREAKPOINT) {
        document.body.classList.remove("sidebar-collapsed");
        document.body.classList.toggle("mobile-sidebar-open");
      } else {
        document.body.classList.remove("mobile-sidebar-open");
        document.body.classList.toggle("sidebar-collapsed");
      }
    };
    foldButton.addEventListener("click", toggleSidebar);

    overlay.addEventListener("click", () => {
      if (window.innerWidth <= MOBILE_BREAKPOINT) {
        document.body.classList.remove("mobile-sidebar-open");
      }
    });

    let resizeTimer;
    window.addEventListener("resize", () => {
      sidebar.classList.add("no-transition");
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (window.innerWidth <= MOBILE_BREAKPOINT) {
          document.body.classList.remove("sidebar-collapsed");
        } else {
          document.body.classList.remove("mobile-sidebar-open");
        }
        requestAnimationFrame(() => {
          sidebar.classList.remove("no-transition");
        });
      }, 100);
    });
  }

  function initSidebarMenu() {
    const menuButtons = document.querySelectorAll(".menu-button");
    if (menuButtons.length === 0) return;
    menuButtons.forEach((item) => {
      item.addEventListener("click", () => {
        document
          .querySelectorAll(".menu-button")
          .forEach((i) => i.classList.remove("selected"));
        item.classList.add("selected");
      });
    });
  }

  function createProjectItem(project) {
    const projectDiv = document.createElement("div");
    projectDiv.className = "menu-button";
    projectDiv.dataset.contextMenuTarget = "project-edit";
    projectDiv.dataset.projectId = project.id;
    projectDiv.innerHTML = `
      <svg class="icon"><use href="#icon-hash"></use></svg>
      <span>${project.name}</span>
    `;
    return projectDiv;
  }

  function initAddProject() {
    const addProjectButton = document.getElementById("add-project");
    const projectPopupOverlay = document.getElementById("add-project-overlay");
    const projectNameInput = document.getElementById("project-name-input");
    const confirmButton = document.getElementById("confirm-project-button");
    const cancelButton = document.getElementById("cancel-project-button");

    if (
      !addProjectButton ||
      !projectPopupOverlay ||
      !projectNameInput ||
      !confirmButton ||
      !cancelButton
    ) {
      console.warn("프로젝트 추가 기능에 필요한 요소를 찾을 수 없습니다.");
      return;
    }

    addProjectButton.addEventListener("click", () => {
      projectPopupOverlay.classList.add("show");
      projectNameInput.focus();
    });

    const closePopup = () => {
      projectPopupOverlay.classList.remove("show");
      projectNameInput.value = "";
    };

    cancelButton.addEventListener("click", closePopup);
    projectPopupOverlay.addEventListener("click", (e) => {
      if (e.target === projectPopupOverlay) closePopup();
    });

    const addProject = () => {
      const projectName = projectNameInput.value.trim();
      if (!projectName) {
        alert("프로젝트 이름을 입력해주세요.");
        projectNameInput.focus();
        return;
      }

      if (projectsRef) {
        projectsRef
          .orderByChild("order")
          .limitToLast(1)
          .once("value", (snapshot) => {
            let newOrder = 0;
            snapshot.forEach((child) => {
              newOrder = child.val().order + 1;
            });
            projectsRef.push({
              name: projectName,
              isPinned: false,
              order: newOrder,
            });
          });
      }
      closePopup();
    };

    confirmButton.addEventListener("click", addProject);
    projectNameInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") addProject();
    });
  }

  function initProjectMenus() {
    const foldButtons = document.querySelectorAll(".menu-fold-button");
    foldButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const parentWrap = button.closest(
          ".project-menu-wrap, .fixed-project-menu-wrap"
        );
        const menuWrap = parentWrap.querySelector(".menu-wrap");
        if (!parentWrap || !menuWrap) return;
        parentWrap.classList.toggle("is-folded");
        if (menuWrap.classList.toggle("is-open")) {
          menuWrap.style.maxHeight = menuWrap.scrollHeight + "px";
          menuWrap.style.opacity = "1";
        } else {
          menuWrap.style.maxHeight = "0px";
          menuWrap.style.opacity = "0";
        }
      });
    });

    requestAnimationFrame(() => {
      const allMenuWraps = document.querySelectorAll(".menu-wrap");
      allMenuWraps.forEach((menuWrap) => {
        if (menuWrap.classList.contains("is-open")) {
          menuWrap.style.maxHeight = menuWrap.scrollHeight + "px";
          menuWrap.style.opacity = "1";
          const parentWrap = menuWrap.closest(
            ".project-menu-wrap, .fixed-project-menu-wrap"
          );
          if (parentWrap) parentWrap.classList.remove("is-folded");
        }
      });
      requestAnimationFrame(() => {
        allMenuWraps.forEach((menuWrap) => {
          menuWrap.classList.add("transitions-enabled");
        });
      });
    });
  }

  function initProjectItemContextMenu() {
    const sidebar = document.getElementById("sidebar");
    if (!sidebar) return;

    const editOverlay = document.getElementById("edit-project-overlay");
    const editInput = document.getElementById("edit-project-name-input");
    const confirmEditBtn = document.getElementById(
      "confirm-edit-project-button"
    );
    const cancelEditBtn = document.getElementById("cancel-edit-project-button");
    const pinProjectBtn = document.getElementById("pin-project-button");
    const editProjectBtn = document.getElementById("edit-project-button");
    const deleteProjectBtn = document.getElementById("delete-project-button");
    const moveUpBtn = document.getElementById("move-up-button");
    const moveDownBtn = document.getElementById("move-down-button");

    if (
      !editOverlay ||
      !editInput ||
      !confirmEditBtn ||
      !cancelEditBtn ||
      !editProjectBtn ||
      !pinProjectBtn ||
      !deleteProjectBtn ||
      !moveUpBtn ||
      !moveDownBtn
    ) {
      console.warn(
        "프로젝트 컨텍스트 메뉴 기능에 필요한 요소를 찾을 수 없습니다."
      );
      return;
    }

    let currentEditingProject = null;

    document.addEventListener("contextmenu", (e) => {
      const targetItem = e.target.closest(".menu-button");
      if (
        targetItem &&
        (targetItem.closest(".project-menu-wrap") ||
          targetItem.closest(".fixed-project-menu-wrap"))
      ) {
        currentEditingProject = targetItem;
        const pinButtonSpan = pinProjectBtn.querySelector("span");
        if (currentEditingProject.closest(".fixed-project-menu-wrap")) {
          pinButtonSpan.textContent = "고정 해제";
          editProjectBtn.style.display = "none";
          deleteProjectBtn.style.display = "none";
        } else {
          pinButtonSpan.textContent = "고정";
          editProjectBtn.style.display = "flex";
          deleteProjectBtn.style.display = "flex";
        }
        moveUpBtn.disabled = !currentEditingProject.previousElementSibling;
        moveDownBtn.disabled = !currentEditingProject.nextElementSibling;
        moveUpBtn.style.display = "flex";
        moveDownBtn.style.display = "flex";
      }
    });

    editProjectBtn.addEventListener("click", () => {
      if (!currentEditingProject) return;
      const projectNameSpan = currentEditingProject.querySelector("span");
      if (projectNameSpan) {
        editInput.value = projectNameSpan.textContent;
        editOverlay.classList.add("show");
        editInput.focus();
        editInput.select();
      }
    });

    const closeEditPopup = () => {
      editOverlay.classList.remove("show");
      editInput.value = "";
      currentEditingProject = null;
    };

    cancelEditBtn.addEventListener("click", closeEditPopup);
    editOverlay.addEventListener("click", (e) => {
      if (e.target === editOverlay) closeEditPopup();
    });

    const handleEditProject = () => {
      if (!currentEditingProject) return;
      const newName = editInput.value.trim();
      const projectId = currentEditingProject.dataset.projectId;
      if (!newName) {
        showAlert("프로젝트 이름은 비워둘 수 없습니다.", "error");
        return;
      }
      if (projectsRef && projectId) {
        projectsRef.child(projectId).update({ name: newName });
        showAlert("프로젝트 이름이 수정되었습니다.", "check");
      } else {
        showAlert("프로젝트 이름 수정 중 오류가 발생했습니다.", "error");
      }
      closeEditPopup();
    };

    const handleDeleteProject = () => {
      if (!currentEditingProject) return;
      const projectId = currentEditingProject.dataset.projectId;
      if (projectsRef && projectId) {
        projectsRef.child(projectId).remove();
        showAlert("프로젝트가 삭제되었습니다.", "check");
      } else {
        showAlert("프로젝트 삭제 중 오류가 발생했습니다.", "error");
      }
      hideAllContextMenus();
    };

    const handlePinProject = () => {
      if (!currentEditingProject) return;
      const projectId = currentEditingProject.dataset.projectId;
      const isPinned = currentEditingProject.closest(
        ".fixed-project-menu-wrap"
      );
      if (projectsRef && projectId) {
        projectsRef.child(projectId).update({ isPinned: !isPinned });
        showAlert(
          isPinned
            ? "프로젝트 고정을 해제했습니다."
            : "프로젝트를 고정했습니다.",
          "check"
        );
      } else {
        showAlert("프로젝트 고정 상태 변경 중 오류가 발생했습니다.", "error");
      }
      hideAllContextMenus();
    };

    const handleMoveUp = () => {
      if (
        !currentEditingProject ||
        !currentEditingProject.previousElementSibling
      )
        return;
      const currentId = currentEditingProject.dataset.projectId;
      const previousId =
        currentEditingProject.previousElementSibling.dataset.projectId;
      swapProjectOrder(currentId, previousId);
      hideAllContextMenus();
    };

    const handleMoveDown = () => {
      if (!currentEditingProject || !currentEditingProject.nextElementSibling)
        return;
      const currentId = currentEditingProject.dataset.projectId;
      const nextId = currentEditingProject.nextElementSibling.dataset.projectId;
      swapProjectOrder(currentId, nextId);
      hideAllContextMenus();
    };

    async function swapProjectOrder(id1, id2) {
      if (!projectsRef || !id1 || !id2) return;
      const proj1Snap = await projectsRef.child(id1).once("value");
      const proj2Snap = await projectsRef.child(id2).once("value");
      const order1 = proj1Snap.val().order;
      const order2 = proj2Snap.val().order;
      projectsRef.child(id1).update({ order: order2 });
      projectsRef.child(id2).update({ order: order1 });
    }

    pinProjectBtn.addEventListener("click", handlePinProject);
    deleteProjectBtn.addEventListener("click", handleDeleteProject);
    moveUpBtn.addEventListener("click", handleMoveUp);
    moveDownBtn.addEventListener("click", handleMoveDown);
    confirmEditBtn.addEventListener("click", handleEditProject);
    editInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleEditProject();
    });

    document.addEventListener("click", (e) => {
      const menu = e.target.closest(".context-menu");
      const trigger = e.target.closest(
        '[data-context-menu-target="project-edit"]'
      );
      if (!menu && !trigger) currentEditingProject = null;
    });
  }

  function initProjectManagement(uid) {
    projectsRef = firebase.database().ref(`users/${uid}/projects`);

    projectsRef.orderByChild("order").on("value", (snapshot) => {
      const fixedContainer = document.querySelector(
        ".fixed-project-menu-wrap .menu-wrap"
      );
      const defaultContainer = document.querySelector(
        ".project-menu-wrap .menu-wrap"
      );
      if (!fixedContainer || !defaultContainer) return;

      fixedContainer.innerHTML = "";
      defaultContainer.innerHTML = "";

      if (!snapshot.exists()) {
        projectsRef.push({ name: "기본 프로젝트", isPinned: false, order: 0 });
        return;
      }

      snapshot.forEach((childSnapshot) => {
        const project = { id: childSnapshot.key, ...childSnapshot.val() };
        const projectElement = createProjectItem(project);
        if (project.isPinned) {
          fixedContainer.appendChild(projectElement);
        } else {
          defaultContainer.appendChild(projectElement);
        }
      });

      const updateHeight = (container) => {
        if (container.classList.contains("is-open")) {
          container.style.maxHeight = container.scrollHeight + "px";
        }
      };
      updateHeight(fixedContainer);
      updateHeight(defaultContainer);

      initSidebarMenu();
    });

    initProjectItemContextMenu();
    initAddProject();
  }

  // --- 메인 실행 로직 ---
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      initSidebarMenu(); // 고정 메뉴에 대한 초기 선택 기능 활성화
      initSidebarFold();
      initProjectMenus();
      initProjectManagement(user.uid);
    } else {
      console.log("사이드바: 사용자가 로그인하지 않았습니다.");
    }
  });
}
