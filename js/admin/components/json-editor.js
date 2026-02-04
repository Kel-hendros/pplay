/**
 * JSON Editor Component
 * For editing arrays of strings (tags, lists, etc.)
 */

const JsonEditor = {
    /**
     * Render a JSON array editor
     */
    render: (containerId, items = [], options = {}) => {
        const { label, placeholder = 'Agregar item...', name } = options;

        return `
            <div class="json-editor" id="${containerId}" data-name="${name || containerId}">
                ${label ? `<div class="json-editor-header"><span class="form-label">${label}</span></div>` : ''}
                <div class="json-editor-items">
                    ${items.map((item, index) => JsonEditor.renderItem(item, index)).join('')}
                </div>
                <div class="json-editor-add">
                    <input
                        type="text"
                        class="form-input json-editor-input"
                        placeholder="${placeholder}"
                        onkeypress="JsonEditor.handleKeypress(event, '${containerId}')"
                    >
                    <button type="button" class="btn btn-sm btn-ghost" onclick="JsonEditor.addItem('${containerId}')">
                        + Agregar
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * Render a single item
     */
    renderItem: (value, index) => {
        return `
            <div class="json-editor-item" data-index="${index}">
                <span class="drag-handle" style="cursor: grab; opacity: 0.5;">⋮⋮</span>
                <input type="text" value="${value}" onchange="JsonEditor.updateItem(this)">
                <button type="button" class="btn-icon danger" onclick="JsonEditor.removeItem(this)">✕</button>
            </div>
        `;
    },

    /**
     * Add item on Enter key
     */
    handleKeypress: (event, containerId) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            JsonEditor.addItem(containerId);
        }
    },

    /**
     * Add new item
     */
    addItem: (containerId) => {
        const container = document.getElementById(containerId);
        const input = container.querySelector('.json-editor-input');
        const value = input.value.trim();

        if (!value) return;

        const itemsContainer = container.querySelector('.json-editor-items');
        const index = itemsContainer.children.length;

        const itemHtml = JsonEditor.renderItem(value, index);
        itemsContainer.insertAdjacentHTML('beforeend', itemHtml);

        input.value = '';
        input.focus();

        JsonEditor.triggerChange(container);
    },

    /**
     * Remove item
     */
    removeItem: (button) => {
        const item = button.closest('.json-editor-item');
        const container = item.closest('.json-editor');
        item.remove();
        JsonEditor.triggerChange(container);
    },

    /**
     * Update item value
     */
    updateItem: (input) => {
        const container = input.closest('.json-editor');
        JsonEditor.triggerChange(container);
    },

    /**
     * Get values from editor
     */
    getValues: (containerId) => {
        const container = document.getElementById(containerId);
        if (!container) return [];

        const items = container.querySelectorAll('.json-editor-item input');
        return Array.from(items).map(input => input.value.trim()).filter(v => v);
    },

    /**
     * Set values in editor
     */
    setValues: (containerId, values = []) => {
        const container = document.getElementById(containerId);
        if (!container) return;

        const itemsContainer = container.querySelector('.json-editor-items');
        itemsContainer.innerHTML = values.map((item, index) => JsonEditor.renderItem(item, index)).join('');
    },

    /**
     * Trigger change event
     */
    triggerChange: (container) => {
        const event = new CustomEvent('jsoneditor:change', {
            detail: {
                name: container.dataset.name,
                values: JsonEditor.getValues(container.id)
            }
        });
        container.dispatchEvent(event);
    }
};

console.log('json-editor.js loaded');
