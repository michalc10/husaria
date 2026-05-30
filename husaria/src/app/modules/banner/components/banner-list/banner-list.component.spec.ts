import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BannerModule } from '../../banner.module';
import { TEST_IMPORTS, TEST_PROVIDERS } from 'src/app/testing/component-test-utils';
import { BannerListComponent } from './banner-list.component';

describe('BannerListComponent', () => {
  let component: BannerListComponent;
  let fixture: ComponentFixture<BannerListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...TEST_IMPORTS, BannerModule],
      providers: TEST_PROVIDERS
    })
    .compileComponents();

    fixture = TestBed.createComponent(BannerListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
