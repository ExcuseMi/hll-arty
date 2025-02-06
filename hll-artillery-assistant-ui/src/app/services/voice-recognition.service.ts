import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
declare var annyang: any;

@Injectable({
  providedIn: 'root'
})
export class VoiceRecognitionService {
  private isListeningSubject = new BehaviorSubject<boolean>(false);
  isListening$ = this.isListeningSubject.asObservable();

  constructor() {}

  initialize(commands: any): void {
    if (annyang) {
      annyang.addCommands(commands);
      annyang.addCallback('result', (phrases: string[]) => {
        console.log('Recognized phrases:', phrases);
      });
    }
  }

  start(): void {
    if (annyang) {
      annyang.start({ autoRestart: true, continuous: true });
      this.isListeningSubject.next(true);
    }
  }

  stop(): void {
    if (annyang) {
      annyang.abort();
      this.isListeningSubject.next(false);
    }
  }
}

