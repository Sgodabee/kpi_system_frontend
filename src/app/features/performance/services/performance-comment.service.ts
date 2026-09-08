import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { PerformanceComment } from '../models/performance-comment.model';

@Injectable({ providedIn: 'root' })
export class PerformanceCommentService {
  private http = inject(HttpClient);
  private recordBase = (id: number) => `${environment.apiV1}/performance/${id}/comments`;

  /** GET /api/v1/performance/{performanceId}/comments */
  getByRecord(recordId: number) {
    return this.http.get<PerformanceComment[]>(this.recordBase(recordId));
  }

  /**
   * POST /api/v1/performance/{performanceId}/comments
   * Body: { content, authorId } — authorId is required by the API
   */
  add(recordId: number, content: string, authorId: number) {
    return this.http.post<PerformanceComment>(this.recordBase(recordId), { content, authorId });
  }

  /**
   * DELETE /api/v1/comments/{id}
   * The API deletes a comment by its own ID (not nested under performance)
   */
  delete(commentId: number) {
    return this.http.delete<void>(`${environment.apiV1}/comments/${commentId}`);
  }

  /**
   * PUT /api/v1/comments/{id}
   */
  update(commentId: number, content: string, authorId: number) {
    return this.http.put<PerformanceComment>(`${environment.apiV1}/comments/${commentId}`, { content, authorId });
  }
}
