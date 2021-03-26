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
      'cm:name': [''],
      // contractNumber: [''],
      'cm:title': [''],
      // contractDate: [''],
      // contractValue: [''],
      'cm:description': [''],
      'cm:author': [''],
      'cm:creator': [''],
      TAG: [''],
      start: [],
      end: []
    });
  }

  ngOnInit(): void {
    super.ngOnInit();
  }

  onSearchSubmit() {

    let obj = '{';
    Object.entries(this.contractForm.value).filter(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined && key !== 'start' && key !== 'end') {
        console.log(key)
        obj += '"' + key + '"' + ': ' + '"' + value + '"' + ', ';
      }
    });
    if (this.contractForm.value.start !== null && this.contractForm.value.end !== null) {
      const date1 = (new Date().getTime() - new Date(this.contractForm.value.start).getTime()) / (1000 * 3600 * 24);
      const date2 = (new Date().getTime() - new Date(this.contractForm.value.end).getTime()) / (1000 * 3600 * 24);
      obj += '"cm:modified":"[NOW/DAY-' + Math.round(date1) + 'DAYS TO NOW/DAY+' + Math.round(date2) + 'DAY]", ';
    }
    console.log(obj)
    const navigationExtras: NavigationExtras = {
      queryParams: JSON.parse(obj.substring(0, obj.length - 2) + '}')
    };
    this.router.navigate(['search'], navigationExtras);
  }
}
