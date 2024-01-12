import { Component, OnInit } from '@angular/core';
import { DocumentDetail } from '@billing-models/document-detail.model';
import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { DialogGetArticleComponent } from '../dialog-get-article/dialog-get-article.component';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { DataSource } from '@angular/cdk/collections';
import { BehaviorSubject, Observable, debounceTime } from 'rxjs';
import { faMagnifyingGlass, faXmark, faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import { Article } from '@billing-models/article.model';
import { DataSourceDocumentDetail,DataSourceDocumentHeader } from '../../data/datasource-facbol.service';
import { FacbolGlobalStatusService } from '../../services/facbol-global-status.service';

@Component({
  selector: 'app-detail-items-facbol',
  templateUrl: './detail-items-facbol.component.html',
  styleUrls: ['./detail-items-facbol.component.scss']
})
export class DetailItemsFacbolComponent implements OnInit  {

  formDetail!: FormGroup
  dataDetailSource = DataSourceDocumentDetail.getInstance()
  dataHeaderSource = DataSourceDocumentHeader.getInstance()
  displayedColumns: string[] = ['numite', 'typinv','codart','etiqueta','quantity','price','subtotal','operac'];
  faMagnifyingGlass = faMagnifyingGlass
  faPenToSquare = faPenToSquare
  faXmark = faXmark
  // SubStatus
  isStatusInvoiceRegister = false;

  // Var
  codlistprice: number = 0;

  constructor(
    private dialog: Dialog,
    private formBuilder: FormBuilder,
    private facbolGlobalStatusService: FacbolGlobalStatusService
  ){
    this.dataDetailSource.getInit(
      [
        {
          numint: 0,
          numite: 0,
          typinv: 0,
          desinv: '',
          codart: '',
          desart: '',
          etiqueta: 0,
          quantity: 0,
          stock: 0,
          price: 0.0,
          modprice: 'N',
          impafecto: 0.0,
          impinafecto: 0,
          impexonerado: 0,
          impgratuito: 0,
          impigv: 18.0,
          impisc: 0,
          imptribadd01: 0,
          imptribadd02: 0,
          imptribadd03: 0,
          imptribadd04: 0,
          moddesc: 'N',
          impdesc01: 0,
          impdesc02: 0,
          impdesc03: 0,
          impdesc04: 0,
          implistprice: 0.00,
          impdesctotal: 0.00,
          impsaleprice: 0.00,
          imptribtotal: 0.00,
          imptotal: 0.00,
          status: 'S',
          createby: 'ADMIN',
          updateby: 'ADMIN',
          createat: new Date(),
          updateat: new Date(),
          update: true
        }
      ]
    )
    this.buildForm()
  }
  ngOnInit(): void {
    this.facbolGlobalStatusService.isStatusInvoiceRegister$.subscribe(
      {
        next:data =>{this.isStatusInvoiceRegister = data },
        error:error =>{this.isStatusInvoiceRegister = false}
      })
  }

  private buildForm() {
    this.formDetail =  this.formBuilder.group({
      numite: [{value:'0',disabled:false},[Validators.required]],
      typinv: [{value:'',disabled:false},[Validators.required]],
      codart: ['',[Validators.required]],
      desart: ['',[Validators.required]],
      etiqueta: [{value:'',disabled:false},[Validators.required]],
      quantity: [{value:'0',disabled:false},[Validators.required]],
      price: [{value:'0',disabled:false},[Validators.required]],
      subtotal: [{value:'0',disabled:false},[Validators.required]]
    })
  }

  openDialogGetArticle(){
    const dataHeader = this.dataHeaderSource.get()
    this.codlistprice = dataHeader.codlistprice ?? 0
    const dialogRefArticle = this.dialog.open<Article>(DialogGetArticleComponent, {
      data: {
        codart: this.codart?.value,
        desart: this.desart?.value,
        codlistprice: this.codlistprice,
      }
    })

    dialogRefArticle.closed.subscribe(data =>{
      if (data) {
        const nextNumite : number = this.dataDetailSource.getCount() + 1;
        this.formDetail.get('numite')?.setValue('')
        this.formDetail.get('typinv')?.setValue('')
        this.formDetail.get('codart')?.setValue('')
        // Habilitando
        // this.formDetail.get('etiqueta')?.enable()
        // this.formDetail.get('quantity')?.enable()
        this.dataDetailSource.getPush({
          numite:nextNumite,
          typinv:data.typinv,
          desinv:data.desinv,
          codart:data.codart,
          desart:data.descri,
          etiqueta:0,
          quantity:0,
          stock:data.stock ?? 0,
          price:data.price ?? 0.0,
          update: true
        })
      }
    })
  }

  openDialogGetEtiqueta(){

  }

  preCalculate(row: DocumentDetail){
    const updateRow: DocumentDetail = {
      numite: row.numite,
      typinv: row.typinv,
      codart: row.codart,
      etiqueta: this.etiqueta?.value,
      quantity: this.quantity?.value,
      price: 10.0,
      update: false
    }
    console.log('UpdateRow', updateRow)
    this.dataDetailSource.putPreCalculate(updateRow.numite,updateRow)
    this.dataDetailSource.getCalculateImport(updateRow.numite)
  }

  cleanNumite(row: DocumentDetail){
    this.dataDetailSource.getClean(row.numite)
  }

  get numite (){
    return this.formDetail.get('numite')
  }
  get typinv (){
    return this.formDetail.get('typinv')
  }
  get codart (){
    return this.formDetail.get('codart')
  }
  get desart (){
    return this.formDetail.get('desart')
  }
  get etiqueta (){
    return this.formDetail.get('etiqueta')
  }
  get quantity (){
    return this.formDetail.get('quantity')
  }
  get price (){
    return this.formDetail.get('price')
  }
  get subtotal (){
    return this.formDetail.get('subtotal')
  }

}
