import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})

export class NavbarComponent implements OnInit {
  items!: MenuItem[];

  constructor(private router: Router){}
  
  ngOnInit() {
    this.items = [
      {
        label: 'Home', 
        icon: 'pi pi-fw pi-home',
        command: (event) => {
          localStorage.clear();
          this.router.navigate(['/league/league-list']);
        },
      },
      {
        label: 'Husarz', 
        icon: 'pi pi-user',
        command: (event) => {
          localStorage.clear();
          this.router.navigate(['/player/player-list']);
        },
      }
    ];
  }
}