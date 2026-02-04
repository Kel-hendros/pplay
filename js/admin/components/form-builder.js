/**
 * Form Builder Component
 * Dynamic form generation utilities
 */

const FormBuilder = {
    /**
     * Create a form group
     */
    group: (label, input, options = {}) => {
        const { hint, required, fullWidth } = options;
        return `
            <div class="form-group ${fullWidth ? 'form-full' : ''}">
                <label class="form-label">
                    ${label}
                    ${required ? '<span style="color: var(--color-error)">*</span>' : ''}
                </label>
                ${input}
                ${hint ? `<small class="form-hint">${hint}</small>` : ''}
            </div>
        `;
    },

    /**
     * Create text input
     */
    text: (name, value = '', options = {}) => {
        const { placeholder, required, disabled } = options;
        return `
            <input
                type="text"
                name="${name}"
                value="${value || ''}"
                class="form-input"
                placeholder="${placeholder || ''}"
                ${required ? 'required' : ''}
                ${disabled ? 'disabled' : ''}
            >
        `;
    },

    /**
     * Create textarea
     */
    textarea: (name, value = '', options = {}) => {
        const { placeholder, rows = 4, large } = options;
        return `
            <textarea
                name="${name}"
                class="form-input form-textarea ${large ? 'large' : ''}"
                placeholder="${placeholder || ''}"
                rows="${rows}"
            >${value || ''}</textarea>
        `;
    },

    /**
     * Create select
     */
    select: (name, options, selectedValue = '') => {
        const optionsHtml = options.map(opt => `
            <option value="${opt.value}" ${opt.value === selectedValue ? 'selected' : ''}>
                ${opt.label}
            </option>
        `).join('');

        return `
            <select name="${name}" class="form-input">
                ${optionsHtml}
            </select>
        `;
    },

    /**
     * Create checkbox
     */
    checkbox: (name, label, checked = false) => {
        return `
            <label class="form-checkbox">
                <input type="checkbox" name="${name}" ${checked ? 'checked' : ''}>
                <span>${label}</span>
            </label>
        `;
    },

    /**
     * Create number input
     */
    number: (name, value = 0, options = {}) => {
        const { min, max, step = 1 } = options;
        return `
            <input
                type="number"
                name="${name}"
                value="${value}"
                class="form-input"
                ${min !== undefined ? `min="${min}"` : ''}
                ${max !== undefined ? `max="${max}"` : ''}
                step="${step}"
            >
        `;
    },

    /**
     * Get form data as object
     */
    getData: (formElement) => {
        const formData = new FormData(formElement);
        const data = {};

        for (const [key, value] of formData.entries()) {
            // Handle nested keys (e.g., "meta.primary_goal")
            if (key.includes('.')) {
                const keys = key.split('.');
                let current = data;
                for (let i = 0; i < keys.length - 1; i++) {
                    if (!current[keys[i]]) current[keys[i]] = {};
                    current = current[keys[i]];
                }
                current[keys[keys.length - 1]] = value;
            } else {
                data[key] = value;
            }
        }

        // Handle checkboxes
        formElement.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            data[checkbox.name] = checkbox.checked;
        });

        return data;
    },

    /**
     * Set form data from object
     */
    setData: (formElement, data, prefix = '') => {
        for (const [key, value] of Object.entries(data)) {
            const fieldName = prefix ? `${prefix}.${key}` : key;

            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                FormBuilder.setData(formElement, value, fieldName);
            } else {
                const field = formElement.querySelector(`[name="${fieldName}"]`);
                if (field) {
                    if (field.type === 'checkbox') {
                        field.checked = Boolean(value);
                    } else {
                        field.value = value || '';
                    }
                }
            }
        }
    }
};

console.log('form-builder.js loaded');
