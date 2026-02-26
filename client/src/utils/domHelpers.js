/**
 * Helper to retrieve a DOM node for portals (e.g., Modals, ActionSheets).
 * 
 * @param {string} id - The ID of the DOM node (default: "modal-root")
 * @returns {HTMLElement | null} The DOM node if running in browser, else null
 */
export const getPortalRoot = (id = "modal-root") => {
    if (typeof window === "undefined") return null;
    let root = document.getElementById(id);
    if (!root) {
        root = document.createElement("div");
        root.id = id;
        document.body.appendChild(root);
    }
    return root;
};
