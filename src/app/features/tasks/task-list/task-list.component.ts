import { Component, DestroyRef, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { BehaviorSubject, catchError, finalize, of, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { TaskListSkeletonComponent } from '../components/task-list-skeleton/task-list-skeleton.component';
import { TaskErrorStateComponent } from '../components/task-error-state/task-error-state.component';

import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';

import {
  CreateTaskDto,
  Task,
  TaskFilter,
  TaskStatus,
} from '../../../models/task.model';

import { TaskService } from '../../../core/services/task.service';

const noWhitespaceValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = control.value as string;

  return value.trim().length > 0 ? null : { whitespace: true };
};

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [
    DatePipe,
    ReactiveFormsModule, 
    TaskListSkeletonComponent, 
    TaskErrorStateComponent,
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

  readonly taskForm = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.maxLength(100),
        noWhitespaceValidator,
      ],
    }),
    description: new FormControl('', {
      nonNullable: true,
    }),
  });

creating = false;
createError = false;

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

  createTask(): void {
    this.taskForm.markAllAsTouched();

    if (this.taskForm.invalid || this.creating) {
      return;
    }

    const title = this.taskForm.controls.title.value.trim();
    const description = this.taskForm.controls.description.value.trim();

    const task: CreateTaskDto = {
      title,
      ...(description ? { description } : {}),
      status: 'new',
      createdAt: new Date().toISOString(),
    };

    this.creating = true;
    this.createError = false;

    this.taskService.createTask(task).subscribe({
      next: () => {
        this.creating = false;
        this.isCreateModalOpen = false;
        this.taskForm.reset();

        this.retry();
      },
      error: () => {
        this.creating = false;
        this.createError = true;
      },
    });
  }

  updateTaskStatus(task: Task): void {
    if (task.status === 'done' || this.updatingTaskIds.has(task.id)) {
      return;
    }

    const nextStatus: TaskStatus =
      task.status === 'new' ? 'in_progress' : 'done';

    this.updatingTaskIds.add(task.id);
    this.statusUpdateErrors.delete(task.id);

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
        this.updatingTaskIds.delete(task.id);
        this.statusUpdateErrors.add(task.id);
      },
    });
  }

  isStatusUpdating(task: Task): boolean {
    return this.updatingTaskIds.has(task.id);
  }

  getNextStatusLabel(status: TaskStatus): string | null {
    if (status === 'new') {
      return 'В работу';
    }

    if (status === 'in_progress') {
      return 'Завершить';
    }

    return null;
  }

  openCreateModal(): void {
    this.isCreateModalOpen = true;
  }

  closeCreateModal(): void {
    if (this.creating) {
      return;
    }

    this.isCreateModalOpen = false;
    this.taskForm.reset();
  }
}