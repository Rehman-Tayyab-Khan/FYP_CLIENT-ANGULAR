import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  forwardRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-searchable-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './searchable-select.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SearchableSelectComponent),
      multi: true,
    },
  ],
})
export class SearchableSelectComponent implements ControlValueAccessor {
  @Input() items: any[] | null = [];
  @Input() bindLabel: string = 'name';
  @Input() bindValue: string = 'id';
  @Input() placeholder: string = 'Select...';
  @Input() loading: boolean = false;

  // Custom formats for specialized display
  @Input() format: 'default' | 'patient' = 'default';

  @Output() search = new EventEmitter<string>();

  isOpen = false;
  searchText = '';
  selectedValue: any = null;
  selectedItem: any = null;
  isDisabled = false;

  onChange: any = () => {};
  onTouched: any = () => {};

  private searchSubject = new Subject<string>();

  constructor(private elementRef: ElementRef) {
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((term) => {
        this.search.emit(term);
      });
  }

  get displayValue(): string {
    if (!this.selectedItem) return '';
    return this.getLabel(this.selectedItem);
  }

  getLabel(item: any): string {
    if (!item) return '';
    if (this.format === 'patient') {
      return `${item.first_name} ${item.last_name}`;
    }
    return item[this.bindLabel] || '';
  }

  getSubLabel(item: any): string {
    if (!item) return '';
    if (this.format === 'patient') {
      return `DOB: ${item.date_of_birth} • ${item.gender}`;
    }
    return '';
  }

  writeValue(obj: any): void {
    this.selectedValue = obj ?? null;
    this.updateSelectedItem();
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.isDisabled = isDisabled;

    if (isDisabled) {
      this.isOpen = false;
    }
  }

  ngOnChanges() {
    this.updateSelectedItem();
  }

  updateSelectedItem() {
    if (!this.items) {
      this.selectedItem = null;
      return;
    }

    if (this.selectedValue !== null && this.selectedValue !== undefined) {
      const match = this.items.find((i) =>
        this.valuesEqual(i?.[this.bindValue], this.selectedValue),
      );
      this.selectedItem = match || null;
      return;
    }

    this.selectedItem = null;
  }

  valuesEqual(left: any, right: any): boolean {
    if (left === right) {
      return true;
    }

    if (
      left === null ||
      left === undefined ||
      right === null ||
      right === undefined
    ) {
      return false;
    }

    return String(left) === String(right);
  }

  onSearchInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchText = value;
    this.searchSubject.next(value);
  }

  toggleOpen() {
    if (this.isDisabled) {
      return;
    }

    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.searchText = '';
      this.search.emit('');
      // Update selected item list implicitly when opened
    }
  }

  selectItem(item: any) {
    if (this.isDisabled) {
      return;
    }

    this.selectedValue = item[this.bindValue];
    this.selectedItem = item;
    this.onChange(this.selectedValue);
    this.onTouched();
    this.isOpen = false;
  }

  clearSelection(event: Event) {
    event.stopPropagation();

    if (this.isDisabled) {
      return;
    }

    this.selectedValue = null;
    this.selectedItem = null;
    this.onChange(null);
    this.search.emit('');
  }

  @HostListener('document:click', ['$event'])
  clickOutside(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
      this.onTouched();
    }
  }
}
