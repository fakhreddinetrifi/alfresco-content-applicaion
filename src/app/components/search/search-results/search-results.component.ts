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
import autoTable from 'jspdf-autotable';
import { DatePipe } from '@angular/common';
// import * as XLSX from 'xlsx';
import * as fs from 'file-saver';
import { Workbook } from 'exceljs';
require('jspdf-autotable');
require('exceljs');

// import autoTable from 'jspdf-autotable';
// import html2canvas from 'html2canvas';
@Component({
  selector: 'aca-search-results',
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.scss']
})
export class SearchResultsComponent extends PageComponent implements OnInit {
  constructor(
    private datePipe: DatePipe,
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

  tableData = [];
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
            query = '(';
            Object.entries(parametre).forEach(([key, value]) => {
              if (key === 'cm:modified') {
                query += key + ':' + value + ' AND ';
              } else {
                query += key + ':"' + value + '*" AND ';
              }
            })
            query = query.substring(0, query.length - 5) + ')';

            // const name = parametre['name'];
            // const title = parametre['title'];
            // const description = parametre['description'];
            // const author = parametre['author'];
            // const start = parametre['start'];
            // const end = parametre['end'];
            // const tag = parametre['tag'];
            // if (name === '' && title === '' && description === '' && author === '' && start === undefined && end === undefined) {
            //   query = this.formatSearchQuery('*');
            // } else if (start !== undefined && end !== undefined) {
            //   const date1 = (new Date().getTime() - new Date(start).getTime()) / (1000 * 3600 * 24);
            //   const date2 = (new Date().getTime() - new Date(end).getTime()) / (1000 * 3600 * 24);
            //   query = `(cm:name:"${name}*" AND cm:title:"${title}*" AND cm:description:"${description}*" AND cm:author:"${author}*" AND cm:modified:[NOW/DAY-${Math.round(date1)}DAYS TO NOW/DAY+${Math.round(date2)}DAY] AND TAG:"${tag}*")`;
            // } else {
            //   query = `
            //     (cm:name:"${name}*" AND cm:title:"${title}*" AND cm:description:"${description}*" AND cm:author:"${author}*" AND TAG:"${tag}*")
            //     OR
            //     (cm:name:"${name}*" AND cm:title:"${title}*" AND cm:description:"${description}*" AND TAG:"${tag}*")
            //     OR
            //     (cm:name:"${name}*" AND cm:title:"${title}*" AND cm:description:"${description}*")
            //     OR
            //     (cm:name:"${name}*" AND cm:title:"${title}*" AND cm:description:"${description}*" AND cm:author:"${author}*" AND TAG:"${tag}*")`;
            // }
          });
        }
        console.log(query);
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
        return '';
      }
    });
    const Relevance = this.data.list.entries.map((content) => {
      if (content.entry.search.score == null) {
        return 0;
      } else {
        return content.entry.search.score;
      }
    });
    const CreatedAt = this.data.list.entries.map((content) => content.entry.createdAt.toString().substring(0, 25));
    const CreatedBy = this.data.list.entries.map((object) => object.entry.createdByUser.displayName);
    const Name = this.data.list.entries.map((object) => object.entry.name);
    const ModifiedBy = this.data.list.entries.map((object) => object.entry.modifiedByUser.displayName);
    const ModifiedAt = this.data.list.entries.map((object) => {
      return object.entry.modifiedAt;
    });

    const Path = this.data.list.entries.map((object) => {
      if (object.entry.isFolder === true) {
        return '';
      } else {
        return object.entry.path.name;
      }
    });
    const Size = this.data.list.entries.map((object) => {
      let i;
      if (object.entry.isFile === true) {
        i = (object.entry.content.sizeInBytes / 1048576).toFixed(3);
      } else {
        i = '';
      }
      return i;
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
      CreatedDate: this.datePipe.transform(CreatedAt[i], 'MM/d/y h:mm:ss'),
      Creator: CreatedBy[i],
      Modifier: ModifiedBy[i],
      ModifiedDate: this.datePipe.transform(ModifiedAt[i], 'MM/d/y h:mm:ss'),
      FileType: FileType[i],
      SizeInMb: Number(Size[i]),
      Location: Path[i]
    }));
    console.log(CreatedAt);
    // const csvData = this.ConvertToCSV(output, [
    //   'Relevance',
    //   'FileName',
    //   'Title',
    //   'ModifiedDate',
    //   'Modifier',
    //   'Creator',
    //   'CreatedDate',
    //   'SizeInMb',
    //   'FileType',
    //   'Location'
    // ]);
    //
    const header = ['Relevance', 'FileName', 'Title', 'ModifiedDate', 'Modifier', 'Creator', 'CreatedDate', 'SizeInMb', 'FileType', 'Location'];
    const data = output;
    //Create workbook and worksheet
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('excelFileName');
    //Add Header Row
    const headerRow = worksheet.addRow(header);
    // Cell Style : Fill and Border
    headerRow.eachCell((cell) => {
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      cell.font = { name: 'Arial', family: 4, size: 15, bold: true, strike: false };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
    // Add Data and Conditional Formatting
    data.forEach((element) => {
      const eachRow = [];
      header.forEach((headers) => {
        eachRow.push(element[headers]);
      });

      worksheet.addRow(eachRow);
    });
    const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    const EXCEL_EXTENSION = '.xls';
    worksheet.getColumn(1).width = 15;
    worksheet.getColumn(2).width = 30;
    worksheet.getColumn(3).width = 30;
    worksheet.getColumn(4).width = 20;
    worksheet.getColumn(5).width = 20;
    worksheet.getColumn(6).width = 20;
    worksheet.getColumn(7).width = 20;
    worksheet.getColumn(8).width = 20;
    worksheet.getColumn(9).width = 20;
    worksheet.getColumn(10).width = 75;
    worksheet.addRow([]);
    worksheet.eachRow((object) => (object.alignment = { vertical: 'middle', horizontal: 'left' }));
    worksheet.eachRow((column) => {
      if (column.hasValues === true) {
        column.border = {
          // top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      }
    });

    //Generate Excel File with given name
    workbook.xlsx.writeBuffer().then((data) => {
      const blob = new Blob([data], { type: EXCEL_TYPE });
      fs.saveAs(blob, 'excelFileName' + '_export_' + new Date().getTime() + EXCEL_EXTENSION);
      //
    });
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
      if (object.entry.isFolder === true) {
        return '';
      } else {
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
        } else return object.entry.path.elements[4].name;
      }
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
    for (let i = 0; i < output.length; i++) {
      Object.values(output[i]);
      this.tableData.push(Object.values(output[i]));
    }
    console.log(this.tableData);
    console.log(this.tableData);
    const pdf = new jsPDF({ orientation: 'landscape', lineHeight: 1 });

    for (let i = 0; i < output.length; i++) {
      console.log(output[i].Relevance); //use i instead of 0
    }

    autoTable(pdf, {
      margin: { top: 8 },
      head: [['FileName', 'Relevance', 'Title', 'CreatedDate', 'Creator', 'Modifier', 'ModifiedDate', 'FileType', 'Size', 'Location']],
      body: this.tableData,
      theme: 'grid',
      styles: { fontSize: 6 },
      didDrawCell: (data) => {
        console.log(data.column.index);
      },
      didParseCell(data) {
        if (data.row.index === 0 && data.cell.section === 'head') {
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fillColor = '#FF5783';
        }
      }
    });

    // Open PDF document in browser's new tab
    // Download PDF doc
    pdf.save('ZoubliExport.pdf');
  }
}
