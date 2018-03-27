import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { Login } from './login';
import { PipesModule } from '../../pipes/pipes.module';
@NgModule({
  declarations: [Login],
  imports: [
    IonicPageModule.forChild(Login),
    PipesModule
  ],
})
export class LoginModule { }
