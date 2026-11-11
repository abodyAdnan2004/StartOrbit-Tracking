export interface PaginatedResponse<T> {
	items: T[];
	pagesCount: number;
	currentPage: number;
	type: string;
	totalItems?: number;
	calculatedTotalPages: number;
	currentPageSize: number;
	totalCount: number;
	totalPages: number;
}
