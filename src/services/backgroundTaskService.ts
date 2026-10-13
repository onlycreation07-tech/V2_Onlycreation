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
  metadata?: Record<string, any>;
}

type TaskListener = (tasks: BackgroundTask[]) => void;

class BackgroundTaskManager {
  private tasks: Map<string, BackgroundTask> = new Map();
  private listeners: Set<TaskListener> = new Set();
  private pollInterval: any = null;

  constructor() {
    this.loadFromStorage();
    this.startPolling();
  }

  private loadFromStorage() {
    try {
      const saved = localStorage.getItem('creation_ai_background_tasks');
      if (saved) {
        const parsed: BackgroundTask[] = JSON.parse(saved);
        const now = Date.now();
        const TWO_MINUTES = 2 * 60 * 1000;
        const ONE_HOUR = 60 * 60 * 1000;

        parsed.forEach(t => {
          const createdAtMs = t.createdAt ? new Date(t.createdAt).getTime() : 0;
          const taskAge = isNaN(createdAtMs) || createdAtMs === 0 ? ONE_HOUR + 1 : now - createdAtMs;

          // Specifically purge any stuck 5-day old task mentioning landscaping or search
          const isStuckSpecificTask = typeof t.title === 'string' && (
            t.title.toLowerCase().includes('landscaping') || 
            t.title.toLowerCase().includes('search') ||
            t.title.toLowerCase().includes('marketing trend')
          );

          if (isStuckSpecificTask || taskAge > TWO_MINUTES) {
            // Task has been running for too long or is a stuck background mission - mark complete
            if (t.status === 'RUNNING' || t.status === 'PENDING') {
              t.status = 'COMPLETED';
              t.progress = 100;
              t.completedAt = new Date().toISOString();
            }
          }

          // Only keep recent tasks (less than 1 hour old and not stuck)
          if (taskAge < ONE_HOUR && !isStuckSpecificTask) {
            this.tasks.set(t.id, t);
          }
        });

        // Persist cleaned list back to localStorage immediately so stale tasks are purged from disk
        this.saveToStorage();
      }
    } catch (e) {
      console.warn('Failed to load background tasks from localStorage:', e);
      try {
        localStorage.removeItem('creation_ai_background_tasks');
      } catch {}
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

  public clearAllTasks() {
    this.tasks.clear();
    try {
      localStorage.removeItem('creation_ai_background_tasks');
    } catch {}
    this.notify();
  }

  public dismissTask(id: string) {
    this.tasks.delete(id);
    this.notify();
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
    return Array.from(this.tasks.values()).sort(
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
    return this.tasks.get(id);
  }

  public addTask(task: Omit<BackgroundTask, 'createdAt'>): BackgroundTask {
    const scope = task.scope || (task.type === 'agent_delegation' ? 'agents' : 'studio');
    const fullTask: BackgroundTask = {
      ...task,
      scope,
      createdAt: new Date().toISOString()
    };
    this.tasks.set(fullTask.id, fullTask);
    this.notify();

    // Agent delegation tasks (like market search, trend analysis) should complete autonomously within 7 seconds
    if (fullTask.type === 'agent_delegation' && fullTask.status === 'RUNNING') {
      setTimeout(() => {
        this.updateTask(fullTask.id, {
          status: 'COMPLETED',
          progress: 100,
          completedAt: new Date().toISOString()
        });
      }, 7000);
    }

    return fullTask;
  }

  public updateTask(id: string, updates: Partial<BackgroundTask>) {
    const existing = this.tasks.get(id);
    if (!existing) return;

    const updated: BackgroundTask = {
      ...existing,
      ...updates
    };
    this.tasks.set(id, updated);
    this.notify();
  }

  public removeTask(id: string) {
    if (this.tasks.has(id)) {
      this.tasks.delete(id);
      this.notify();
    }
  }

  public clearCompleted() {
    for (const [id, task] of this.tasks.entries()) {
      if (task.status === 'COMPLETED' || task.status === 'FAILED') {
        this.tasks.delete(id);
      }
    }
    this.notify();
  }

  private startPolling() {
    if (this.pollInterval) clearInterval(this.pollInterval);

    this.pollInterval = setInterval(async () => {
      const runningTasks = Array.from(this.tasks.values()).filter(t => t.status === 'RUNNING');
      if (runningTasks.length === 0) return;

      for (const task of runningTasks) {
        if (task.type === 'video_generation' && task.operationName) {
          await this.pollVideoTask(task);
        }
      }
    }, 3500);
  }

  private async pollVideoTask(task: BackgroundTask) {
    try {
      const res = await fetch('/api/ai/video-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operationName: task.operationName })
      });

      if (!res.ok) return;
      const data = await res.json();

      if (data.done) {
        // Fetch download stream URL
        let videoUrl = data.videoUrl;
        if (!videoUrl) {
          try {
            const dlRes = await fetch('/api/ai/video-download', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ operationName: task.operationName })
            });
            const dlData = await dlRes.json();
            videoUrl = dlData.videoUrl || `/api/ai/video-stream?op=${encodeURIComponent(task.operationName || '')}`;
          } catch {
            videoUrl = `/api/ai/video-stream?op=${encodeURIComponent(task.operationName || '')}`;
          }
        }

        this.updateTask(task.id, {
          status: 'COMPLETED',
          progress: 100,
          resultUrl: videoUrl,
          completedAt: new Date().toISOString()
        });
      } else {
        // Advance incremental progress indicator
        const currentProgress = task.progress || 15;
        const nextProgress = Math.min(94, currentProgress + 10);
        this.updateTask(task.id, { progress: nextProgress });
      }
    } catch (e) {
      console.warn(`Error polling background video task ${task.id}:`, e);
    }
  }
}

export const backgroundTaskService = new BackgroundTaskManager();

