import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DocumentInvoice } from '@billing-models/document-invoice.model';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  DataSourceDocumentDetail,
  DataSourceDocumentHeader,
} from '@billing/data/datasource-facbol.service';
import { Currency } from '@auth/models/default-values.model';
import { Dialog } from '@angular/cdk/dialog';
import { GlobalStatusService } from '@billing-services/global-status.service';
import { DefaultValuesService } from '@auth/services/default-values.service';
import { DialogErrorAlertComponent } from '@shared/components/dialog-error-alert/dialog-error-alert.component';
import { DocumentHeader } from '@billing-models/document-header.model';
import { DocumentDetail } from '@billing-models/document-detail.model';
import { DialogQuestionComponent } from '@shared/components/dialog-question/dialog-question.component';
import { DocumentInventoryTakingService } from '@billing-services/document-inventory-taking.service';

@Component({
  selector: 'app-resume-inventory-taking',
  templateUrl: './resume-inventory-taking.component.html',
  styleUrls: ['./resume-inventory-taking.component.scss'],
})
export class ResumeInventoryTakingComponent {
  @Input() isEditDocumentValue: DocumentInvoice | undefined = undefined;
  @Output() isNewDocument = new EventEmitter<boolean>(false);
  @Output() isCalculateDocument = new EventEmitter<boolean>(false);
  formResumeInventoryTaking!: FormGroup;
  dataDetailSource = DataSourceDocumentDetail.getInstance();
  dataHeaderSource = DataSourceDocumentHeader.getInstance();
  isStatusInventoryTakingRegister =
    this.documentInventoryTakingService.isStatusInventoryTakingRegister;
  currencies: Currency[] = [];
  currency: Currency | undefined;

  private buildForm() {
    this.formResumeInventoryTaking = this.formBuilder.group({
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
    private defaultValuesService: DefaultValuesService,
    private documentInventoryTakingService: DocumentInventoryTakingService
  ) {
    this.buildForm();
    this.currencies =
      this.defaultValuesService.getLocalStorageValue('currencies');
    this.currency = this.currencies.find((data) => data.defaul === 'Y');
  }

  calculate(): Promise<boolean> {
    return new Promise((resolve) => {
      this.globalStatusService.setLoading(true);
      this.isCalculateDocument.emit(true);
      const dataHeader = this.dataHeaderSource.get();
      this.currency = this.currencies.find(
        (currency) => currency.codcur === dataHeader.codcur
      );
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
      if (
        !(
          this.documentInventoryTakingService.isStatusInventoryTakingRegister() &&
          this.documentInventoryTakingService.isStatusInventoryTakingRegisterDetail()
        )
      ) {
        resolve(false);
      }
      resolve(true);
    });
  }

  async save() {
    const response = await this.calculate();
    if (!response) {
      return;
    }
    const documentInvoiceHeader = this.dataHeaderSource.get();
    const documentInvoiceDetails = this.dataDetailSource
      .get()
      .filter((data) => data.numite > 0);
    if (this.isEditDocumentValue) {
      this.updateDocument(documentInvoiceHeader, documentInvoiceDetails);
    } else {
      this.saveDocument(documentInvoiceHeader, documentInvoiceDetails);
    }
  }

  saveDocument(header: DocumentHeader, details: DocumentDetail[]) {
    this.documentInventoryTakingService
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
      });
  }

  updateDocument(header: DocumentHeader, details: DocumentDetail[]) {
    this.documentInventoryTakingService
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
      });
  }

  newDocument() {
    this.globalStatusService.setLoading(true);
    this.isNewDocument.emit(true);
    setTimeout(() => {
      this.isNewDocument.emit(false);
      this.globalStatusService.setLoading(false);
    }, 300);
  }

  onPrint(numint: number) {
    this.globalStatusService.setLoading(true);
    this.documentInventoryTakingService.getPrintDocument(numint).subscribe({
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
    return this.formResumeInventoryTaking.get('implistprice');
  }
  get impdesctotal() {
    return this.formResumeInventoryTaking.get('impdesctotal');
  }
  get impsaleprice() {
    return this.formResumeInventoryTaking.get('impsaleprice');
  }
  get imptribtotal() {
    return this.formResumeInventoryTaking.get('imptribtotal');
  }
  get imptotal() {
    return this.formResumeInventoryTaking.get('imptotal');
  }
}
