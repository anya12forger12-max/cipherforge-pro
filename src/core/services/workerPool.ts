import { loggingSystem } from '../security/loggingSystem';
import { resourceMonitor } from '../security/resourceMonitor';

export interface WorkerTask<T = unknown> {
  id: string;
  type: string;
  data: T;
  priority: 'low' | 'normal' | 'high';
  createdAt: Date;
  timeoutMs?: number;
}

export interface WorkerResult<R = unknown> {
  taskId: string;
  success: boolean;
  result?: R;
  error?: string;
  duration: number;
  completedAt: Date;
}

export interface WorkerPoolConfig {
  maxWorkers: number;
  maxQueueSize: number;
  defaultTimeoutMs: number;
  enableProgressReporting: boolean;
}

export type TaskHandler<T = unknown, R = unknown> = (data: T, signal: AbortSignal) => Promise<R> | R;
export type ProgressCallback = (taskId: string, progress: number) => void;

const DEFAULT_CONFIG: WorkerPoolConfig = {
  maxWorkers: Math.min(4, navigator.hardwareConcurrency || 2),
  maxQueueSize: 100,
  defaultTimeoutMs: 30000,
  enableProgressReporting: true
};

interface RunningTask {
  id: string;
  type: string;
  startedAt: Date;
  abortController: AbortController;
  timeoutId?: number;
}

interface QueuedTask<T = unknown> {
  task: WorkerTask<T>;
  resolve: (result: WorkerResult) => void;
}

export class WorkerPool {
  private config: WorkerPoolConfig;
  private handlers: Map<string, TaskHandler> = new Map();
  private queue: QueuedTask[] = [];
  private running: Map<string, RunningTask> = new Map();
  private results: Map<string, WorkerResult> = new Map();
  private progressCallbacks: Map<string, ProgressCallback> = new Map();

  constructor(config?: Partial<WorkerPoolConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  registerHandler<T, R>(type: string, handler: TaskHandler<T, R>): void {
    this.handlers.set(type, handler as TaskHandler);
    loggingSystem.debug('WorkerPool', `Registered handler for task type: ${type}`);
  }

  unregisterHandler(type: string): boolean {
    return this.handlers.delete(type);
  }

  submit<T, R>(
    type: string,
    data: T,
    options?: {
      priority?: WorkerTask['priority'];
      timeoutMs?: number;
      taskId?: string;
      onProgress?: ProgressCallback;
    }
  ): Promise<WorkerResult<R>> {
    const handler = this.handlers.get(type);
    if (!handler) {
      return Promise.resolve({
        taskId: options?.taskId || `task-${Date.now()}`,
        success: false,
        error: `No handler registered for task type: ${type}`,
        duration: 0,
        completedAt: new Date()
      });
    }

    if (this.running.size >= this.config.maxWorkers) {
      if (this.queue.length >= this.config.maxQueueSize) {
        return Promise.resolve({
          taskId: options?.taskId || `task-${Date.now()}`,
          success: false,
          error: 'Queue is full',
          duration: 0,
          completedAt: new Date()
        });
      }

      const taskId = options?.taskId || `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const task: WorkerTask<T> = {
        id: taskId,
        type,
        data,
        priority: options?.priority || 'normal',
        createdAt: new Date(),
        timeoutMs: options?.timeoutMs
      };

      if (options?.onProgress) {
        this.progressCallbacks.set(taskId, options.onProgress);
      }

      return new Promise<WorkerResult<R>>((resolve) => {
        this.queue.push({ task, resolve: resolve as (r: WorkerResult) => void });
        this.queue.sort((a, b) => {
          const prio: Record<string, number> = { high: 3, normal: 2, low: 1 };
          return (prio[b.task.priority] || 0) - (prio[a.task.priority] || 0);
        });
        loggingSystem.debug('WorkerPool', `Queued task ${taskId} (queue: ${this.queue.length})`);
      });
    }

    return this.executeTask<T, R>(type, data, options);
  }

  private async executeTask<T, R>(
    type: string,
    data: T,
    options?: {
      priority?: WorkerTask['priority'];
      timeoutMs?: number;
      taskId?: string;
      onProgress?: ProgressCallback;
    }
  ): Promise<WorkerResult<R>> {
    const taskId = options?.taskId || `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const handler = this.handlers.get(type)!;
    const abortController = new AbortController();
    const startTime = performance.now();

    const runningTask: RunningTask = {
      id: taskId,
      type,
      startedAt: new Date(),
      abortController
    };

    const timeoutMs = options?.timeoutMs || this.config.defaultTimeoutMs;
    if (timeoutMs > 0) {
      runningTask.timeoutId = window.setTimeout(() => {
        abortController.abort();
      }, timeoutMs);
    }

    this.running.set(taskId, runningTask);
    resourceMonitor.startTask(`worker-${taskId}`);

    try {
      if (options?.onProgress) {
        options.onProgress(taskId, 0);
      }

      const result = await handler(data, abortController.signal);

      if (options?.onProgress) {
        options.onProgress(taskId, 100);
      }

      const duration = performance.now() - startTime;
      const workerResult: WorkerResult<R> = {
        taskId,
        success: true,
        result: result as R,
        duration,
        completedAt: new Date()
      };

      this.results.set(taskId, workerResult as unknown as WorkerResult);
      loggingSystem.debug('WorkerPool', `Task ${taskId} completed in ${duration.toFixed(1)}ms`);
      return workerResult;

    } catch (err) {
      const duration = performance.now() - startTime;
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      const workerResult: WorkerResult<R> = {
        taskId,
        success: false,
        error: errorMsg,
        duration,
        completedAt: new Date()
      };

      this.results.set(taskId, workerResult as unknown as WorkerResult);
      loggingSystem.warn('WorkerPool', `Task ${taskId} failed: ${errorMsg}`);
      return workerResult;

    } finally {
      if (runningTask.timeoutId) clearTimeout(runningTask.timeoutId);
      this.running.delete(taskId);
      resourceMonitor.endTask(`worker-${taskId}`);
      this.progressCallbacks.delete(taskId);
      this.processQueue();
    }
  }

  private processQueue(): void {
    while (this.running.size < this.config.maxWorkers && this.queue.length > 0) {
      const queued = this.queue.shift()!;
      const handler = this.handlers.get(queued.task.type);
      if (handler) {
        this.executeTask(queued.task.type, queued.task.data, {
          priority: queued.task.priority,
          timeoutMs: queued.task.timeoutMs,
          taskId: queued.task.id,
          onProgress: this.progressCallbacks.get(queued.task.id)
        }).then(result => queued.resolve(result));
      }
    }
  }

  cancelTask(taskId: string): boolean {
    const running = this.running.get(taskId);
    if (running) {
      running.abortController.abort();
      return true;
    }

    const queueIdx = this.queue.findIndex(t => t.task.id === taskId);
    if (queueIdx >= 0) {
      const queued = this.queue.splice(queueIdx, 1)[0];
      queued.resolve({
        taskId: queued.task.id,
        success: false,
        error: 'Task cancelled',
        duration: 0,
        completedAt: new Date()
      });
      return true;
    }

    return false;
  }

  cancelAll(): void {
    for (const [, running] of this.running) {
      running.abortController.abort();
    }
    for (const queued of this.queue) {
      queued.resolve({
        taskId: queued.task.id,
        success: false,
        error: 'Pool shutting down',
        duration: 0,
        completedAt: new Date()
      });
    }
    this.queue = [];
  }

  getRunningTasks(): RunningTask[] {
    return Array.from(this.running.values());
  }

  getQueuedTasks(): WorkerTask[] {
    return this.queue.map(q => q.task);
  }

  getResult(taskId: string): WorkerResult | undefined {
    return this.results.get(taskId);
  }

  getStats(): {
    running: number;
    queued: number;
    completed: number;
    registeredHandlers: string[];
  } {
    return {
      running: this.running.size,
      queued: this.queue.length,
      completed: this.results.size,
      registeredHandlers: Array.from(this.handlers.keys())
    };
  }

  destroy(): void {
    this.cancelAll();
    this.handlers.clear();
    this.results.clear();
    this.progressCallbacks.clear();
  }
}

export const workerPool = new WorkerPool();
