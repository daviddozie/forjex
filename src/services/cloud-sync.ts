import axios from 'axios';
import { getCloudUrl, loadConfig } from '../utils/config.js';

export interface CloudProjectPayload {
    name: string;
    repoOwner: string;
    repoName: string;
    repoUrl: string;
    description?: string;
    framework?: string;
    template?: string;
    isPrivate?: boolean;
    isLive?: boolean;
    branch?: string;
    addCICD?: boolean;
    deployVercel?: boolean;
    vercelUrl?: string;
}

export class CloudSyncService {
    private cloudUrl: string;

    constructor(customUrl?: string) {
        this.cloudUrl = customUrl || getCloudUrl();
        const url = new URL(this.cloudUrl);
        if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))) {
            throw new Error('Cloud sync requires HTTPS except on localhost');
        }
    }

    /**
     * Synchronizes a newly forged project with the Forjex Cloud Dashboard (Neon PostgreSQL).
     */
    async syncProject(payload: CloudProjectPayload): Promise<{ success: boolean; persisted?: boolean; id?: string }> {
        try {
            const config = loadConfig();
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };
            const token = config?.githubToken || config?.token;
            if (token) headers.Authorization = `Bearer ${token}`;

            const url = `${this.cloudUrl}/api/projects`;
            const response = await axios.post(url, payload, {
                headers,
                timeout: 30000,
            });

            return {
                success: true,
                persisted: response.data?.persisted === true,
                id: response.data?.id,
            };
        } catch (error: any) {
            // Non-fatal: notify without crashing CLI workflow
            return {
                success: false,
            };
        }
    }

    /**
     * Fetches all projects synced to the cloud dashboard and Neon PostgreSQL.
     */
    async getProjects(): Promise<{ dbConnected: boolean; projects: any[]; error?: string }> {
        try {
            const config = loadConfig();
            const headers: Record<string, string> = {};
            const token = config?.githubToken || config?.token;
            if (token) headers.Authorization = `Bearer ${token}`;

            if (config?.vercelToken && config.vercelToken !== 'authenticated') headers['X-Forjex-Vercel-Token'] = config.vercelToken;
            const url = `${this.cloudUrl}/api/projects`;
            const response = await axios.get(url, { headers, timeout: 30000 });
            return response.data;
        } catch (error: any) {
            return {
                dbConnected: false,
                projects: [],
                error: error.message || 'Failed to reach cloud dashboard',
            };
        }
    }

    /**
     * Checks health and database connectivity of the Cloud Dashboard.
     */
    async checkHealth(): Promise<{ connected: boolean; status: string; latency?: string; driver?: string }> {
        try {
            const url = `${this.cloudUrl}/api/health/db`;
            const response = await axios.get(url, { timeout: 4000 });
            return {
                connected: Boolean(response.data?.connected),
                status: response.data?.status || 'unknown',
                latency: response.data?.latencyMs,
                driver: response.data?.driver,
            };
        } catch {
            return {
                connected: false,
                status: 'offline',
            };
        }
    }
}
