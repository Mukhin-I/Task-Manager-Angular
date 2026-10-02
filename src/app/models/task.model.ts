export type TaskStatus = 'new' | 'in_progress' | 'done';

export type TaskFilter = 'all' | TaskStatus;

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: TaskStatus;
  createdAt: string;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
}

export interface UpdateTaskDto {
  status: TaskStatus;
}