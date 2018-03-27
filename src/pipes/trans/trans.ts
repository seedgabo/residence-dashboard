import { Pipe, PipeTransform } from '@angular/core';
import { Api } from "../../providers/api";

/**
 * Generated class for the TransPipe pipe.
 *
 * See https://angular.io/docs/ts/latest/guide/pipes.html for more info on
 * Angular Pipes.
 */
@Pipe({
  name: 'trans',
})
export class TransPipe implements PipeTransform {
  constructor(public api: Api) {

  }
  transform(value: string, ...args) {
    if (!this.api.langs) return value;
    var splits = value.split('.');
    var base, trans;
    if (splits.length == 2) {
      base = this.api.langs[splits[0]];
      if (base) {
        trans = base[splits[1]];
        if (trans) {
          value = trans;
        }
      }
    } else {
      base = this.api.langs["__"];
      if (base) {
        trans = base[value];
        if (trans) {
          value = trans;
        }
      }
    }
    return value.replace('literals.', '').replace('__.', '');
  }
}
