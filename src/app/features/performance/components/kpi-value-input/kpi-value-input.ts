import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { KpiDataType } from '../../models/performance-record.model';

@Component({
  selector: 'kpi-value-input',
  standalone: true,
  imports: [FormsModule],
  template: `
<div class="kvi-root">
  @switch (dataType) {
    @case ('PERCENTAGE') {
      <div class="kvi-wrap">
        <input type="number" min="0" max="1000" step="0.01"
               class="kvi-input" [ngModel]="value"
               (ngModelChange)="valueChange.emit($event)"
               [disabled]="readonly" placeholder="0.0" />
        <span class="kvi-addon">%</span>
      </div>
    }
    @case ('NUMBER') {
      <input type="number" step="0.01"
             class="kvi-input" [ngModel]="value"
             (ngModelChange)="valueChange.emit($event)"
             [disabled]="readonly" placeholder="0" />
    }
    @case ('CURRENCY') {
      <div class="kvi-wrap">
        <span class="kvi-addon kvi-prefix">R</span>
        <input type="number" min="0" step="0.01"
               class="kvi-input kvi-currency" [ngModel]="value"
               (ngModelChange)="valueChange.emit($event)"
               [disabled]="readonly" placeholder="0.00" />
      </div>
    }
    @case ('BOOLEAN') {
      <div class="kvi-radio-group">
        <label class="kvi-radio" [class.selected]="value === 1">
          <input type="radio" name="boolInput" [checked]="value === 1"
                 (change)="valueChange.emit(1)" [disabled]="readonly" />
          <span class="kvi-radio-label">Yes</span>
        </label>
        <label class="kvi-radio" [class.selected]="value === 0">
          <input type="radio" name="boolInput" [checked]="value === 0"
                 (change)="valueChange.emit(0)" [disabled]="readonly" />
          <span class="kvi-radio-label">No</span>
        </label>
      </div>
    }
    @case ('TEXT') {
      <textarea class="kvi-textarea" rows="4" [ngModel]="textValue"
                (ngModelChange)="textValueChange.emit($event)"
                [disabled]="readonly"
                placeholder="Enter your response…"></textarea>
    }
    @default {
      <input type="number" step="0.01" class="kvi-input"
             [ngModel]="value" (ngModelChange)="valueChange.emit($event)"
             [disabled]="readonly" placeholder="0" />
    }
  }
</div>
  `,
  styles: [`
.kvi-root    { display: block; }
.kvi-wrap    { display: flex; align-items: center; border: 1.5px solid var(--border-color); border-radius: 9px; overflow: hidden; background: white; transition: border-color .15s; }
.kvi-wrap:focus-within { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-ring); }
.kvi-input   { border: 1.5px solid var(--border-color); border-radius: 9px; padding: 10px 14px; font-size: 1rem; font-weight: 600; color: var(--gray-900); width: 100%; outline: none; transition: all .15s; font-family: inherit; background: white; }
.kvi-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-ring); }
.kvi-input:disabled { background: var(--gray-50); color: var(--text-secondary); }
.kvi-wrap .kvi-input { border: none; border-radius: 0; box-shadow: none; }
.kvi-addon   { padding: 10px 14px; background: var(--gray-100); color: var(--text-secondary); font-weight: 700; font-size: 0.9375rem; white-space: nowrap; }
.kvi-prefix  { border-right: 1px solid var(--border-color); }
.kvi-currency { text-align: right; }
.kvi-radio-group { display: flex; gap: 12px; }
.kvi-radio   { display: flex; align-items: center; gap: 8px; border: 1.5px solid var(--border-color); border-radius: 9px; padding: 10px 20px; cursor: pointer; transition: all .15s; }
.kvi-radio.selected { border-color: var(--primary); background: var(--primary-50); color: var(--primary); }
.kvi-radio input { display: none; }
.kvi-radio-label { font-weight: 600; font-size: 0.9375rem; }
.kvi-textarea { width: 100%; border: 1.5px solid var(--border-color); border-radius: 9px; padding: 12px 14px; font-size: 0.9375rem; font-family: inherit; color: var(--gray-900); resize: vertical; outline: none; transition: all .15s; }
.kvi-textarea:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-ring); }
  `]
})
export class KpiValueInput {
  @Input() dataType: KpiDataType = 'NUMBER';
  @Input() value: number | null = null;
  @Input() textValue: string | null = null;
  @Input() readonly = false;
  @Output() valueChange      = new EventEmitter<number | null>();
  @Output() textValueChange  = new EventEmitter<string | null>();
}

