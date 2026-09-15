import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';

export type EntityTableColumnType = 'text' | 'date' | 'status';

export interface EntityTableColumn {
  name: string;
  prop: string;
  type?: EntityTableColumnType;
  width?: number;
  minWidth?: number;
}

@Component({
  selector: 'app-entity-table',
  standalone: true,
  imports: [CommonModule, NgxDatatableModule, DatePipe],
  templateUrl: './entity-table.component.html',
  styleUrl: './entity-table.component.css',
})
export class EntityTableComponent {
  @Input({ required: true }) columns: EntityTableColumn[] = [];
  @Input({ required: true }) rows: any[] = [];
  @Input() loading = false;
  @Input() totalCount = 0;
  @Input() pageSize = 10;
  @Input() pageOffset = 0;
  @Input() showUpdateAction = true;
  @Input() showDeleteAction = true;

  get totalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize);
  }

  get currentPage(): number {
    return this.pageOffset + 1;
  }

  protected readonly Math = Math;

  @Output() rowSelected = new EventEmitter<any>();
  @Output() updateRequested = new EventEmitter<any>();
  @Output() deleteRequested = new EventEmitter<any>();
  @Output() pageChanged = new EventEmitter<{ offset: number; limit: number }>();

  onRowActivate(event: { type: string; row: any }): void {
    if (event.type !== 'click') {
      return;
    }

    this.rowSelected.emit(event.row);
  }

  onUpdate(event: MouseEvent, row: any): void {
    event.stopPropagation();
    this.updateRequested.emit(row);
  }

  onDelete(event: MouseEvent, row: any): void {
    event.stopPropagation();
    this.deleteRequested.emit(row);
  }

  onPage(event: { offset: number; limit?: number }): void {
    this.pageChanged.emit({
      offset: event.offset,
      limit: event.limit ?? this.pageSize,
    });
  }

  statusBadgeClass(value: unknown): string {
    const normalized = String(value ?? '').toLowerCase();

    if (normalized === 'active') return 'badge-success';
    if (normalized === 'inactive') return 'badge-neutral';
    if (normalized === 'transferred') return 'badge-info';
    if (normalized === 'deceased') return 'badge-error';

    return 'badge-ghost';
  }
}
