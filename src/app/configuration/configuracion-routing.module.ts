import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutConfigurationComponent } from './layout/layout-configuration/layout-configuration.component';
import { AuthGuard } from '@billing/guards/auth.guard';
import { LayoutSerieCommercialDocumentComponent } from './layout/layout-serie-commercial-document/layout-serie-commercial-document.component';


const routes: Routes = [
  {
    path: '',
    redirectTo: 'principal',
    pathMatch: 'full'
  },
  {
    path: 'principal',
    canActivate: [ AuthGuard ],
    component: LayoutConfigurationComponent
  },
  {
    path: 'credits',
    canActivate: [ AuthGuard ],
    component: LayoutConfigurationComponent
  },
  {
    path: 'serie',
    canActivate: [ AuthGuard ],
    component: LayoutSerieCommercialDocumentComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ConfiguracionRoutingModule { }
