import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AudioService {
  private voice = 'us_artillery';
  private digitCache = new Map<string, HTMLAudioElement>();
  private phraseCache = new Map<string, HTMLAudioElement>();
  private radioStatic!: HTMLAudioElement;
  private basePath = 'assets/audio';
  private volume = 1;
  private isPlaying = false;
  private useStaticNoise = true;

  constructor() {
        this.radioStatic = new Audio('assets/audio/effects/radio_noise.mp3');
        this.radioStatic.volume = 0.1;
        this.radioStatic.loop = true;

  }

  ngOnInit(): void {
  }

  async setVoice(voice: string): Promise<void> {
    this.voice = voice;
    await this.preloadDigits();
    await this.preloadPhrases();
  }

  setVolume(volume: number): void {
    this.volume = volume / 100;
    this.radioStatic.volume = 0.1 * this.volume;
  }

  setUseStaticNoise(enabled: boolean): void {
    this.useStaticNoise = enabled;
  }

  private async preloadDigits(): Promise<void> {
    const digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'mils'];
    for (const digit of digits) {
      await this.loadAudio(`${this.basePath}/${this.voice}/digits/${digit}.mp3`, this.digitCache);
    }
  }

  private async preloadPhrases(): Promise<void> {
    const phrases = [
      'startup', 'faction_selected', 'stop_response', 'repeat', 'previous',
      'calculating', 'coordinates_received', 'invalid_distance', 'out_of_range',
      'microphone_error', 'set_target_to', 'set', 'copy','over'
    ];
    for (const phrase of phrases) {
      await this.loadAudio(`${this.basePath}/${this.voice}/phrases/${phrase}.mp3`, this.phraseCache);
    }
  }

  private async loadAudio(path: string, cache: Map<string, HTMLAudioElement>): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!cache.has(path)) {
        const audio = new Audio(path);
        audio.addEventListener('canplaythrough', () => {
          cache.set(path, audio);
          resolve();
        }, { once: true });
        audio.addEventListener('error', () => {
          reject(new Error(`Failed to load audio: ${path}`));
        }, { once: true });
      } else {
        resolve();
      }
    });
  }

  async playMils(mils: number): Promise<void> {
    const digits = String(mils).split('');
    for (const digit of digits) {
      await this.playAudio('digit', digit);
      await this.delay(50);
    }
    await this.playAudio('phrase', 'over');

    if (this.useStaticNoise) {
      setTimeout(() => {
        this.radioStatic.pause();
        this.isPlaying = false;
      }, 500);
    }
  }

  async playPhrase(phrase: string): Promise<void> {
    try {
      await this.playAudio('phrase', phrase);
      if (this.useStaticNoise) {
        setTimeout(() => {
          this.radioStatic.pause();
          this.isPlaying = false;
        }, 150);
      }
    } catch (error) {
      console.error('Error playing phrase:', error);
    }
  }

  private async playAudio(type: 'digit' | 'phrase', key: string): Promise<void> {
    const cache = type === 'digit' ? this.digitCache : this.phraseCache;
    const path = `${this.basePath}/${this.voice}/${type}s/${key}.mp3`;

    if (!cache.has(path)) {
      try {
        await this.loadAudio(path, cache);
      } catch (error) {
        console.error(error);
        return;
      }
    }

    const audio = cache.get(path)!;
    audio.volume = this.volume;

    if (this.useStaticNoise && !this.isPlaying) {
      this.radioStatic.currentTime = 0;
      this.radioStatic.play();
      this.isPlaying = true;
    }

    return new Promise((resolve) => {
      audio.addEventListener('ended', () => {
        resolve();
      }, { once: true });
      audio.play();
    });
  }
  private async speakFactionSelected() {
    await this.playPhrase('faction_selected');
}
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
