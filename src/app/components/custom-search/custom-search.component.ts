import { Component, OnInit } from '@angular/core';
import { PageComponent } from '../page.component';
import { Store } from '@ngrx/store';
import { AppStore } from '@alfresco/aca-shared/store';
import { ContentManagementService } from '../../services/content-management.service';
import { AppExtensionService } from '@alfresco/aca-shared';

@Component({
  selector: 'aca-custom-search',
  templateUrl: './custom-search.component.html',
  styleUrls: ['./custom-search.component.scss']
})
export class CustomSearchComponent extends PageComponent implements OnInit {
  tabLoadTimes: Date[] = [];
  constructor(
    store: Store<AppStore>,
    content: ContentManagementService,
    extensions: AppExtensionService,
  ) {
    super(store, extensions, content);
  }

  ngOnInit(): void {
    super.ngOnInit();
  }

  getTimeLoaded(index: number) {
    if (!this.tabLoadTimes[index]) {
      this.tabLoadTimes[index] = new Date();
    }

    return this.tabLoadTimes[index];
  }
}
