import { Component, ViewChild } from "@angular/core";
import { Nav, Platform } from "ionic-angular";
import { StatusBar } from "@ionic-native/status-bar";
import { SplashScreen } from "@ionic-native/splash-screen";

import { Api } from "../providers/api";
import { DomSanitizer } from "@angular/platform-browser";

@Component({
  templateUrl: "app.html"
})
export class MyApp {
  @ViewChild(Nav) nav: Nav;

  rootPage: any = "HomePage";

  pages: Array<{ title: string; component: any }>;

  constructor(
    public api: Api,
    public platform: Platform,
    public statusBar: StatusBar,
    public splashScreen: SplashScreen,
    public sanitizer: DomSanitizer
  ) {
    this.initializeApp();
  }

  selectSite(site) {
    this.api.selected = site;
    site._url = this.sanitizer.bypassSecurityTrustResourceUrl(
      site.url + "impersonate/" + site.user_id
    );
  }

  initializeApp() {
    this.platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      this.statusBar.styleDefault();
      this.splashScreen.hide();
      this.api.ready.then(sites => {
        if (this.api.sites.length == 0) this.rootPage = "Login";
        else this.rootPage = "HomePage";
      });
    });
  }

  openPage(page) {
    // Reset the content nav to have just this page
    // we wouldn't want the back button to show in this scenario
    this.nav.setRoot(page.component);
  }

  logout() {
    this.api.sites = [];
    this.api.storage.clear();
    this.nav.setRoot("Login");
  }
}
