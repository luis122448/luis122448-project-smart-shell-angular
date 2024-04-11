import { Component, EventEmitter, Inject, OnChanges, OnInit, Output, Input } from '@angular/core';
import {
  DataSourceDocumentHeader,
  DataSourceDocumentDetail,
} from '../../data/datasource-facbol.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FacbolGlobalStatusService } from '../../services/facbol-global-status.service';
import { Dialog } from '@angular/cdk/dialog';
import { DialogErrorAlertComponent } from '@shared-components/dialog-error-alert/dialog-error-alert.component';
import { GlobalStatusService } from '../../services/global-status.service';
import { DefaultValuesService } from 'src/app/auth/services/default-values.service';
import { Currency } from 'src/app/auth/models/default-values.model';
import { DocumentInvoiceService } from '@billing-services/document-invoice.service';
import { DialogQuestionComponent } from '@shared/components/dialog-question/dialog-question.component';
import { DocumentInvoice } from '@billing-models/document-invoice.model';
import { DocumentHeader } from '@billing-models/document-header.model';
import { DocumentDetail } from '@billing-models/document-detail.model';

@Component({
  selector: 'app-resume-facbol',
  templateUrl: './resume-facbol.component.html',
  styleUrls: ['./resume-facbol.component.scss'],
})
export class ResumeFacbolComponent implements OnInit, OnChanges {
  @Input() isEditDocumentValue : DocumentInvoice | undefined = undefined
  @Output() isNewDocument = new EventEmitter<boolean>(false);
  @Output() isCalculateDocument = new EventEmitter<boolean>(false);
  formResumeFacBol!: FormGroup;
  dataDetailSource = DataSourceDocumentDetail.getInstance();
  dataHeaderSource = DataSourceDocumentHeader.getInstance();
  isStatusInvoiceRegister = false;
  currencies: Currency[] = [];
  currency: Currency | undefined;

  private buildForm() {
    this.formResumeFacBol = this.formBuilder.group({
      implistprice: [
        { value: (0.0).toFixed(2), disabled: true },
        [Validators.required],
      ],
      impdesctotal: [
        { value: (0.0).toFixed(2), disabled: true },
      [Validators.required],
      ],
      impsaleprice: [
        { value: (0.0).toFixed(2), disabled: true },
        [Validators.required],
      ],
      imptribtotal: [
        { value: (0.0).toFixed(2), disabled: true },
        [Validators.required],
      ],
      imptotal: [
        { value: (0.0).toFixed(2), disabled: true },
        [Validators.required],
      ],
    });
  }

  constructor(
    private formBuilder: FormBuilder,
    private dialog: Dialog,
    private globalStatusService: GlobalStatusService,
    private facbolGlobalStatusService: FacbolGlobalStatusService,
    private defaultValuesService: DefaultValuesService,
    private documentInvoiceService: DocumentInvoiceService
  ) {
    this.buildForm();
    this.currencies =
      this.defaultValuesService.getLocalStorageValue('currencies');
    this.currency = this.currencies.find((data) => data.defaul === 'Y');
  }

  ngOnInit(): void {
    this.facbolGlobalStatusService.isStatusInvoiceRegister$.subscribe({
      next: (data) => {
        this.isStatusInvoiceRegister = false;
      },
      error: (error) => {
        this.isStatusInvoiceRegister = false;
      },
    });
  }

  ngOnChanges() {
    if (this.isEditDocumentValue) {
      this.calculate();
    }
  }

  calculate() {
    this.globalStatusService.setLoading(true);
    this.isCalculateDocument.emit(true);
    const dataHeader = this.dataHeaderSource.get();
    console.log(dataHeader.codcur);
    console.log('currencies',this.currencies);
    this.currency = this.currencies.find((currency) => currency.codcur === dataHeader.codcur);
    console.log('curency',this.currency);
    // Detail
    this.dataDetailSource.putReasignNumite();
    const dataDetail = this.dataDetailSource.getImp();
    this.implistprice?.setValue(dataDetail.implistprice?.toFixed(2));
    this.impdesctotal?.setValue(dataDetail.impdesctotal?.toFixed(2));
    this.impsaleprice?.setValue(dataDetail.impsaleprice?.toFixed(2));
    this.imptribtotal?.setValue(dataDetail.imptribtotal?.toFixed(2));
    this.imptotal?.setValue(dataDetail.imptotal?.toFixed(2));
    this.dataHeaderSource.updateImp(dataDetail);
    setTimeout(() => {
      this.isCalculateDocument.emit(false);
      this.globalStatusService.setLoading(false);
    }, 300);
  }

  save() {
    this.calculate();
    const documentInvoiceHeader = this.dataHeaderSource.get();
    if ((documentInvoiceHeader?.imptotal ?? 0) <= 0) {
      this.dialog.open(DialogErrorAlertComponent, {
        width: '400px',
        data: {
          status: -3,
          message:
            'The Document amount cannot be less than or equal to ZERO, with the reason for SALE',
        },
      });
      return;
    }
    const documentInvoiceDetails = this.dataDetailSource
      .get()
      .filter((data) => data.numite > 0);
    if (this.isEditDocumentValue) {
      this.updateDocument(documentInvoiceHeader, documentInvoiceDetails);
    } else {
      documentInvoiceDetails.forEach((data) => {
        data.numite = 0;
      })
      this.saveDocument(documentInvoiceHeader, documentInvoiceDetails);
    }
  }

  saveDocument(header: DocumentHeader, details: DocumentDetail[]) {
    this.globalStatusService.setLoading(true);
    this.documentInvoiceService
    .postRegisterDocument(header, details)
    .subscribe({
      next: (data) => {
        if (data.status <= 0) {
          this.dialog.open(DialogErrorAlertComponent, {
            width: '400px',
            data: data,
          });
        }
        if (data.status >= 0) {
          const dialogRef = this.dialog.open(DialogQuestionComponent, {
            width: '400px',
            data: {
              status: 0,
              message: 'Do you want to print the document?',
            },
          });
          dialogRef.closed.subscribe((response) => {
            if (response) {
              this.onPrint(data.object.numint);
            }
          });
          this.newDocument();
        }
      },
      error: (err) => {
        this.dialog.open(DialogErrorAlertComponent, {
          width: '400px',
          data: err.error,
        });
        this.globalStatusService.setLoading(false);
      },
      complete: () => {
        this.globalStatusService.setLoading(false);
      },
    });
  }

  updateDocument(header: DocumentHeader, details: DocumentDetail[]) {
    this.globalStatusService.setLoading(true);
    this.documentInvoiceService
      .putModifyDocument(header, details)
      .subscribe({
        next: (data) => {
          if (data.status <= 0) {
            this.dialog.open(DialogErrorAlertComponent, {
              width: '400px',
              data: data,
            });
          }
          if (data.status >= 0) {
            const dialogRef = this.dialog.open(DialogQuestionComponent, {
              width: '400px',
              data: {
                status: 0,
                message: 'Do you want to print the document?',
              },
            });
            dialogRef.closed.subscribe((response) => {
              if (response) {
                this.onPrint(data.object.numint);
              }
            });
            this.newDocument();
          }
        },
        error: (err) => {
          this.dialog.open(DialogErrorAlertComponent, {
            width: '400px',
            data: err.error,
          });
          this.globalStatusService.setLoading(false);
        },
        complete: () => {
          this.globalStatusService.setLoading(false);
        },
      });
  }

  newDocument() {
    this.isNewDocument.emit(true);
    setTimeout(() => {
      this.isNewDocument.emit(false);
    }, 1000);
  }

  onPrint(numint: number) {
    this.globalStatusService.setLoading(true);
    this.documentInvoiceService.getPrintDocument(numint).subscribe({
      next: (data) => {
        if (data.status <= 0) {
          this.dialog.open(DialogErrorAlertComponent, {
            width: '400px',
            data: data,
          });
        }
        if (data.status >= 0) {
          this.openArchive(data.bytes, data.format); // PDF ( BASE64 )
        }
      },
      error: (err) => {
        this.dialog.open(DialogErrorAlertComponent, {
          width: '400px',
          data: err.error,
        });
      },
      complete: () => {
        this.globalStatusService.setLoading(false);
      },
    });
  }

  openArchive(base64Data: string, format: string): void {
    const byteCharacters = atob(base64Data); // Decodificar el Base64 a bytes
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);

    const file = new Blob([byteArray], { type: 'application/pdf' }); // Crear un Blob con el contenido del PDF
    const fileURL = URL.createObjectURL(file);

    // Abrir una nueva pestaña en el navegador con el PDF
    window.open(fileURL, '_blank');
  }

  get implistprice() {
    return this.formResumeFacBol.get('implistprice');
  }
  get impdesctotal() {
    return this.formResumeFacBol.get('impdesctotal');
  }
  get impsaleprice() {
    return this.formResumeFacBol.get('impsaleprice');
  }
  get imptribtotal() {
    return this.formResumeFacBol.get('imptribtotal');
  }
  get imptotal() {
    return this.formResumeFacBol.get('imptotal');
  }
}
