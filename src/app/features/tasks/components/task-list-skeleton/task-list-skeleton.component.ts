import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'app-task-list-skeleton',
  standalone: true,
  templateUrl: './task-list-skeleton.component.html',
  styleUrl: './task-list-skeleton.component.scss',
})
export class TaskListSkeletonComponent {
  count = input<number>(6);

  protected items = computed(() => Array.from({ length: this.count() }));
}