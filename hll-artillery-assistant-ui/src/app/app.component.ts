import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ArtilleryCalculatorComponent } from './artillery-calculator/artillery-calculator.component';

@Component({
  selector: 'app-root',
  imports: [ArtilleryCalculatorComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'hll-artillery-assistant-ui';
}
