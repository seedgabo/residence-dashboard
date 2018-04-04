import * as moment from "moment";
import { Component } from "@angular/core";
import { NavController } from "ionic-angular";
import { Api } from "../../providers/api";
import * as Chart from "chart.js";
import { DomSanitizer } from "@angular/platform-browser";

@Component({
  selector: "page-home",
  templateUrl: "home.html"
})
export class HomePage {
  selected;
  stats: any = {};
  backgroundColor = ["#2196F3", "#32db64", "#f53d3d", "#ffff00", "#f53d3d", "rgb(248, 62, 130)"];
  constructor(public navCtrl: NavController, public api: Api, public sanitizer: DomSanitizer) {}

  ionViewDidLoad() {
    this.api.ready.then(() => {
      if (this.api.sites.length > 0) {
        this.loadStatistics();
      }
    });
  }

  loadStatistics() {
    var find = false;
    this.api.sites.forEach(site => {
      if (!find && site.token) {
        this.selectSite(site);
        find = true;
      }
    });
  }

  getStatistics(site) {
    var stats: any = (this.stats = {});
    this.api.get(site, "residences?attr[debt]=").then((data: any) => {
      stats.residences_count = 0;
      stats.solvents = 0;
      stats.defaulters = 0;
      stats.debt = 0;
      data.forEach(res => {
        if (res.type != "administration") stats.residences_count++;
        stats.debt += Number(res.debt);
        if (res.status == "solvent") {
          stats.solvents++;
        } else {
          stats.defaulters++;
        }
      });
      this.setGraphDefaulters(stats);
    });

    this.api.get(site, "invoices?scope[Indebt]=").then((data: any) => {
      stats.debts = {};
      stats.invoices = data;
      data.forEach(inv => {
        if (!stats.debts[moment(inv.date).format("MMM YYYY")]) stats.debts[moment(inv.date).format("MMM YYYY")] = 0;
        stats.debts[moment(inv.date).format("MMM YYYY")] += Number(inv.total);
      });
      this.setGraphDebts(stats);
    });
  }

  selectSite(site) {
    // if (!site.token) {
    //   return this.login(site);
    // }
    this.selected = site;
    site._url = this.sanitizer.bypassSecurityTrustResourceUrl(site.url + "impersonate/" + site.user_id);
    // this.getStatistics(site);
  }

  setGraphDefaulters(stats) {
    var ctx = document.getElementById("myChart");
    var myChart = new Chart(ctx, {
      type: "pie",
      data: {
        datasets: [
          {
            data: [stats.defaulters, stats.solvents],
            backgroundColor: ["#f53d3d", "#32db64"]
          }
        ],
        labels: [this.api.trans("literals.defaulters"), this.api.trans("literals.solvents")]
      },
      options: { responsive: true }
    });
  }
  setGraphDebts(stats) {
    var values = [];
    var sums = [];
    var sum = 0;
    Object.keys(stats.debts).forEach(key => {
      values.push(Number(stats.debts[key]));
      sums.push((sum += Number(stats.debts[key])));
    });
    var ctx2 = document.getElementById("myChart2");
    var myChart2 = new Chart(ctx2, {
      type: "line",
      data: {
        labels: Object.keys(stats.debts),
        datasets: [
          {
            label: this.api.trans("literals.debts"),
            data: values,
            backgroundColor: this.backgroundColor[0],
            borderColor: this.backgroundColor[0],
            fill: false
          },
          {
            label: this.api.trans("literals.acumulado"),
            data: sums,
            backgroundColor: this.backgroundColor[1],
            borderColor: this.backgroundColor[1],
            fill: false
          }
        ]
      },
      options: { responsive: true }
    });
  }

  login(site) {
    this.api.alert
      .create({
        title: "Login",
        subTitle: this.api.username,
        inputs: [
          {
            type: "password",
            name: "password",
            placeholder: "password",
            value: this.api.password
          }
        ],
        buttons: [
          "cancel",
          {
            text: "ok",
            handler: data => {
              this.api.password = data.password;
              this.api
                .doLogin(site)
                .then(data => {
                  console.log(data);
                })
                .catch(err => {
                  this.api.Error(err);
                });
            }
          }
        ]
      })
      .present();
  }
}
