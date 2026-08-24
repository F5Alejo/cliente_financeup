import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CookieConsentService } from '../../services/cookie-consent';

@Component({
  selector: 'app-cookie-consent',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './cookie-consent.html',
  styleUrl: './cookie-consent.css',
})
export class CookieConsentComponent {
  constructor(public cookieConsentService: CookieConsentService) {}
}
