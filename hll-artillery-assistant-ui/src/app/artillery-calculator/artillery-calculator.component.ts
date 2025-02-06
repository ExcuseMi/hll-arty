import { ChangeDetectionStrategy, Component, input, Input, numberAttribute, OnInit, Output, NgZone } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AudioService } from '../services/audio.service';
import { VoiceRecognitionService } from '../services/voice-recognition.service';
import { Faction } from '../models/faction.model';
import { CalculationHistory } from '../models/calculation-history.model';
import { CalculationService } from '../services/calculation.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-artillery-calculator',
  templateUrl: './artillery-calculator.component.html',
  imports: [FormsModule, CommonModule],
  styleUrls: ['./artillery-calculator.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class ArtilleryCalculatorComponent implements OnInit {
  currentFaction: string = 'us';
  metersInput!: number;
  @Output() status : string = '';
  calculationHistory: CalculationHistory[] = [];
  micPermissionGranted: boolean = false;
  minMeters: number = 100;
  maxMeters: number = 1600;
  conversionResult: string = ""
  isListening: boolean = false;

  factions: { [key: string]: Faction } = {
    us: {
      id: 'us',
      icon: '⭐',
      name: 'U.S.',
      voice: 'us_artillery',
      synonyms: [ 'america', 'united states']
    },
    german: {
      id: 'german',
      icon: '⚔️',
      name: 'Germany',
      voice: 'german_artillery',
      synonyms: ['germany', 'axis']
    },
    british: {
      id: 'british',
      icon: '🇬🇧',
      name: 'U.K.',
      voice: 'british_artillery',
      phrase: 'Artillery standing by, sir',
      synonyms: ['uk', 'common wealth']
    },
    russian: {
      id: 'russian',
      icon: '🇷🇺',
      name: 'Russia',
      voice: 'russian_artillery',
      phrase: 'Comrade, artillery ready',
      synonyms: ['russia']
    }
  };

  constructor(
    private audioService: AudioService,
    private voiceService: VoiceRecognitionService,
    private calculationService: CalculationService,
    private ngZone: NgZone
  ) { }

  ngOnInit(): void {
    this.loadSettings();
    this.setupVoiceCommands();
    this.requestMicrophonePermission();
  }

  calculateMils(meters: number): void {
    if (isNaN(meters) || meters < this.minMeters || meters > this.maxMeters) return;
    this.metersInput = meters;
    let mils : number | null = this.calculationService.calculateMils(meters, this.currentFaction)
    if (mils != null) {
      this.conversionResult = `${ meters }m = ${ mils } mils`;
      this.addToHistory(meters, mils);
      this.audioService.playMils(mils);
      }
   }

  private addToHistory(meters: number, mils: number): void {
    const history: CalculationHistory = {
      meters,
      mils,
      faction: this.currentFaction,
      timestamp: new Date().toISOString()
    };

    this.calculationHistory.unshift(history);
    if (this.calculationHistory.length > 10) {
      this.calculationHistory.pop();
    }
    this.saveSettings();
  }
  clearHistory(): void {
    this.calculationHistory=[];
    this.saveSettings();
  }

  getFactionIcon(faction: string): string {
    return this.factions[faction].icon;
  }

  getFactionName(faction: string): string {
    return this.factions[faction].name;
  }

  getRelativeTime(timestamp: string) {
    const now = new Date();
    const timestamp_date = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - timestamp_date.getTime()) / 1000);

    if (diffInSeconds < 60) {
        return `${diffInSeconds} second${diffInSeconds === 1 ? '' : 's'} ago`;
    } else if (diffInSeconds < 3600) {
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
    } else if (diffInSeconds < 86400) {
        const diffInHours = Math.floor(diffInSeconds / 3600);
        return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    } else {
        const diffInDays = Math.floor(diffInSeconds / 86400);
        return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
    }
}

async changeFaction(faction: string): Promise<void> {
    this.currentFaction = faction;
    await this.audioService.setVoice(this.factions[faction].voice);
    this.audioService.playPhrase('faction_selected');
    this.saveSettings();
  }

  private handleDistanceCommand(input: string): void {
    const meters = parseInt(input);
    if (isNaN(meters) || meters < this.minMeters || meters > this.maxMeters) return;
    this.calculateMils(meters);

  }
  private setupVoiceCommands(): void {
    const commands = {
      'stop *transmission': () => this.stopListening(),
      'end *transmission': () => this.stopListening(),
      'halt *transmission': () => this.stopListening(),
      'faction *team': (team: string) => this.handleFactionCommand(team),
      ':number meters': (number: string) => this.handleDistanceCommand(number),
      ':number': (number: string) => this.handleDistanceCommand(number),
      'repeat *followup': (followup: string) => this.handleLastCommand(followup),
      'previous *followup': (followup: string) => this.handlePreviousCommand(followup)
    };

    this.voiceService.initialize(commands);
  }

  private async requestMicrophonePermission(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      this.micPermissionGranted = true;
    } catch (err) {
      console.error('Microphone permission denied:', err);
      this.micPermissionGranted = false;
    }
  }

  private loadSettings(): void {
    const savedSettings = localStorage.getItem('artillerySettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      this.currentFaction = settings.faction;
      this.calculationHistory = settings.history;
    }
  }

  private saveSettings(): void {
    const settings = {
      faction: this.currentFaction,
      history: this.calculationHistory
    };
    localStorage.setItem('artillerySettings', JSON.stringify(settings));
  }

  private handlePreviousCommand(followup: string): void {
    const followupLower = followup.toLowerCase().trim();
    if (this.fuzzyMatch(followupLower, ['mils', 'mills', 'distance', 'calculation'])) {
      console.log('Previous command triggered');
      if (this.calculationHistory.length > 1) {
        const previousMils = this.calculationHistory[1].mils;
        console.log('Previous mils:', previousMils);
        this.audioService.playMils(previousMils);
      } else {
        console.log('Not enough history for previous');
      }
    }
  }

  private handleLastCommand(followup: string): void {
    const followupLower = followup.toLowerCase().trim();
    if (this.fuzzyMatch(followupLower, ['mils', 'mills', 'distance', 'calculation'])) {
      console.log('Previous command triggered');
      if (this.calculationHistory.length > 1) {
        const previousMils = this.calculationHistory[1].mils;
        console.log('Last mils:', previousMils);
        this.audioService.playMils(previousMils);
      } else {
        console.log('Not enough history for last');
      }
    }
  }
  startListening(): void {
    this.voiceService.start();
    this.isListening = true;
    this.micPermissionGranted = true;
    setTimeout(async () => { await this.audioService.playPhrase('startup'); }, 500);

  }
  stopListening(): void {
    this.voiceService.stop();
    this.isListening = false;

    setTimeout(async () => { await this.audioService.playPhrase('stop_response'); }, 500);
  }

  private fuzzyMatch(input: string, keywords: Array<string>): boolean {
    return keywords.some(keyword => input.includes(keyword));
  }

  private handleFactionCommand(team: string) {
    const teamLower = team.toLowerCase();
    for (let [key, value] of Object.entries(this.factions)) {
      if (teamLower == value.id || (value.synonyms?.includes(teamLower))) {
        this.changeFaction(value.id);
        this.saveSettings();
        return;
        }
    }
  }

  enableNotifications() {
      if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                alert('Notifications enabled! You will now receive updates.');
            } else {
                alert('Notifications permission denied. You can enable it later in your browser settings.');
            }
        });
    } else {
        alert('This browser does not support notifications.');
    }
  }
}
