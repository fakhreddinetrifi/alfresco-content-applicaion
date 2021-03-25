/*!
 * @license
 * Alfresco Example Content Application
 *
 * Copyright (C) 2005 - 2020 Alfresco Software Limited
 *
 * This file is part of the Alfresco Example Content Application.
 * If the software was purchased under a paid Alfresco license, the terms of
 * the paid license agreement will prevail.  Otherwise, the software is
 * provided under the following open source license terms:
 *
 * The Alfresco Example Content Application is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * The Alfresco Example Content Application is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Alfresco. If not, see <http://www.gnu.org/licenses/>.
 */

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { NavigationExtras, Router } from '@angular/router';
import { PageComponent } from '../page.component';
import { Store } from '@ngrx/store';
import { AppStore } from '@alfresco/aca-shared/store';
import { AppExtensionService } from '@alfresco/aca-shared';
import { ContentManagementService } from '../../services/content-management.service';

@Component({
  selector: 'aca-custom-search',
  templateUrl: './custom-search.component.html',
  styleUrls: ['./custom-search.component.scss']
})
export class CustomSearchComponent extends PageComponent implements OnInit {
  contractForm: FormGroup;
  constructor(
    private fb: FormBuilder,
    private router: Router,
    store: Store<AppStore>,
    extensions: AppExtensionService,
    content: ContentManagementService
  ) {
    super(store, extensions, content);
    this.contractForm = this.fb.group({
      name: [''],
      // contractNumber: [''],
      title: [''],
      // contractDate: [''],
      // contractValue: [''],
      description: [''],
      author: [''],
      tag: [''],
      start: [],
      end: []
    });
  }

  ngOnInit(): void {
    super.ngOnInit();
  }

  onSearchSubmit() {
    const navigationExtras: NavigationExtras = {
      queryParams: {
        name: this.contractForm.value.name.toString(),
        title: this.contractForm.value.title.toString(),
        description: this.contractForm.value.description.toString(),
        author: this.contractForm.value.author.toString(),
        tag: this.contractForm.value.tag.toString(),
        start: this.contractForm.value.start,
        end: this.contractForm.value.end
      }
    };
    this.router.navigate(['search'], navigationExtras);
  }
}
