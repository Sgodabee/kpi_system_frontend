/** Spring Data Page response */
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;       // 0-indexed current page
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}

export interface PageRequest {
  page?: number;
  size?: number;
  sort?: string;
  direction?: 'asc' | 'desc';
}

