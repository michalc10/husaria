import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BannerModule } from '../../banner.module';
import { TEST_IMPORTS, TEST_PROVIDERS } from 'src/app/testing/component-test-utils';
import { BannerDialogComponent } from './banner-dialog.component';

describe('BannerDialogComponent', () => {
  let component: BannerDialogComponent;
  let fixture: ComponentFixture<BannerDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...TEST_IMPORTS, BannerModule],
      providers: TEST_PROVIDERS
    })
    .compileComponents();

    fixture = TestBed.createComponent(BannerDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
