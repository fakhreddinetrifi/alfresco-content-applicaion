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
      maxItems: 25
    };
    this.showFacetFilter$ = store.select(showFacetFilter);
  }
  @ViewChild('searchFilter', { static: true })
  searchFilter: SearchFilterComponent;
  show = true;
  parametre = [];
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
  EXCEL_TYPE: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
  EXCEL_EXTENSION: '.xlsx';
  displayedColumns: string[] = ['name', 'age', 'address', 'subject', 'email'];
  context: any;

  studentData = [
    {
      names: ['jhon', 'deo'],
      ages: [19, 20],
      address: ['pattan', 'baramulla'],
      subjects: ['Eng', 'Math', 'Science'],
      emails: ['jeo@email.com', 'deo@email.com']
    }
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
            if (start !== undefined && end !== undefined) {
              const date1 = (new Date().getTime() - new Date(start).getTime()) / (1000 * 3600 * 24);
              const date2 = (new Date().getTime() - new Date(end).getTime()) / (1000 * 3600 * 24);
              query = `(cm:name:"${name}*" AND cm:title:"${title}*" AND cm:description:"${description}*" AND cm:author:"${author}*" AND cm:modified:[NOW/DAY-${Math.round(date1)}DAYS TO NOW/DAY-${Math.round(date2)}DAY])`;
            } else {
              query = `(cm:name:"${name}*" AND cm:title:"${title}*" AND cm:description:"${description}*" AND cm:author:"${author}*") OR (cm:name:"${name}*" AND cm:title:"${title}*" AND cm:description:"${description}*")`;
            }
          });
        }
        console.log(query)
        if (query) {
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
    this.parametre = this.data.list.entries;
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

  hideSearchFilter() {
    return !this.totalResults && !this.hasSelectedFilters;
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

  // exportToExcel() {
  //   console.log(this.data.list.entries);
  //   // this.exportAsExcelFile(this.data.list.entries, 'eoubli');
  //   // const workSheet = XLSX.utils.table_to_sheet(this.data.list.entries);
  //   // const workBook: XLSX.WorkBook = XLSX.utils.book_new();
  //   // XLSX.utils.book_append_sheet(workBook, workSheet, 'SheetName');
  //   // XLSX.writeFile(workBook, 'filename.xlsx');
  //   // Second Attempt
  //   // const wb = XLSX.utils.book_new();
  //   // const ws = XLSX.utils.json_to_sheet(this.data.list.entries);
  //   // XLSX.utils.book_append_sheet(wb, ws, 'test');
  //   // XLSX.writeFile(wb, `${'fileName'}.xlsx`);
  //   //Third Attempt
  // }
  export() {
    this.downloadFile();
  }

  downloadFile() {
    console.log(this.data.list.entries[0].entry);
    // this.context = this.data.list.entries.map((object) => object.entry.createdByUser.displayName);
    // console.log(this.context);

    // const csvData = this.ConvertToCSV(
    //   this.data.list.entries.map((object) => object.entry),
    //   ['name', 'createdAt', 'modifiedAt']
    // );
    // const csvData2 = this.ConvertToCSV(
    //   this.data.list.entries.map((object) => object.entry.createdByUser),
    //   ['displayName']
    // );
    // const csvData3 = this.ConvertToCSV(
    //   this.data.list.entries.map((object) => object.entry.content),
    //   ['mimeTypeName']
    // );
    // const csvData4 = this.ConvertToCSV(
    //   // tslint:disable-next-line:prettier
    //   this.data.list.entries.map((object) => object.entry.path),
    //   ['name']
    // );
    console.log(this.data.list.entries[0].entry.content.mimeType);

    const filet = this.data.list.entries.map((content) => content.entry.createdAt);
    const filet2 = this.data.list.entries.map((object) => object.entry.createdByUser.displayName);
    const filet3 = this.data.list.entries.map((object) => object.entry.name);
    const filet4 = this.data.list.entries.map((object) => object.entry.modifiedByUser.displayName);
    const filet5 = this.data.list.entries.map((object) => {
      return object.entry.modifiedAt;
    });
    const filet6 = this.data.list.entries.map((object) => {
      return object.entry.modifiedByUser.displayName;
    });
    const output = filet.map((s, i) => ({
      CreatedAt: s,
      CreatedBy: filet2[i],
      Name: filet3[i],
      ModifiedBy: filet4[i],
      ModifiedAt: filet5[i],
      shade5: filet6[i]
    }));
    console.log(output);
    const csvData = this.ConvertToCSV(output, ['CreatedAt', 'CreatedBy', 'Name', 'ModifiedBy', 'ModifiedAt']);
    const blob = new Blob(['\ufeff' + csvData], { type: 'text/csv;charset=utf-8;' });
    const dwldLink = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const isSafariBrowser = navigator.userAgent.indexOf('Safari') != -1 && navigator.userAgent.indexOf('Chrome') == -1;
    if (isSafariBrowser) {
      //if Safari open in new window to save file with random filename.
      dwldLink.setAttribute('target', '_blank');
    }
    dwldLink.setAttribute('href', url);
    dwldLink.setAttribute('download', 'filename' + '.csv');
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
}
// exportToCsv(filename: string, rows: object[]) {
//   if (!rows || !rows.length) {
//     return;
//   }
//   const usersJson: any[] = Array.of(this.data.list.entries);
//   console.log(usersJson);
// const separator = ',';
// const keys = Object.keys(rows[0]);
// // const csvContent =
// //   keys.join(separator) +
// //   '\n' +
// //   rows
// //     .map((row) => {
// //       return keys
// //         .map((k) => {
// //           let cell = row[k] === null || row[k] === undefined ? '' : row[k];
// //           cell = cell instanceof Date ? cell.toLocaleString() : cell.toString().replace(/"/g, '""');
// //           if (cell.search(/("|,|\n)/g) >= 0) {
// //             cell = `"${cell}"`;
// //           }
// //           return cell;
// //         })
// //         .join(separator);
// //     })
// //     .join('\n');

// const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
// if (navigator.msSaveBlob) {
//   // IE 10+
//   navigator.msSaveBlob(blob, filename);
// } else {
//   const link = document.createElement('a');
//   if (link.download !== undefined) {
//     // Browsers that support HTML5 download attribute
//     const url = URL.createObjectURL(blob);
//     link.setAttribute('href', url);
//     link.setAttribute('download', filename);
//     link.style.visibility = 'hidden';
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//   }
