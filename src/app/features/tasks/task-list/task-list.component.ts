import { Component, DestroyRef, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { BehaviorSubject, catchError, distinctUntilChanged, finalize, of, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Task, TaskFilter, TaskStatus } from '../../../models/task.model';
import { TaskService } from '../../../core/services/task.service';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.scss',
})
export class TaskListComponent {
  private readonly taskService = inject(TaskService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly filterSubject = new BehaviorSubject<TaskFilter>('all');

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
}