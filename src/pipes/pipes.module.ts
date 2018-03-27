import { TransPipe } from "./trans/trans";
import { NgModule } from "@angular/core";
import { MomentModule } from "angular2-moment";
import { IonicModule } from "ionic-angular";
@NgModule({
  declarations: [
    TransPipe
  ],
  imports: [
    MomentModule, IonicModule
  ],
  exports: [
    TransPipe,
    MomentModule
  ]
})
export class PipesModule { }
