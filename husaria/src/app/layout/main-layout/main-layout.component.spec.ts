import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TEST_IMPORTS, TEST_PROVIDERS } from 'src/app/testing/component-test-utils';
import { OfflineStatusComponent } from 'src/app/modules/offline/offline-status/offline-status.component';
import { NavbarComponent } from '../navbar/navbar.component';

import { MainLayoutComponent } from './main-layout.component';

describe('MainLayoutComponent', () => {
  let component: MainLayoutComponent;
  let fixture: ComponentFixture<MainLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MainLayoutComponent, NavbarComponent, OfflineStatusComponent ],
      imports: TEST_IMPORTS,
      providers: TEST_PROVIDERS,
    })
    .compileComponents();

    fixture = TestBed.createComponent(MainLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
