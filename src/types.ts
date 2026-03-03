// Type definitions for GNOME Shell Extension
export interface ExtensionMetadata {
    uuid: string;
    name: string;
    description: string;
    version: number;
    path: string;
    dir: any;
}

export interface JiraTask {
    id: string;
    key: string;
}

export interface JiraSearchResponse {
    issues: Array<{
        id: string;
        key: string;
    }>;
    errorMessages?: string[];
    warningMessages?: string[];
}

export interface JiraConfig {
    url: string;
    email: string;
    auth: string;
    checkInterval: number;
    webhookUrl?: string;
}
