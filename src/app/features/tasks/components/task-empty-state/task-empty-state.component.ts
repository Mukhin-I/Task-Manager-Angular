import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-task-empty-state',
  standalone: true,
  templateUrl: './task-empty-state.component.html',
  styleUrl: './task-empty-state.component.scss',
})
export class TaskEmptyStateComponent {
  title = input<string>('Задач пока нет');

  description = input<string>('Создайте первую задачу, чтобы начать работу');

  buttonText = input<string>('Создать задачу');

  showButton = input<boolean>(true);

  action = output<void>();

  protected onAction(): void {
    this.action.emit();
  }
}