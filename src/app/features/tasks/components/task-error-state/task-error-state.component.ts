import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-task-error-state',
  standalone: true,
  templateUrl: './task-error-state.component.html',
  styleUrl: './task-error-state.component.scss',
})
export class TaskErrorStateComponent {
  title = input<string>('Не удалось загрузить данные');

  description = input<string>('Произошла ошибка при загрузке списка задач');

  buttonText = input<string>('Попробовать снова');

  retry = output<void>();

  protected onRetry(): void {
    this.retry.emit();
  }
}