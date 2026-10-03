import { Component, EventEmitter, Output, inject } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';

import { TaskService } from '../../../../core/services/task.service';
import { CreateTaskDto, Task } from '../../../../models/task.model';

const noWhitespaceValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = control.value as string;
  return value.trim().length > 0 ? null : { whitespace: true };
};

@Component({
  selector: 'app-create-task-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './create-task-modal.component.html',
  styleUrl: './create-task-modal.component.scss',
})
export class CreateTaskModalComponent {
  private readonly taskService = inject(TaskService);

  @Output() closed = new EventEmitter<void>();
  @Output() taskCreated = new EventEmitter<Task>();

  creating = false;
  createError = false;

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

  close(): void {
    if (this.creating) {
      return;
    }
    this.closed.emit();
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
      next: (createdTask) => {
        this.creating = false;
        this.taskCreated.emit(createdTask);
      },
      error: () => {
        this.creating = false;
        this.createError = true;
      },
    });
  }
}