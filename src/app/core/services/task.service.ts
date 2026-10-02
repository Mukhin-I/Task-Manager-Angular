import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  CreateTaskDto,
  Task,
  TaskStatus,
  UpdateTaskDto,
} from '../../models/task.model';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = 'http://localhost:3000/tasks';

  getTasks(status?: TaskStatus): Observable<Task[]> {
    let params = new HttpParams();

    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<Task[]>(this.apiUrl, { params });
  }

  createTask(task: CreateTaskDto): Observable<Task> {
    return this.http.post<Task>(this.apiUrl, task);
  }

  updateStatus(id: number, status: TaskStatus): Observable<Task> {
    const body: UpdateTaskDto = { status };

    return this.http.patch<Task>(
      `${this.apiUrl}/${id}`,
      body,
    );
  }
}