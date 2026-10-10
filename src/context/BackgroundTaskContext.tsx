import React, { createContext, useContext, useState, useEffect } from 'react';
import { BackgroundTask, backgroundTaskService } from '../services/backgroundTaskService';

interface BackgroundTaskContextType {
  tasks: BackgroundTask[];
  runningCount: number;
  addTask: (task: Omit<BackgroundTask, 'createdAt'>) => BackgroundTask;
  updateTask: (id: string, updates: Partial<BackgroundTask>) => void;
  getTask: (id: string) => BackgroundTask | undefined;
  clearCompleted: () => void;
}

const BackgroundTaskContext = createContext<BackgroundTaskContextType | null>(null);

export function BackgroundTaskProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<BackgroundTask[]>(() => backgroundTaskService.getAllTasks());

  useEffect(() => {
    const unsubscribe = backgroundTaskService.subscribe((updatedTasks) => {
      setTasks([...updatedTasks]);
    });
    return unsubscribe;
  }, []);

  const runningCount = tasks.filter(t => t.status === 'RUNNING' || t.status === 'PENDING').length;

  const addTask = (task: Omit<BackgroundTask, 'createdAt'>) => {
    return backgroundTaskService.addTask(task);
  };

  const updateTask = (id: string, updates: Partial<BackgroundTask>) => {
    backgroundTaskService.updateTask(id, updates);
  };

  const getTask = (id: string) => {
    return backgroundTaskService.getTask(id);
  };

  const clearCompleted = () => {
    backgroundTaskService.clearCompleted();
  };

  return (
    <BackgroundTaskContext.Provider
      value={{
        tasks,
        runningCount,
        addTask,
        updateTask,
        getTask,
        clearCompleted
      }}
    >
      {children}
    </BackgroundTaskContext.Provider>
  );
}

export function useBackgroundTasks() {
  const ctx = useContext(BackgroundTaskContext);
  if (!ctx) {
    throw new Error('useBackgroundTasks must be used within a BackgroundTaskProvider');
  }
  return ctx;
}
