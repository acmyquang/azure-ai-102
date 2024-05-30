// src/app/question/question.component.ts

import { Component, Input, Output, EventEmitter } from '@angular/core';

interface Question {
  question: string;
  options: string[];
  correct: string;
}

@Component({
  selector: 'app-question',
  templateUrl: './question.component.html',
  styleUrls: ['./question.component.css']
})
export class QuestionComponent {
  @Input() question: Question = { question: '', options: [], correct: '' };
  @Input() index: number = 0;
  @Output() answer = new EventEmitter<{ index: number, answer: string }>();

  selectAnswer(answer: string): void {
    this.answer.emit({ index: this.index, answer });
  }
}
