const menuItems = [
    { menuItem: document.getElementById("quiz_menu_item"), sectionId: "quiz_section" },
    { menuItem: document.getElementById("hold_menu_item"), sectionId: "hold_section" },
    { menuItem: document.getElementById("results_menu_item"), sectionId: "results_section" },
    { menuItem: document.getElementById("logs_menu_item"), sectionId: "logs_section" },
    { menuItem: document.getElementById("user_menu_item"), sectionId: "user_section" }
];

function changeMenu(menuItem, sectionId) {
    menuItems.forEach(item => {
        if (item.menuItem) {
            item.menuItem.classList.remove("selected_underline");
        }
    });

    if (menuItem) {
        menuItem.classList.add("selected_underline");
    }

    const sections = document.getElementById("main_content").querySelectorAll("section");
    sections.forEach(section => {
        section.classList.add("hidden");
    });

    const correspondingSection = document.getElementById(sectionId);
    if (correspondingSection) {
        correspondingSection.classList.remove("hidden");
    }
}

menuItems.forEach(item => {
    if (item.menuItem) {
        item.menuItem.addEventListener("click", function() {
            changeMenu(item.menuItem, item.sectionId);
        });
    }
});


