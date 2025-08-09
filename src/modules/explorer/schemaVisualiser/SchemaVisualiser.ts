import mermaid from 'mermaid'
import { MemoryDatabase } from '../database/memoryDatabase'

export interface DetailedColumnInfo {
    name: string
    type: string
    isPrimaryKey: boolean
    defaultValue: any
    notNull: boolean
}

export interface ForeignKeyInfo {
    id: number
    seq: number
    referencedTable: string
    fromColumn: string
    toColumn: string
    onUpdate: string
    onDelete: string
    match: string
}

export interface DetailedTableInfo {
    name: string
    columns: DetailedColumnInfo[]
    foreignKeys: ForeignKeyInfo[]
}

export class SchemaVisualiser {
    private initialized = false
    
    constructor(private database: MemoryDatabase) {
        this.initializeMermaid()
    }

    private initializeMermaid() {
        if (this.initialized) return
        
        mermaid.initialize({
            startOnLoad: false,
            theme: 'default',
            securityLevel: 'loose',
            er: {
                diagramPadding: 20,
                layoutDirection: 'TB',
                minEntityWidth: 120,
                minEntityHeight: 80,
                entityPadding: 15,
                stroke: '#666',
                fill: '#f9f9f9',
                fontSize: 12,
                // Relationship line styling
                relationshipLabelColor: '#333',
                relationshipLabelBackground: '#fff',
                relationshipLabelBorder: '#666',
                // Make relationships more visible
                primaryColor: '#4a90e2',
                primaryTextColor: '#333',
                primaryBorderColor: '#666',
                lineColor: '#666',
                arrowheadColor: '#666',
                // Force full width usage
                useMaxWidth: true
            },
            flowchart: {
                useMaxWidth: true,
                htmlLabels: true
            }
        })
        
        this.initialized = true
    }

    async show(container: HTMLElement) {
        container.empty()
        
        try {
            const schema = await this.buildSchema()
            const mermaidCode = this.generateMermaidERD(schema)
            
            // Debug: Log the generated Mermaid code
            console.log('Generated Mermaid ERD Code:', mermaidCode)
            console.log('Schema tables detected:', schema.map(t => ({
                original: t.name,
                escaped: this.escapeMermaidIdentifier(t.name)
            })))
            
            const diagramContainer = container.createDiv({ 
                cls: 'sqlseal-mermaid-container',
                attr: { 
                    id: `mermaid-${Date.now()}` 
                }
            })
            
            const { svg } = await mermaid.render(`diagram-${Date.now()}`, mermaidCode)
            diagramContainer.innerHTML = svg
            
            // Ensure SVG takes full width
            const svgElement = diagramContainer.querySelector('svg')
            if (svgElement) {
                svgElement.setAttribute('width', '100%')
                svgElement.setAttribute('height', '100%')
                svgElement.style.width = '100%'
                svgElement.style.height = '100%'
                svgElement.style.maxWidth = 'none'
                // Set viewBox to preserve aspect ratio while filling container
                const viewBox = svgElement.getAttribute('viewBox')
                if (viewBox) {
                    svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet')
                }
            }
            
            // Add pan and zoom functionality
            this.addPanZoom(diagramContainer)
            
            // Add interactive features
            this.addInteractivity(diagramContainer, schema)
            
            // Remove relationship summary - user requested removal
            
        } catch (error) {
            console.error('Error rendering Mermaid schema:', error)
            console.error('Error details:', {
                message: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined
            })
            
            // Fallback to simple schema display
            this.showFallbackSchema(container, await this.buildSchema())
        }
    }

    private async buildSchema(): Promise<DetailedTableInfo[]> {
        const schema = this.database.getDetailedSchema()
        return schema
    }

    private generateMermaidERD(schema: DetailedTableInfo[]): string {
        let mermaidCode = 'erDiagram\n'
        
        // Define entities with their attributes
        for (const table of schema) {
            const escapedTableName = this.escapeMermaidIdentifier(table.name)
            mermaidCode += `    ${escapedTableName} {\n`
            
            for (const column of table.columns) {
                const typeAnnotation = this.getColumnTypeAnnotation(column)
                const keyAnnotation = this.getKeyAnnotation(column, table.foreignKeys)
                const escapedColumnName = this.escapeMermaidIdentifier(column.name)
                
                mermaidCode += `        ${column.type} ${escapedColumnName}${keyAnnotation}\n`
            }
            
            mermaidCode += '    }\n\n'
        }
        
        // Define relationships based on foreign keys
        const relationships = new Set<string>()
        
        for (const table of schema) {
            for (const fk of table.foreignKeys) {
                // Create a more descriptive relationship with column information
                // Escape column names in the relationship label as well
                const escapedFromColumn = fk.fromColumn.includes(' ') ? `"${fk.fromColumn}"` : fk.fromColumn
                const escapedToColumn = fk.toColumn.includes(' ') ? `"${fk.toColumn}"` : fk.toColumn
                const relationshipLabel = `"${escapedFromColumn} → ${escapedToColumn}"`
                
                // Determine cardinality based on foreign key constraints
                const cardinality = this.determineCardinality(table, fk, schema)
                
                // Escape table names for Mermaid
                const escapedSourceTable = this.escapeMermaidIdentifier(fk.referencedTable)
                const escapedTargetTable = this.escapeMermaidIdentifier(table.name)
                
                const relationship = `    ${escapedSourceTable} ${cardinality} ${escapedTargetTable} : ${relationshipLabel}`
                relationships.add(relationship)
            }
        }
        
        // Add relationships section with clear separation
        if (relationships.size > 0) {
            mermaidCode += '\n    %% Relationships\n'
            mermaidCode += Array.from(relationships).join('\n')
            mermaidCode += '\n'
        }
        
        return mermaidCode
    }

    private escapeMermaidIdentifier(identifier: string): string {
        // Mermaid requires identifiers with spaces or special characters to be quoted
        // Also handle other problematic characters
        
        // Check if identifier contains spaces, hyphens, or other special characters
        const needsQuoting = /[\s\-\.\(\)\[\]{}'"!@#$%^&*+=|\\:;,<>?/~`]/.test(identifier)
        
        if (needsQuoting) {
            // Escape any existing quotes and wrap in quotes
            const escaped = identifier.replace(/"/g, '\\"')
            return `"${escaped}"`
        }
        
        return identifier
    }

    private determineCardinality(table: DetailedTableInfo, fk: ForeignKeyInfo, schema: DetailedTableInfo[]): string {
        // Check if the foreign key column is also a primary key (indicates 1:1 relationship)
        const fkColumn = table.columns.find(col => col.name === fk.fromColumn)
        const isOneToOne = fkColumn?.isPrimaryKey
        
        // Check if there are unique constraints (would also indicate 1:1 or 1:0..1)
        // For now, we'll use simple heuristics:
        
        if (isOneToOne) {
            // One-to-one relationship
            return '||--||'
        } else {
            // Default to one-to-many relationship (most common in normalized databases)
            // Parent (referenced table) to Child (referencing table)
            return '||--o{'
        }
        
        // Future enhancements could include:
        // - Detecting many-to-many through junction tables: }o--o{
        // - Optional relationships with: ||--o|
        // - Zero-or-one relationships with: }o--||
    }

    private getColumnTypeAnnotation(column: DetailedColumnInfo): string {
        const annotations = []
        if (column.notNull) annotations.push('NOT NULL')
        if (column.defaultValue !== null) annotations.push(`DEFAULT ${column.defaultValue}`)
        return annotations.length > 0 ? ` (${annotations.join(', ')})` : ''
    }

    private getKeyAnnotation(column: DetailedColumnInfo, foreignKeys: ForeignKeyInfo[]): string {
        if (column.isPrimaryKey) return ' PK'
        
        const fk = foreignKeys.find(fk => fk.fromColumn === column.name)
        if (fk) return ' FK'
        
        return ''
    }

    private addPanZoom(container: HTMLElement) {
        const svg = container.querySelector('svg')
        if (!svg) return

        // Create zoom and pan state with object references for proper binding
        const zoomRef = { value: 1 }
        const panRef = { x: 0, y: 0 }
        let isDragging = false
        let lastMousePos = { x: 0, y: 0 }

        // Set up SVG for pan/zoom
        svg.style.cursor = 'grab'
        svg.style.overflow = 'hidden'

        // Create a group element to contain all SVG content for transformations
        const existingContent = svg.innerHTML
        svg.innerHTML = `<g class="pan-zoom-group">${existingContent}</g>`
        const panZoomGroup = svg.querySelector('.pan-zoom-group') as SVGGElement

        const updateTransform = () => {
            if (panZoomGroup) {
                panZoomGroup.setAttribute('transform', 
                    `translate(${panRef.x}, ${panRef.y}) scale(${zoomRef.value})`
                )
            }
        }

        // Add zoom controls UI
        this.addZoomControls(container, zoomRef, panRef, updateTransform)

        // Wheel zoom
        svg.addEventListener('wheel', (e) => {
            e.preventDefault()
            
            const rect = svg.getBoundingClientRect()
            const mouseX = e.clientX - rect.left
            const mouseY = e.clientY - rect.top

            const delta = e.deltaY > 0 ? 0.9 : 1.1
            const oldZoom = zoomRef.value
            const newZoom = Math.max(0.1, Math.min(5, oldZoom * delta))

            if (newZoom !== oldZoom) {
                // Calculate mouse position in the transformed coordinate space
                const mouseWorldX = (mouseX - panRef.x) / oldZoom
                const mouseWorldY = (mouseY - panRef.y) / oldZoom
                
                // Update zoom
                zoomRef.value = newZoom
                
                // Adjust pan to keep mouse position fixed in world space
                panRef.x = mouseX - mouseWorldX * newZoom
                panRef.y = mouseY - mouseWorldY * newZoom

                updateTransform()
                this.updateZoomDisplay(container, zoomRef.value)
            }
        })

        // Mouse drag panning
        svg.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Left mouse button
                isDragging = true
                lastMousePos = { x: e.clientX, y: e.clientY }
                svg.style.cursor = 'grabbing'
                e.preventDefault()
            }
        })

        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return
            
            const deltaX = e.clientX - lastMousePos.x
            const deltaY = e.clientY - lastMousePos.y
            
            panRef.x += deltaX
            panRef.y += deltaY
            
            lastMousePos = { x: e.clientX, y: e.clientY }
            updateTransform()
            e.preventDefault()
        }

        const handleMouseUp = () => {
            if (isDragging) {
                isDragging = false
                svg.style.cursor = 'grab'
            }
        }

        // Attach global mouse events for smooth dragging
        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)

        // Touch support for mobile
        let lastTouchPos: { x: number, y: number } | null = null
        let initialTouchDistance: number | null = null
        let initialZoom = zoomRef.value

        svg.addEventListener('touchstart', (e) => {
            e.preventDefault()
            
            if (e.touches.length === 1) {
                // Single touch - panning
                const touch = e.touches[0]
                lastTouchPos = { x: touch.clientX, y: touch.clientY }
            } else if (e.touches.length === 2) {
                // Two finger pinch - zooming
                const touch1 = e.touches[0]
                const touch2 = e.touches[1]
                initialTouchDistance = Math.hypot(
                    touch2.clientX - touch1.clientX,
                    touch2.clientY - touch1.clientY
                )
                initialZoom = zoomRef.value
                lastTouchPos = null
            }
        })

        svg.addEventListener('touchmove', (e) => {
            e.preventDefault()
            
            if (e.touches.length === 1 && lastTouchPos) {
                // Single touch panning
                const touch = e.touches[0]
                const deltaX = touch.clientX - lastTouchPos.x
                const deltaY = touch.clientY - lastTouchPos.y
                
                panRef.x += deltaX
                panRef.y += deltaY
                
                lastTouchPos = { x: touch.clientX, y: touch.clientY }
                updateTransform()
            } else if (e.touches.length === 2 && initialTouchDistance) {
                // Two finger pinch zoom
                const touch1 = e.touches[0]
                const touch2 = e.touches[1]
                const currentDistance = Math.hypot(
                    touch2.clientX - touch1.clientX,
                    touch2.clientY - touch1.clientY
                )
                
                const scale = currentDistance / initialTouchDistance
                zoomRef.value = Math.max(0.1, Math.min(5, initialZoom * scale))
                
                updateTransform()
                this.updateZoomDisplay(container, zoomRef.value)
            }
        })

        svg.addEventListener('touchend', () => {
            lastTouchPos = null
            initialTouchDistance = null
        })

        // Double-click to reset zoom and pan
        svg.addEventListener('dblclick', (e) => {
            e.preventDefault()
            zoomRef.value = 1
            panRef.x = 0
            panRef.y = 0
            updateTransform()
            this.updateZoomDisplay(container, zoomRef.value)
        })

    }

    private addZoomControls(container: HTMLElement, localZoom: { value: number }, localPan: { x: number, y: number }, updateTransform: () => void) {
        const controlsContainer = container.createDiv({ cls: 'sqlseal-zoom-controls' })
        
        // Animation state
        let isAnimating = false
        
        const animateZoom = (targetZoom: number, targetPanX: number, targetPanY: number, duration: number = 200) => {
            if (isAnimating) return
            isAnimating = true
            
            const startZoom = localZoom.value
            const startPanX = localPan.x
            const startPanY = localPan.y
            const startTime = Date.now()
            
            const animate = () => {
                const elapsed = Date.now() - startTime
                const progress = Math.min(elapsed / duration, 1)
                
                // Easing function - ease out cubic
                const easeProgress = 1 - Math.pow(1 - progress, 3)
                
                localZoom.value = startZoom + (targetZoom - startZoom) * easeProgress
                localPan.x = startPanX + (targetPanX - startPanX) * easeProgress
                localPan.y = startPanY + (targetPanY - startPanY) * easeProgress
                
                updateTransform()
                this.updateZoomDisplay(container, localZoom.value)
                
                if (progress < 1) {
                    requestAnimationFrame(animate)
                } else {
                    isAnimating = false
                    // Ensure final values are exact
                    localZoom.value = targetZoom
                    localPan.x = targetPanX
                    localPan.y = targetPanY
                    updateTransform()
                    this.updateZoomDisplay(container, localZoom.value)
                }
            }
            
            requestAnimationFrame(animate)
        }
        
        // Reset button (home) - first
        const resetBtn = controlsContainer.createEl('button', {
            cls: 'sqlseal-zoom-btn',
            text: '⌂',
            attr: { title: 'Reset View' }
        })
        resetBtn.addEventListener('click', () => {
            animateZoom(1, 0, 0, 300)
        })

        // Zoom in button - second
        const zoomInBtn = controlsContainer.createEl('button', {
            cls: 'sqlseal-zoom-btn',
            text: '+',
            attr: { title: 'Zoom In' }
        })
        zoomInBtn.addEventListener('click', () => {
            const newZoom = Math.min(5, localZoom.value * 1.2)
            animateZoom(newZoom, localPan.x, localPan.y, 150)
        })

        // Zoom out button - third
        const zoomOutBtn = controlsContainer.createEl('button', {
            cls: 'sqlseal-zoom-btn',
            text: '−',
            attr: { title: 'Zoom Out' }
        })
        zoomOutBtn.addEventListener('click', () => {
            const newZoom = Math.max(0.1, localZoom.value / 1.2)
            animateZoom(newZoom, localPan.x, localPan.y, 150)
        })

        // Zoom level display
        const zoomDisplay = controlsContainer.createDiv({ 
            cls: 'sqlseal-zoom-display' 
        })
        this.updateZoomDisplay(container, localZoom.value)
    }

    private updateZoomDisplay(container: HTMLElement, zoom: number) {
        const display = container.querySelector('.sqlseal-zoom-display')
        if (display) {
            display.textContent = `${Math.round(zoom * 100)}%`
        }
    }


    private addInteractivity(container: HTMLElement, schema: DetailedTableInfo[]) {
        // Add click handlers for tables to show detailed information
        const tableElements = container.querySelectorAll('[id^="entity-"]')
        
        tableElements.forEach((element, index) => {
            if (index < schema.length) {
                const table = schema[index]
                element.addEventListener('click', () => {
                    this.showTableDetails(table)
                })
                
                element.addEventListener('mouseenter', () => {
                    element.classList.add('highlighted')
                })
                
                element.addEventListener('mouseleave', () => {
                    element.classList.remove('highlighted')
                })
            }
        })
    }

    private showTableDetails(table: DetailedTableInfo) {
        // Create a modal or popup with detailed table information
        const modal = document.createElement('div')
        modal.className = 'sqlseal-table-details-modal'
        
        const content = document.createElement('div')
        content.className = 'sqlseal-modal-content'
        
        const title = document.createElement('h3')
        title.textContent = `Table: ${table.name}`
        content.appendChild(title)
        
        // Columns section
        const columnsTitle = document.createElement('h4')
        columnsTitle.textContent = 'Columns'
        content.appendChild(columnsTitle)
        
        const columnsTable = document.createElement('table')
        columnsTable.className = 'sqlseal-columns-table'
        
        const headerRow = columnsTable.createTHead().insertRow()
        headerRow.insertCell().textContent = 'Name'
        headerRow.insertCell().textContent = 'Type'
        headerRow.insertCell().textContent = 'Key'
        headerRow.insertCell().textContent = 'Nullable'
        headerRow.insertCell().textContent = 'Default'
        
        const tbody = columnsTable.createTBody()
        table.columns.forEach(column => {
            const row = tbody.insertRow()
            row.insertCell().textContent = column.name
            row.insertCell().textContent = column.type
            row.insertCell().textContent = column.isPrimaryKey ? 'PK' : ''
            row.insertCell().textContent = column.notNull ? 'NO' : 'YES'
            row.insertCell().textContent = column.defaultValue || ''
        })
        
        content.appendChild(columnsTable)
        
        // Foreign keys section
        if (table.foreignKeys.length > 0) {
            const fkTitle = document.createElement('h4')
            fkTitle.textContent = 'Foreign Keys'
            content.appendChild(fkTitle)
            
            const fkTable = document.createElement('table')
            fkTable.className = 'sqlseal-fk-table'
            
            const fkHeaderRow = fkTable.createTHead().insertRow()
            fkHeaderRow.insertCell().textContent = 'Column'
            fkHeaderRow.insertCell().textContent = 'References'
            fkHeaderRow.insertCell().textContent = 'On Update'
            fkHeaderRow.insertCell().textContent = 'On Delete'
            
            const fkTbody = fkTable.createTBody()
            table.foreignKeys.forEach(fk => {
                const row = fkTbody.insertRow()
                row.insertCell().textContent = fk.fromColumn
                row.insertCell().textContent = `${fk.referencedTable}.${fk.toColumn}`
                row.insertCell().textContent = fk.onUpdate
                row.insertCell().textContent = fk.onDelete
            })
            
            content.appendChild(fkTable)
        }
        
        // Close button
        const closeBtn = document.createElement('button')
        closeBtn.textContent = '×'
        closeBtn.className = 'sqlseal-modal-close'
        closeBtn.onclick = () => modal.remove()
        
        modal.appendChild(content)
        modal.appendChild(closeBtn)
        document.body.appendChild(modal)
        
        // Close on backdrop click
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove()
        }
    }


    private showFallbackSchema(container: HTMLElement, schema: DetailedTableInfo[]) {
        container.empty()
        
        const fallbackContainer = container.createDiv({ 
            cls: 'sqlseal-fallback-schema' 
        })
        
        const title = fallbackContainer.createEl('h3', { 
            text: 'Database Schema (Fallback View)' 
        })
        
        if (schema.length === 0) {
            fallbackContainer.createEl('p', { 
                text: 'No tables found in the database.',
                cls: 'sqlseal-empty-schema'
            })
            return
        }
        
        schema.forEach(table => {
            const tableContainer = fallbackContainer.createDiv({ 
                cls: 'sqlseal-fallback-table' 
            })
            
            const tableTitle = tableContainer.createEl('h4', { 
                text: table.name,
                cls: 'sqlseal-fallback-table-title'
            })
            
            if (table.columns.length > 0) {
                const columnsTable = tableContainer.createEl('table', {
                    cls: 'sqlseal-fallback-columns-table'
                })
                
                const headerRow = columnsTable.createTHead().insertRow()
                headerRow.insertCell().textContent = 'Column'
                headerRow.insertCell().textContent = 'Type'
                headerRow.insertCell().textContent = 'Key'
                headerRow.insertCell().textContent = 'Constraints'
                
                const tbody = columnsTable.createTBody()
                table.columns.forEach(column => {
                    const row = tbody.insertRow()
                    row.insertCell().textContent = column.name
                    row.insertCell().textContent = column.type
                    
                    let keyType = ''
                    if (column.isPrimaryKey) keyType = 'PK'
                    else if (table.foreignKeys.some(fk => fk.fromColumn === column.name)) keyType = 'FK'
                    row.insertCell().textContent = keyType
                    
                    const constraints = []
                    if (column.notNull) constraints.push('NOT NULL')
                    if (column.defaultValue !== null) constraints.push(`DEFAULT ${column.defaultValue}`)
                    row.insertCell().textContent = constraints.join(', ')
                })
            }
            
            if (table.foreignKeys.length > 0) {
                const fkTitle = tableContainer.createEl('h5', { 
                    text: 'Foreign Keys',
                    cls: 'sqlseal-fallback-fk-title'
                })
                
                const fkList = tableContainer.createEl('ul', {
                    cls: 'sqlseal-fallback-fk-list'
                })
                
                table.foreignKeys.forEach(fk => {
                    const fkItem = fkList.createEl('li')
                    fkItem.textContent = `${fk.fromColumn} → ${fk.referencedTable}.${fk.toColumn}`
                })
            }
        })
    }
}