import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface Question {
  title: string;
  question: string;
  images: string;
  options: string[];
  correct: string | string[];
  questionNumber: number;
  text: string;
  statements?: Statement[];
}
interface Statement {
  text: string;
  userAnswer?: string;
  isCorrect?: boolean;
  correct?: string;
}
@Component({
  selector: 'app-quiz',
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.css']
})
export class QuizComponent implements OnInit {
  questionsData: Question[] = [];
  currentPage: number = 1;
  questionsPerPage: number = 10;
  userAnswers: { [key: number]: string | string[] } = {};
  isSubmitted: boolean = false;
  showModal: boolean = false;
  numCorrect: number = 0;
  

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadQuestions();
  }
  scrollToTop() {
    window.scrollTo(0, 0); // Cuộn lên đầu trang
  }
  scrollToBottom() {
    window.scrollTo(0, document.body.scrollHeight); // Cuộn xuống cuối trang
  }
  
  loadQuestions(): void {
    this.http.get<Question[]>('assets/data/azure-ai-102.json')
      .subscribe(data => {
        // this.questionsData = this.shuffleQuestions(data); //xáo trộn câu
        this.questionsData = data;
      });
  }

  shuffleQuestions(questions: Question[]): Question[] {
    return questions.sort(() => Math.random() - 0.5);
  }

  getJoinedUserAnswers(qIndex: number): string {
    const userAnswer = this.userAnswers[qIndex];
    return Array.isArray(userAnswer) ? userAnswer.join(', ') : userAnswer;
    }
  

  // handleAnswer(questionIndex: number, answer: string): void {
  //   this.userAnswers[questionIndex] = answer;
  //   localStorage.setItem('userAnswers', JSON.stringify(this.userAnswers));
  // }
  handleAnswer(questionIndex: number, answer: string, isCheckbox: boolean = false): void {
    if (isCheckbox) {
      if (!this.userAnswers[questionIndex] || !(this.userAnswers[questionIndex] instanceof Array)) {
        this.userAnswers[questionIndex] = [];
      }
      const answers = this.userAnswers[questionIndex] as string[];
      if (answers.includes(answer)) {
        this.userAnswers[questionIndex] = answers.filter(a => a !== answer);
      } else {
        this.userAnswers[questionIndex] = [...answers, answer];
      }
    } else {
      this.userAnswers[questionIndex] = answer;
    }
    localStorage.setItem('userAnswers', JSON.stringify(this.userAnswers));
  }

  isArray(value: any): value is string[] {
return Array.isArray(value);
}

  countUserAnswers(): number {
    return Object.keys(this.userAnswers).length;
  }

  // submitAnswers(): void {
  //   const unansweredQuestions = this.questionsData.filter((question, index) => !this.userAnswers[index]);
  //   if (unansweredQuestions.length > 0) {
  //     this.showModalFunction();
  //   } else {
  //     this.calculateResults();
  //     this.isSubmitted = true;
  //   }
  // }
  submitAnswers(): void {
    // Kiểm tra xem tất cả các câu hỏi và phát biểu đã được trả lời hay chưa
    const allQuestionsAnswered = this.questionsData.every((question, index) => {
    // Kiểm tra nếu câu hỏi có các phát biểu và tất cả các phát biểu đã được trả lời
    const statementsAnswered = question.statements ? question.statements.every(statement => {
    const answered = !!statement.userAnswer;
    if (!answered) {
    console.log(`Statement not answered: ${statement.text}`);
    }
    return answered;
    }) : true;
    // Kiểm tra nếu câu hỏi đã được trả lời
    const questionAnswered = this.userAnswers[index] !== undefined;
    if (!questionAnswered) {
    console.log(`Question not answered: ${question.question}`);
    }
    return statementsAnswered && questionAnswered;
    });
    
    if (!allQuestionsAnswered) {
    // Nếu có câu hỏi chưa được trả lời, hiển thị modal
    this.showModalFunction();
    } else {
    // Nếu tất cả câu hỏi đã được trả lời, tiến hành tính toán kết quả
    this.calculateResults();
    this.isSubmitted = true;
    }
    }
  formatAnswersWithSpacing(answers: string | string[]): string {
    if (Array.isArray(answers)) {
      return answers.map(answer => answer.trim()).join(', ');
    }
    return answers;
  }
  
  // calculateResults(): void {
  //   this.numCorrect = this.questionsData.reduce((correctCount, question, index) => {
  //     const userAnswer = this.userAnswers[index];
  //     const correctAnswer = question.correct;
  //     if (Array.isArray(correctAnswer)) {
  //       return correctCount + (Array.isArray(userAnswer) && this.arraysEqual(userAnswer, correctAnswer) ? 1 : 0);
  //     } else {
  //       return correctCount + (userAnswer === correctAnswer ? 1 : 0);
  //     }
  //   }, 0);
  // }

  calculateResults(): void {
    this.numCorrect = this.questionsData.reduce((correctCount, question, index) => {
    const userAnswer = this.userAnswers[index];
    const correctAnswer = question.correct;
    let isCorrect = false;
    
    if (Array.isArray(correctAnswer)) {
    if (Array.isArray(userAnswer)) {
    isCorrect = correctAnswer.every(ans => userAnswer.includes(ans)) && userAnswer.length === correctAnswer.length;
    }
    } else {
    isCorrect = userAnswer === correctAnswer;
    }
    
    // Xử lý cho các phát biểu
    if (question.statements) {
    question.statements.forEach(statement => {
    // So sánh trực tiếp giá trị của userAnswer với giá trị trong trường 'correct'
    if (statement.userAnswer) {
    statement.isCorrect = statement.userAnswer === statement.correct;
    }
    });
    }
    
    return correctCount + (isCorrect ? 1 : 0);
    }, 0);
    }
  
  
  arraysEqual(a: string[], b: string[]): boolean {
    if (a.length !== b.length) return false;
    a.sort();
    b.sort();
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  confirmSubmit(): void {
    this.calculateResults();
    this.isSubmitted = true;
    this.hideModal();
  }

  showModalFunction(): void {
    this.showModal = true;
  }

  hideModal(): void {
    this.showModal = false;
  }

  restartQuiz(): void {
    this.isSubmitted = false;
    this.userAnswers = {};
    localStorage.removeItem('userAnswers');
    this.loadQuestions();
  }

  // isSelectedAnswer(questionIndex: number, option: string): boolean {
  //   return this.userAnswers[questionIndex] === option;
  // }

  // isCorrectAnswer(questionIndex: number, option: string): boolean {
  //   return this.questionsData[questionIndex].correct === option;
  // }

  // isWrongAnswer(questionIndex: number, option: string): boolean {
  //   return this.isSelectedAnswer(questionIndex, option) && !this.isCorrectAnswer(questionIndex, option);
  // }
  isSelectedAnswer(questionIndex: number, option: string): boolean {
    const userAnswer = this.userAnswers[questionIndex];
    if (Array.isArray(userAnswer)) {
      return userAnswer.includes(option);
    }
    return userAnswer === option;
  }
  
  isCorrectAnswer(questionIndex: number, userAnswer: string | string[]): boolean {
    const correctAnswers = this.questionsData[questionIndex].correct;
    if (Array.isArray(correctAnswers) && Array.isArray(userAnswer)) {
      // Kiểm tra xem tất cả các đáp án đúng có trong đáp án của người dùng không
      return correctAnswers.every(ans => userAnswer.includes(ans)) && userAnswer.length === correctAnswers.length;
    } else if (Array.isArray(correctAnswers) && typeof userAnswer === 'string') {
      // Kiểm tra xem đáp án của người dùng có bằng đúng một trong các đáp án đúng không
      return correctAnswers.includes(userAnswer);
    } else if (typeof correctAnswers === 'string' && Array.isArray(userAnswer)) {
      // Kiểm tra xem đáp án của người dùng có chứa đáp án đúng không
      return userAnswer.includes(correctAnswers);
    } else {
      // Kiểm tra xem đáp án của người dùng có bằng đáp án đúng không
      return userAnswer === correctAnswers;
    }
  }
  
  
  
  isWrongAnswer(questionIndex: number, userAnswer: string | string[]): boolean {
    return !this.isCorrectAnswer(questionIndex, userAnswer);
  }
  
  // isCorrectCheckboxAnswer(questionIndex: number, option: string): boolean {
  //   const correctAnswers = this.questionsData[questionIndex].correct;
  //   const userAnswer = this.userAnswers[questionIndex] as string[];
  //   return Array.isArray(correctAnswers) && correctAnswers.includes(option) && userAnswer.includes(option);
  // }
  
  // isWrongCheckboxAnswer(questionIndex: number, option: string): boolean {
  //   const correctAnswers = this.questionsData[questionIndex].correct;
  //   const userAnswer = this.userAnswers[questionIndex] as string[];
  //   return Array.isArray(correctAnswers) && correctAnswers.includes(option) && !userAnswer.includes(option);
  // }

  getCurrentQuestions(): Question[] {
    return this.questionsData.slice(
      (this.currentPage - 1) * this.questionsPerPage,
      this.currentPage * this.questionsPerPage
    );
  }

  nextPage(): void {
    if (this.currentPage < Math.ceil(this.questionsData.length / this.questionsPerPage)) {
      this.currentPage++;
    }
  }

  maxPage(): number {
    return Math.ceil(this.questionsData.length / this.questionsPerPage);
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }
  formatTextWithLineBreaks(text: string | null | undefined): string {
    // Kiểm tra xem text có phải là chuỗi không trước khi gọi replace
    return text ? text.replace(/\n/g, '<br>') : '';
    }
}
