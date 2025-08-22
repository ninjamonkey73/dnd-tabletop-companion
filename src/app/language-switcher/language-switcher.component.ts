import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { OnInit } from '@angular/core';

@Component({
  selector: 'app-language-switcher',
  imports: [],
  templateUrl: './language-switcher.component.html',
  styleUrl: './language-switcher.component.css',
})
export class LanguageSwitcherComponent implements OnInit {
  currentLocale: 'en' | 'es' = 'en';

  constructor(private location: Location) {}

  ngOnInit() {
    if (window.location.pathname.includes('/es/')) {
      this.currentLocale = 'es';
    } else {
      this.currentLocale = 'en';
    }
  }
}
