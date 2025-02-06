import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CalculationService {

  public calculateMils(meters: number, faction: string): number | null {
    let mils: number;
    if (faction === 'russian') {
      mils = this.russianConversion(meters);
    } else if (faction === 'british') {
      mils = this.britishConversion(meters);
    } else {
      mils = this.standardConversion(meters);
    }

    return mils;
  }
  private standardConversion(meters: number): number {
    const A = 1001.465;
    const B = -0.2371;
    return Math.round(A + (B * meters));
  }

  private russianConversion(meters: number): number {
    const A = 1120;
    const B = 21.33;
    const L = 100;
    return Math.round(A - (((meters / L) - 1) * B));
  }

  private britishConversion(meters: number): number {
    const m = -0.1773;
    const b = 550.69;
    return Math.round(m * meters + b);
  }


}
