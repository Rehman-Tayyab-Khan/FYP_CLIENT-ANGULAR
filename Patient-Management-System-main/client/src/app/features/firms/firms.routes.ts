import { Routes } from '@angular/router';
import { FirmListComponent } from './firm-list/firm-list.component';
import { FirmCreateComponent } from './firm-create/firm-create.component';
import { FirmDetailComponent } from './firm-detail/firm-detail.component';

export const FIRMS_ROUTES: Routes = [
  {
    path: '',
    component: FirmListComponent,
  },
  {
    path: 'create',
    component: FirmCreateComponent,
  },
  {
    path: ':id',
    component: FirmDetailComponent,
  },
];
