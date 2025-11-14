import { Component, inject } from '@angular/core';
import { Location } from '@angular/common';
import { OnInit } from '@angular/core';

@Component({
  selector: 'app-language-switcher',
  imports: [],
  templateUrl: './language-switcher.component.html',
  styleUrl: './language-switcher.component.css',
})
export class LanguageSwitcherComponent implements OnInit {
  private location = inject(Location);

  currentLocale: 'en' | 'es' = 'en';

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

  ngOnInit() {
    if (window.location.pathname.includes('/es/')) {
      this.currentLocale = 'es';
    } else {
      this.currentLocale = 'en';
    }
  }
}
