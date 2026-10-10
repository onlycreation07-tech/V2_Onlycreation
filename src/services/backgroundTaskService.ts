import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { geminiService } from './geminiService';
import { apiFetch } from './apiClient';
export interface BackgroundTask {
  id: string;
  type: 'video_generation' | 'image_batch' | 'agent_delegation' | 'audio_processing';
  scope?: 'studio' | 'agents';
  title: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  progress?: number;
  operationName?: string;
  resultUrl?: string;
  resultData?: any;
  error?: string;
  createdAt: string;
  completedAt?: string;
  ownerId?: string;
  metadata?: Record<string, any>;
}

type TaskListener = (tasks: BackgroundTask[]) => void;

class BackgroundTaskManager {
  private tasks: Map<string, BackgroundTask> = new Map();
  private listeners: Set<TaskListener> = new Set();
  private pollInterval: any = null;
  private polling = false;

  constructor() {
    this.loadFromStorage();
    this.startPolling();
    onAuthStateChanged(auth, async user => {
      this.notify();
      if (!user) return;
      try {
        const response = await apiFetch('/api/ai/jobs');
        if (!response.ok) return;
        const { jobs } = await response.json();
        for (const job of jobs.filter((j: any) => j.type === 'video')) {
          this.tasks.set(`video_${job.id}`, {
            id: `video_${job.id}`, ownerId: user.uid, scope: 'studio', type: 'video_generation',
            title: job.prompt?.slice(0, 40) || 'Veo video', operationName: job.id,
            status: job.status === 'COMPLETED' ? 'COMPLETED' : job.status === 'FAILED' ? 'FAILED' : 'RUNNING',
            resultUrl: job.assetUrl, error: job.error, createdAt: new Date(job.createdAt).toISOString()
          });
        }
        this.notify();
      } catch { /* Retry when the user signs in or checks the library again. */ }
    });
  }

  private loadFromStorage() {
    try {
      const saved = localStorage.getItem('creation_ai_background_tasks');
      if (saved) {
        const parsed: BackgroundTask[] = JSON.parse(saved);
        parsed.forEach(t => this.tasks.set(t.id, t));
      }
    } catch (e) {
      console.warn('Failed to load background tasks from localStorage:', e);
    }
  }

  private saveToStorage() {
    try {
      const arr = Array.from(this.tasks.values());
      localStorage.setItem('creation_ai_background_tasks', JSON.stringify(arr.slice(-30)));
    } catch (e) {
      console.warn('Failed to save background tasks to localStorage:', e);
    }
  }

  private notify() {
    const taskList = this.getAllTasks();
    this.saveToStorage();
    this.listeners.forEach(fn => fn(taskList));
  }

  public subscribe(listener: TaskListener): () => void {
    this.listeners.add(listener);
    listener(this.getAllTasks());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getAllTasks(): BackgroundTask[] {
    if (!auth.currentUser) return [];
    return Array.from(this.tasks.values()).filter(t => t.ownerId === auth.currentUser?.uid).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getStudioTasks(): BackgroundTask[] {
    return this.getAllTasks().filter(t => 
      t.scope === 'studio' || t.type === 'video_generation' || t.type === 'image_batch' || t.type === 'audio_processing'
    );
  }

  public getAgentTasks(): BackgroundTask[] {
    return this.getAllTasks().filter(t => 
      t.scope === 'agents' || t.type === 'agent_delegation'
    );
  }

  public getTask(id: string): BackgroundTask | undefined {
    const task = this.tasks.get(id);
    return auth.currentUser && task?.ownerId === auth.currentUser.uid ? task : undefined;
  }

  public addTask(task: Omit<BackgroundTask, 'createdAt'>): BackgroundTask {
    const scope = task.scope || (task.type === 'agent_delegation' ? 'agents' : 'studio');
    const fullTask: BackgroundTask = {
      ...task,
      ownerId: auth.currentUser?.uid,
      scope,
      createdAt: new Date().toISOString()
    };
    this.tasks.set(fullTask.id, fullTask);
    this.notify();
    return fullTask;
  }

  public updateTask(id: string, updates: Partial<BackgroundTask>) {
    const existing = this.getTask(id);
    if (!existing) return;

    const updated: BackgroundTask = {
      ...existing,
      ...updates
    };
    this.tasks.set(id, updated);
    this.notify();
  }

  public removeTask(id: string) {
    if (this.getTask(id)) {
      this.tasks.delete(id);
      this.notify();
    }
  }

  public clearCompleted() {
    for (const task of this.getAllTasks()) {
      const id = task.id;
      if (task.status === 'COMPLETED' || task.status === 'FAILED') {
        this.tasks.delete(id);
      }
    }
    this.notify();
  }

  private startPolling() {
    if (this.pollInterval) clearInterval(this.pollInterval);

    this.pollInterval = setInterval(async () => {
      if (this.polling || !auth.currentUser) return;
      this.polling = true;
      try {
        for (const task of this.getAllTasks().filter(t => t.status === 'RUNNING' && t.type === 'video_generation' && t.operationName)) {
          await this.pollVideoTask(task);
        }
      } finally { this.polling = false; }
    }, 10_000);
  }

  private async pollVideoTask(task: BackgroundTask) {
    try {
      if (Date.now() - new Date(task.createdAt).getTime() > 30 * 60 * 1000) throw new Error('Video job timed out. Contact support before retrying.');
      const data = await geminiService.checkVideoStatus(task.operationName!);
      if (data.error || data.status === 'FAILED') { this.updateTask(task.id, { status: 'FAILED', error: data.error || 'Video generation failed.' }); return; }
      if (data.done) {
        const videoUrl = await geminiService.downloadVideo(task.operationName!);
        this.updateTask(task.id, { status: 'COMPLETED', progress: 100, resultUrl: videoUrl, completedAt: new Date().toISOString() });
      }
    } catch (error: any) {
      if (Date.now() - new Date(task.createdAt).getTime() > 30 * 60 * 1000) this.updateTask(task.id, { status: 'FAILED', error: error.message });
      // Transient network/provider failures do not falsely complete or fail the job.
      console.warn('Video status temporarily unavailable');
    }
  }

}

export const backgroundTaskService = new BackgroundTaskManager();

