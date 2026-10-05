import { Component, DestroyRef, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { BehaviorSubject, catchError, finalize, of, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { TaskListSkeletonComponent } from '../components/task-list-skeleton/task-list-skeleton.component';
import { TaskErrorStateComponent } from '../components/task-error-state/task-error-state.component';
import { TaskEmptyStateComponent } from '../components/task-empty-state/task-empty-state.component';
import { CreateTaskModalComponent } from '../components/create-task-modal/create-task-modal.component';

import {
  Task,
  TaskFilter,
  TaskStatus,
} from '../../../models/task.model';

import { TaskService } from '../../../core/services/task.service';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [
    DatePipe,
    TaskListSkeletonComponent, 
    TaskErrorStateComponent,
    TaskEmptyStateComponent,
    CreateTaskModalComponent,
  ],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.scss',
})
export class TaskListComponent {
  private readonly taskService = inject(TaskService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly filterSubject = new BehaviorSubject<TaskFilter>('all');

  private readonly updatingTaskIds = new Set<number>();
  readonly statusUpdateErrors = new Set<number>();

  readonly filters: TaskFilter[] = [
    'all',
    'new',
    'in_progress',
    'done',
  ];

  readonly statusLabels: Record<TaskStatus, string> = {
    new: 'Новая',
    in_progress: 'В работе',
    done: 'Готово',
  };

  selectedFilter: TaskFilter = 'all';

  tasks: Task[] = [];
  loading = false;
  error = false;

  isCreateModalOpen = false;

  constructor() {
    this.filterSubject
      .pipe(
        switchMap((filter) => {
          this.loading = true;
          this.error = false;

          const status = filter === 'all' ? undefined : filter;

          return this.taskService.getTasks(status).pipe(
            catchError(() => {
              this.error = true;

              return of([]);
            }),
            finalize(() => {
              this.loading = false;
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((tasks) => {
        this.tasks = this.sortTasks(tasks);
      });
  }

  selectFilter(filter: TaskFilter): void {
    if (this.selectedFilter === filter) {
      return;
    }

    this.selectedFilter = filter;
    this.filterSubject.next(filter);
  }

  retry(): void {
    this.filterSubject.next(this.selectedFilter);
  }

  getFilterLabel(filter: TaskFilter): string {
    if (filter === 'all') {
      return 'Все';
    }

    return this.statusLabels[filter];
  }

  getStatusLabel(status: TaskStatus): string {
    return this.statusLabels[status];
  }

  private sortTasks(tasks: Task[]): Task[] {
    return [...tasks].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime(),
    );
  }

  updateTaskStatus(task: Task): void {
  if (task.status === 'done' || this.updatingTaskIds.has(task.id)) {
    return;
  }

  const previousStatus = task.status;

  const nextStatus: TaskStatus =
    previousStatus === 'new' ? 'in_progress' : 'done';

  this.updatingTaskIds.add(task.id);
  this.statusUpdateErrors.delete(task.id);

  task.status = nextStatus;

  this.taskService.updateStatus(task.id, nextStatus).subscribe({
    next: (updatedTask) => {
      const index = this.tasks.findIndex(
        (currentTask) => currentTask.id === task.id,
      );

      if (index !== -1) {
        this.tasks[index] = updatedTask;
      }

      this.updatingTaskIds.delete(task.id);
    },

    error: () => {
      task.status = previousStatus;

      this.updatingTaskIds.delete(task.id);
      this.statusUpdateErrors.add(task.id);
    },
  });
}

  isStatusUpdating(task: Task): boolean {
    return this.updatingTaskIds.has(task.id);
  }

  openCreateModal(): void {
    this.isCreateModalOpen = true;
  }

  closeCreateModal(): void {
    this.isCreateModalOpen = false;
  }

  onTaskCreated(): void {
    this.closeCreateModal();
    this.retry();
  }
}