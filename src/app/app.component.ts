import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { HeaderComponent } from "./pages/header/header.component";
import { LandingComponent } from "./pages/landing/landing.component";
import { FooterComponent } from "./pages/footer/footer.component";
import { SignUpComponent } from "./auth/sign-up/sign-up.component";
import { ForgotPasswordComponent } from "./auth/forgot-password/forgot-password.component";
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})

export class AppComponent {
  title = 'KTT';
}
