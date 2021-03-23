import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomSearchResultComponent } from './custom-search-result.component';

describe('CustomSearchResultComponent', () => {
  let component: CustomSearchResultComponent;
  let fixture: ComponentFixture<CustomSearchResultComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomSearchResultComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomSearchResultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
