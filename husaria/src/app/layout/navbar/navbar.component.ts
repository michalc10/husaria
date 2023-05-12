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
      { label: 'Home', icon: 'pi pi-fw pi-home', url: 'league/league-list' },
      { label: 'Szabla', icon: 'pi pi-fw pi-calendar', url: 'tournament/sabre' },
      { label: 'Pałasz', icon: 'pi pi-fw pi-pencil', url: 'tournament/broadsword' },
      { label: 'Kopia', icon: 'pi pi-fw pi-file', url: 'tournament/lance' },
      { label: 'Husarz', icon: 'pi pi-user', url: 'player/player-list' }
    ];
  }
}