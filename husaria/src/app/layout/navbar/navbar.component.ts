import { Component, OnInit } from '@angular/core';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})

export class NavbarComponent implements OnInit {
  items!: MenuItem[];

  ngOnInit() {
    this.items = [
      {
        label: 'Home', icon: 'pi pi-fw pi-home', url: 'league/league-list', command(event) {
          localStorage.clear();
        },
      },
      {
        label: 'Husarz', icon: 'pi pi-user', url: 'player/player-list', command(event) {
          localStorage.clear();
        },
      }
    ];
  }
}