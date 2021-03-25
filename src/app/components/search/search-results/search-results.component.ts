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

import { Component, OnInit, ViewChild } from '@angular/core';
import { Pagination, MinimalNodeEntity, ResultSetPaging } from '@alfresco/js-api';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { SearchQueryBuilderService, SearchFilterComponent } from '@alfresco/adf-content-services';
import { PageComponent } from '../../page.component';
import { Store } from '@ngrx/store';
import { AppStore, NavigateToFolder, SnackbarErrorAction, showFacetFilter } from '@alfresco/aca-shared/store';
import { ContentManagementService } from '../../../services/content-management.service';
import { AppConfigService, TranslationService } from '@alfresco/adf-core';
import { Observable } from 'rxjs';
import { AppExtensionService } from '@alfresco/aca-shared';
import { DocumentListPresetRef } from '@alfresco/adf-extensions';
import { ZoubliService } from 'src/app/zoubli.service';
import * as jsPDF from 'jspdf';
require('jspdf-autotable');
// import autoTable from 'jspdf-autotable';
// import html2canvas from 'html2canvas';
@Component({
  selector: 'aca-search-results',
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.scss']
})
export class SearchResultsComponent extends PageComponent implements OnInit {
  constructor(
    private queryBuilder: SearchQueryBuilderService,
    private route: ActivatedRoute,
    private config: AppConfigService,
    store: Store<AppStore>,
    extensions: AppExtensionService,
    content: ContentManagementService,
    private translationService: TranslationService,
    public _dataService: ZoubliService,
    private router: Router
  ) {
    super(store, extensions, content);

    queryBuilder.paging = {
      skipCount: 0,
      maxItems: 5
    };
    this.showFacetFilter$ = store.select(showFacetFilter);
  }
  @ViewChild('searchFilter', { static: true })
  searchFilter: SearchFilterComponent;
  show = true;
  showFacetFilter$: Observable<boolean>;
  searchedWord: string;
  queryParamName = 'q';
  data: ResultSetPaging;
  totalResults = 0;
  hasSelectedFilters = false;
  sorting = ['name', 'asc'];
  isLoading = false;
  columns: DocumentListPresetRef[] = [];
  count = 0;
  hidden = false;
  header = [['ID', 'Name', 'Email', 'Profile']];

  tableData = [
    [1, 'John', 'john@yahoo.com', 'HR'],
    [2, 'Angel', 'angel@yahoo.com', 'Marketing'],
    [3, 'Harry', 'harry@yahoo.com', 'Finance'],
    [4, 'Anne', 'anne@yahoo.com', 'Sales'],
    [5, 'Hardy', 'hardy@yahoo.com', 'IT'],
    [6, 'Nikole', 'nikole@yahoo.com', 'Admin'],
    [7, 'Sandra', 'Sandra@yahoo.com', 'Sales'],
    [8, 'Lil', 'lil@yahoo.com', 'Sales']
  ];
  ngOnInit() {
    super.ngOnInit();

    this.count = this._dataService.getOption();
    this.sorting = this.getSorting();
    this.subscriptions.push(
      this.queryBuilder.updated.subscribe((query) => {
        if (query) {
          this.sorting = this.getSorting();
          this.isLoading = true;
        }
      }),
      this.queryBuilder.executed.subscribe((data) => {
        this.queryBuilder.paging.skipCount = 0;
        // this.queryBuilder.paging.maxItems=this.data.list.pagination.totalItems;
        // console.log(data);
        this.onSearchResultLoaded(data);
        this.isLoading = false;
      }),

      this.queryBuilder.error.subscribe((err: any) => {
        this.onSearchError(err);
      })
    );

    if (this.route) {
      this.route.params.forEach((params: Params) => {
        let query: string;
        if (Object.values(params).length !== 0) {
          this.searchedWord = params.hasOwnProperty(this.queryParamName) ? params[this.queryParamName] : null;
          query = this.formatSearchQuery(this.searchedWord);
        } else {
          this.route.queryParams.subscribe((parametre) => {
            const name = parametre['name'];
            const title = parametre['title'];
            const description = parametre['description'];
            const author = parametre['author'];
            const start = parametre['start'];
            const end = parametre['end'];
            const tag = parametre['tag'];
            if (name === '' && title === '' && description === '' && author === '' && start === undefined && end === undefined) {
              query = this.formatSearchQuery('*');
            } else if (start !== undefined && end !== undefined) {
              const date1 = (new Date().getTime() - new Date(start).getTime()) / (1000 * 3600 * 24);
              const date2 = (new Date().getTime() - new Date(end).getTime()) / (1000 * 3600 * 24);
              query = `(cm:name:"${name}*" AND cm:title:"${title}*" AND cm:description:"${description}*" AND cm:author:"${author}*" AND cm:modified:[NOW/DAY-${Math.round(date1)}DAYS TO NOW/DAY+${Math.round(date2)}DAY] AND TAG:"${tag}*")`;
            } else {
              query = `
                (cm:name:"${name}*" AND cm:title:"${title}*" AND cm:description:"${description}*" AND cm:author:"${author}*" AND TAG:"${tag}*")
                OR
                (cm:name:"${name}*" AND cm:title:"${title}*" AND cm:description:"${description}*" AND TAG:"${tag}*")
                OR
                (cm:name:"${name}*" AND cm:title:"${title}*" AND cm:description:"${description}*")
                OR
                (cm:name:"${name}*" AND cm:title:"${title}*" AND cm:description:"${description}*" AND cm:author:"${author}*" AND TAG:"${tag}*")`;
            }
          });
        }
        console.log(query);
        if (query) {
          console.log(decodeURIComponent(query))
          this.queryBuilder.userQuery = decodeURIComponent(query);
          this.queryBuilder.update();
        } else {
          this.queryBuilder.userQuery = null;
          this.queryBuilder.executed.next({
            list: { pagination: { totalItems: 0 }, entries: [] }
          });
        }
      });
    }
  }

  onSearchError(error: { message: any }) {
    const { statusCode } = JSON.parse(error.message).error;

    const messageKey = `APP.BROWSE.SEARCH.ERRORS.${statusCode}`;
    let translated = this.translationService.instant(messageKey);

    if (translated === messageKey) {
      translated = this.translationService.instant(`APP.BROWSE.SEARCH.ERRORS.GENERIC`);
    }

    this.store.dispatch(new SnackbarErrorAction(translated));
  }

  private isOperator(input: string): boolean {
    if (input) {
      input = input.trim().toUpperCase();

      const operators = ['AND', 'OR'];
      return operators.includes(input);
    }
    return false;
  }

  private formatFields(fields: string[], term: string): string {
    let prefix = '';
    let suffix = '*';

    if (term.startsWith('=')) {
      prefix = '=';
      suffix = '';
      term = term.substring(1);
    }

    return '(' + fields.map((field) => `${prefix}${field}:"${term}${suffix}"`).join(' OR ') + ')';
  }

  formatSearchQuery(userInput: string) {
    if (!userInput) {
      return null;
    }

    userInput = userInput.trim();

    if (userInput.includes(':') || userInput.includes('"')) {
      return userInput;
    }

    const fields = this.config.get<string[]>('search.aca:fields', ['cm:name']);
    const words = userInput.split(' ');

    if (words.length > 1) {
      const separator = words.some(this.isOperator) ? ' ' : ' AND ';

      return words
        .map((term) => {
          if (this.isOperator(term)) {
            return term;
          }

          return this.formatFields(fields, term);
        })
        .join(separator);
    }

    return this.formatFields(fields, userInput);
  }

  onSearchResultLoaded(nodePaging: ResultSetPaging) {
    this.data = nodePaging;
    this.totalResults = this.getNumberOfResults();
    this.hasSelectedFilters = this.isFiltered();
  }
  getNumberOfResults() {
    if (this.data && this.data.list && this.data.list.pagination) {
      return this.data.list.pagination.totalItems;
    }

    return 0;
  }

  isFiltered(): boolean {
    return this.searchFilter.selectedBuckets.length > 0 || this.hasCheckedCategories();
  }

  hasCheckedCategories() {
    const checkedCategory = this.queryBuilder.categories.find((category) => !!this.queryBuilder.queryFragments[category.id]);
    return !!checkedCategory;
  }

  onPaginationChanged(pagination: Pagination) {
    this.queryBuilder.paging = {
      maxItems: pagination.maxItems,
      skipCount: pagination.skipCount
    };
    this.queryBuilder.update();
  }
  private getSorting(): string[] {
    const primary = this.queryBuilder.getPrimarySorting();
    if (primary) {
      return [primary.key, primary.ascending ? 'asc' : 'desc'];
    }

    return ['name', 'asc'];
  }

  onNodeDoubleClick(node: MinimalNodeEntity) {
    if (node && node.entry) {
      if (node.entry.isFolder) {
        this.store.dispatch(new NavigateToFolder(node));
        return;
      }

      this.showPreview(node, { location: this.router.url });
    }
  }
  preview(node: MinimalNodeEntity) {
    this.showPreview(node, { location: this.router.url });
  }
  onclick() {
    this.count = this._dataService.getOption();
    // console.log(this.count);
  }
  reload() {
    if (this.count === 2) {
      window.location.reload();
      return true;
    }
    return false;
  }

  export() {
    this.downloadFile();
  }
  loadAllResults() {
    this.isLoading = true;
    this.queryBuilder.paging.maxItems = this.data.list.pagination.totalItems;
    this.queryBuilder.execute();
  }
  downloadFile() {
    this.queryBuilder.executed.subscribe((data) => {
      this.queryBuilder.paging.skipCount = 0;

      this.onSearchResultLoaded(data);
      this.isLoading = false;
    });

    const FileType = this.data.list.entries.map((content) => {
      if (content.entry.isFile === true) {
        return content.entry.content.mimeTypeName;
      } else {
        return 'Folder type';
      }
    });
    const Relevance = this.data.list.entries.map((content) => content.entry.search.score);
    const CreatedAt = this.data.list.entries.map((content) => content.entry.createdAt.toString().substring(0, 25));
    const CreatedBy = this.data.list.entries.map((object) => object.entry.createdByUser.displayName);
    const Name = this.data.list.entries.map((object) => object.entry.name);
    const ModifiedBy = this.data.list.entries.map((object) => object.entry.modifiedByUser.displayName);
    const ModifiedAt = this.data.list.entries.map((object) => {
      return object.entry.modifiedAt.toString().substring(0, 25);
    });
    const Path = this.data.list.entries.map((object) => {
      if (object.entry.path.elements[1] === undefined) {
        return 'no location available';
      } else if (object.entry.path.elements[2] === undefined) {
        return object.entry.path.elements[1].name;
      } else if (object.entry.path.elements[3] === undefined) {
        return object.entry.path.elements[2].name;
      } else if (object.entry.path.elements[4] === undefined) {
        return object.entry.path.elements[3].name;
      } else if (object.entry.path.elements[5] === undefined) {
        return object.entry.path.elements[4].name;
      } else return object.entry.path.elements[5].name;
    });
    const Size = this.data.list.entries.map((object) => {
      let i;
      if (object.entry.isFile === true) {
        if (object.entry.content.sizeInBytes >= 1073741824) {
          i = (object.entry.content.sizeInBytes / 1073741824).toFixed(2) + ' GB';
        } else if (object.entry.content.sizeInBytes >= 1048576) {
          i = (object.entry.content.sizeInBytes / 1048576).toFixed(2) + ' MB';
        } else if (object.entry.content.sizeInBytes >= 1024) {
          i = (object.entry.content.sizeInBytes / 1024).toFixed(2) + ' KB';
        } else if (object.entry.content.sizeInBytes > 1) {
          i = object.entry.content.sizeInBytes + ' bytes';
        } else if (object.entry.content.sizeInBytes == 1) {
          i = object.entry.content.sizeInBytes + ' byte';
        } else {
          i = '0 bytes';
        }
        return i;
      } else return 'folder has no size';
    });
    const Title = this.data.list.entries.map((content) => {
      // tslint:disable-next-line:prettier
      if (content.entry.isFile === true){
        return content.entry.properties['cm:title'];
      } else {
        return 'Folder type Has no Title';
      }
    });
    console.log(Title);
    const output = Name.map((s, i) => ({
      FileName: s,
      Relevance: Relevance[i],
      Title: Title[i],
      CreatedDate: CreatedAt[i],
      Creator: CreatedBy[i],
      Modifier: ModifiedBy[i],
      ModifiedDate: ModifiedAt[i],
      FileType: FileType[i],
      Size: Size[i],
      Location: Path[i]
    }));
    console.log(output);
    const csvData = this.ConvertToCSV(output, [
      'Relevance',
      'FileName',
      'Title',
      'ModifiedDate',
      'Modifier',
      'Creator',
      'CreatedDate',
      'Size',
      'FileType',
      'Location'
    ]);
    const blob = new Blob(['\ufeff' + csvData], { type: 'text/csv;charset=utf-8;' });
    const dwldLink = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const isSafariBrowser = navigator.userAgent.indexOf('Safari') != -1 && navigator.userAgent.indexOf('Chrome') == -1;
    if (isSafariBrowser) {
      //if Safari open in new window to save file with random filename.
      dwldLink.setAttribute('target', '_blank');
    }
    dwldLink.setAttribute('href', url);
    dwldLink.setAttribute('download', 'ZoubliExport' + '.csv');
    dwldLink.style.visibility = 'hidden';
    document.body.appendChild(dwldLink);
    dwldLink.click();
    document.body.removeChild(dwldLink);
  }

  ConvertToCSV(objArray, headerList) {
    const array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
    let str = '';
    let row = 'Index,';

    for (const index in headerList) {
      row += headerList[index] + ',';
    }
    row = row.slice(0, -1);
    str += row + '\r\n';
    for (let i = 0; i < array.length; i++) {
      let line = i + 1 + '';
      for (const index in headerList) {
        const head = headerList[index];

        line += ',' + array[i][head];
      }
      str += line + '\r\n';
    }
    return str;
  }

  generatePdf() {
    const FileType = this.data.list.entries.map((content) => {
      if (content.entry.isFile === true) {
        return content.entry.content.mimeTypeName;
      } else {
        return 'Folder type';
      }
    });
    const Relevance = this.data.list.entries.map((content) => content.entry.search.score);
    const CreatedAt = this.data.list.entries.map((content) => content.entry.createdAt.toString().substring(0, 25));
    const CreatedBy = this.data.list.entries.map((object) => object.entry.createdByUser.displayName);
    const Name = this.data.list.entries.map((object) => object.entry.name);
    const ModifiedBy = this.data.list.entries.map((object) => object.entry.modifiedByUser.displayName);
    const ModifiedAt = this.data.list.entries.map((object) => {
      return object.entry.modifiedAt.toString().substring(0, 25);
    });
    const Path = this.data.list.entries.map((object) => {
      if (object.entry.path.elements[1] === undefined) {
        return 'no location available';
      } else if (object.entry.path.elements[2] === undefined) {
        return object.entry.path.elements[1].name;
      } else if (object.entry.path.elements[3] === undefined) {
        return object.entry.path.elements[2].name;
      } else if (object.entry.path.elements[4] === undefined) {
        return object.entry.path.elements[3].name;
      } else if (object.entry.path.elements[5] === undefined) {
        return object.entry.path.elements[4].name;
      } else return object.entry.path.elements[5].name;
    });
    const Size = this.data.list.entries.map((object) => {
      let i;
      if (object.entry.isFile === true) {
        if (object.entry.content.sizeInBytes >= 1073741824) {
          i = (object.entry.content.sizeInBytes / 1073741824).toFixed(2) + ' GB';
        } else if (object.entry.content.sizeInBytes >= 1048576) {
          i = (object.entry.content.sizeInBytes / 1048576).toFixed(2) + ' MB';
        } else if (object.entry.content.sizeInBytes >= 1024) {
          i = (object.entry.content.sizeInBytes / 1024).toFixed(2) + ' KB';
        } else if (object.entry.content.sizeInBytes > 1) {
          i = object.entry.content.sizeInBytes + ' bytes';
        } else if (object.entry.content.sizeInBytes == 1) {
          i = object.entry.content.sizeInBytes + ' byte';
        } else {
          i = '0 bytes';
        }
        return i;
      } else return 'folder has no size';
    });
    const Title = this.data.list.entries.map((content) => {
      // tslint:disable-next-line:prettier
      if (content.entry.isFile === true){
        return content.entry.properties['cm:title'];
      } else {
        return 'Folder type Has no Title';
      }
    });
    console.log(Title);
    const output = Name.map((s, i) => ({
      FileName: s,
      Relevance: Relevance[i],
      Title: Title[i],
      CreatedDate: CreatedAt[i],
      Creator: CreatedBy[i],
      Modifier: ModifiedBy[i],
      ModifiedDate: ModifiedAt[i],
      FileType: FileType[i],
      Size: Size[i],
      Location: Path[i]
    }));
    console.log(output);
    const pdf = new jsPDF();

    for (let i = 0; i < output.length; i++) {
      console.log(output[i].Relevance); //use i instead of 0
    }
    (pdf as any).autoTable({
      head: [['Relevance', 'FileName', 'Title', 'ModifiedDate', 'Modifier', 'Creator', 'CreatedDate', 'Size', 'FileType', 'Location']],

      theme: 'grid'
    });
    for (let i = 0; i < output.length; i++) {
      (pdf as any).autoTable({
        body: [
          [
            output[i].Relevance,
            output[i].FileName,
            output[i].Title,
            output[i].ModifiedDate,
            output[i].Modifier,
            output[i].Creator,
            output[i].CreatedDate,
            output[i].Size,
            output[i].FileType,
            output[i].Location
          ]
        ],
        theme: 'striped',
        styles: { fontSize: 6.5 },
        didDrawCell: (data) => {
          console.log(data.column.index);
        }
      });
    }

    // Open PDF document in browser's new tab
    pdf.setFontSize(4);
    // Download PDF doc
    pdf.save('ZoubliExport.pdf');
  }
}
