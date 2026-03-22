export type DatabaseSchema = {
    files: Files 
    links: Links
    tags: Tags
    tasks: Tasks
}

export type Files = {
    id: string
    name: string
    path: string
    created_at: Date
    modified_at: Date
    file_size: number
}

export type Links = {
    path: string
    target: string
    position: string
    display_text: string
    target_exists: boolean
}

export type Tags = {
    tag: string
    fileId: string
    path: string
}

export type Tasks = {
    checkbox: string
    task: string
    completed: string
    filePath: string
    path: string
    position: string
    heading: string
    heading_level: string
}