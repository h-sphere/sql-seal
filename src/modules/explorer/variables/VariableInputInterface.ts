/**
 * Interface for managing SQL variable inputs in the SQLSeal Explorer
 * Creates input fields for detected variables and manages their values
 */
export class VariableInputInterface {
    private container: HTMLElement;
    private variables: string[] = [];
    private values: Record<string, string> = {};
    private changeCallback: (values: Record<string, string>) => void = () => {};

    constructor(container: HTMLElement) {
        this.container = container;
    }

    /**
     * Set the callback function to be called when variable values change
     * @param callback - Function to call with updated variable values
     */
    onChange(callback: (values: Record<string, string>) => void): void {
        this.changeCallback = callback;
    }

    /**
     * Update the interface with new variables
     * @param variables - Array of variable names (without @ prefix)
     */
    setVariables(variables: string[]): void {
        
        // Only update if variables actually changed to avoid unnecessary re-renders
        if (this.areVariablesEqual(this.variables, variables)) {
            return;
        }
        
        this.variables = variables;
        
        // Preserve existing values for variables that still exist
        const newValues: Record<string, string> = {};
        for (const variable of variables) {
            newValues[variable] = this.values[variable] || '';
        }
        this.values = newValues;
        
        this.render();
    }

    /**
     * Check if two variable arrays are equal
     * @param arr1 - First array
     * @param arr2 - Second array
     * @returns True if arrays contain the same variables
     */
    private areVariablesEqual(arr1: string[], arr2: string[]): boolean {
        if (arr1.length !== arr2.length) return false;
        const sorted1 = [...arr1].sort();
        const sorted2 = [...arr2].sort();
        return sorted1.every((val, index) => val === sorted2[index]);
    }

    /**
     * Get current variable values
     * @returns Object mapping variable names to their values
     */
    getValues(): Record<string, string> {
        return { ...this.values };
    }

    /**
     * Set variable values programmatically
     * @param values - Object mapping variable names to their values
     */
    setValues(values: Record<string, string>): void {
        this.values = { ...this.values, ...values };
        this.render();
    }

    /**
     * Show the interface
     */
    show(): void {
        this.container.style.display = 'block';
    }

    /**
     * Hide the interface
     */
    hide(): void {
        this.container.style.display = 'none';
    }

    /**
     * Clear the interface
     */
    clear(): void {
        this.variables = [];
        this.values = {};
        this.render();
    }

    private render(): void {
        this.container.empty();

        if (this.variables.length === 0) {
            this.hide();
            return;
        }

        this.show();

        // Create header
        const header = this.container.createDiv({ cls: 'sqlseal-variables-header' });
        header.createEl('h4', { text: 'Query Variables' });

        // Create input fields for each variable
        const inputsContainer = this.container.createDiv({ cls: 'sqlseal-variables-inputs' });

        for (const variable of this.variables) {
            const fieldContainer = inputsContainer.createDiv({ cls: 'sqlseal-variable-field' });
            
            // Label (inline with input)
            const label = fieldContainer.createEl('label', { 
                cls: 'sqlseal-variable-label',
                text: `@${variable}`
            });
            label.setAttribute('for', `var-${variable}`);

            // Input
            const input = fieldContainer.createEl('input', {
                cls: 'sqlseal-variable-input',
                type: 'text',
                attr: {
                    id: `var-${variable}`,
                    placeholder: `Enter value...`
                }
            });

            input.value = this.values[variable] || '';

            // Add change listener
            input.addEventListener('input', (event) => {
                const target = event.target as HTMLInputElement;
                this.values[variable] = target.value;
                this.changeCallback(this.getValues());
            });

            input.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    // Trigger change to notify parent that user wants to execute
                    this.changeCallback(this.getValues());
                }
            });
        }
    }
}