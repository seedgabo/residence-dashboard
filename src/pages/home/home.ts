import * as moment from "moment";
import { Component } from "@angular/core";
import { NavController } from "ionic-angular";
import { Api } from "../../providers/api";
import * as Chart from "chart.js";
@Component({
  selector: "page-home",
  templateUrl: "home.html"
})
export class HomePage {
  selected;
  stats;
  backgroundColor = ["#2196F3", "#32db64", "#f53d3d", "#ffff00", "#f53d3d", "rgb(248, 62, 130)"];
  constructor(public navCtrl: NavController, public api: Api) {}

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
        this.getStatistics(site);
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
      this.setGraphs(stats);
    });

    this.api.get(site, "invoices?scope[Indebt]=").then((data: any) => {
      stats.debts = {};
      data.forEach(inv => {
        if (!stats.debts[moment(inv.date).format("YYYY-MM-DD")]) stats.debts[moment(inv.date).format("YYYY-MM-DD")] = 0;
        stats.debts[moment(inv.date).format("YYYY-MM-DD")] += Number(inv.total);
      });
      console.log(stats.debts);
      debugger;
    });
  }

  selectSite(site) {
    this.selected = site;
    this.getStatistics(site);
  }

  setGraphs(stats) {
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

    // var ctx2 = document.getElementById("myChart2");
    // var myChart2 = new Chart(ctx, {
    //   type: "pie",
    //   data: {
    //     datasets: [
    //       {
    //         data: [stats.defaulters, stats.solvents],
    //         backgroundColor: ["#f53d3d", "#32db64"]
    //       }
    //     ],
    //     labels: [this.api.trans("literals.defaulters"), this.api.trans("literals.solvents")]
    //   },
    //   options: { responsive: true }
    // });
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
