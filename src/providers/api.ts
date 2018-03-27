import { Injectable, NgZone } from "@angular/core";
import { Http, Headers } from "@angular/http";
import "rxjs/add/operator/map";
import { PopoverController, ToastController, Events, Platform, AlertController } from "ionic-angular";
import { Storage } from "@ionic/storage";
import { langs } from "../providers/langs";
declare var window: any;
import * as moment from "moment";
moment.locale("es");

@Injectable()
export class Api {
  sound: HTMLAudioElement;
  modules: any;
  settings: any;
  url = "http://residenciasonline.com/residencias/public/";
  sites = [];
  username = "";
  password = "";
  user;
  resolve;
  ready: Promise<any> = new Promise(resolve => {
    this.resolve = resolve;
  });
  langs: any = langs;
  objects: any = {};
  constructor(
    public http: Http,
    public storage: Storage,
    public zone: NgZone,
    public popover: PopoverController,
    public toast: ToastController,
    public events: Events,
    public platform: Platform,
    public alert: AlertController
  ) {
    storage.ready().then(() => {
      storage.get("username").then(username => {
        if (username) this.username = username;
      });
      storage.get("langs").then(langs => {
        if (langs) this.langs = langs;
      });
      storage.get("sites").then(sites => {
        if (sites) this.sites = sites;
        this.resolve(this.sites);
        // this.getSites();
      });
      window.$api = this;
    });
  }

  getSites() {
    this.http
      .get(this.url + "api/smart-login?email=" + this.username)
      .map(res => res.json())
      .subscribe(
        (data: any) => {
          if (data.length == 0) {
            this.alert
              .create({
                title: this.trans("__.No hay usuario registrado"),
                buttons: ["OK"]
              })
              .present();
            return;
          }
        },
        err => {
          this.Error(err);
        }
      );
  }

  save() {
    return this.storage.set("sites", this.sites);
  }

  doLogin(site) {
    return new Promise((resolve, reject) => {
      this.http
        .get(site.url + "api/login", { headers: this.setHeaders() })
        .map(res => res.json())
        .subscribe(
          (data: any) => {
            site.user = data.user;
            site.token = data.user.token;
            site.residence = data.residence;
            site.modules = data.modules;
            site.settings = data.settings;
            this.save();
            resolve(data);
          },
          error => {
            return reject(error);
          }
        );
    });
  }

  getLang(site) {
    this.get(site, "lang")
      .then(langs => {
        this.storage.set("langs", langs);
        this.langs = langs;
      })
      .catch(err => {
        console.error("error trying to download translations", err);
      });
  }

  load(site, resource) {
    console.time("load " + resource);
    return new Promise((resolve, reject) => {
      if (this.objects[resource] && this.objects[resource].promise) {
        this.objects[resource].promise
          .then(resp => {
            resolve(resp);
            console.timeEnd("load " + resource);
          })
          .catch(reject);
        return;
      }
      this.storage.get(resource + "_resource").then(data => {
        this.objects[resource] = [];
        if (data) {
          this.objects[resource] = data;
        }
        var promise,
          query = "";
        if (resource == "users" || resource == "workers" || resource == "visitors" || resource == "pets") {
          query = "?where[residence_id]=" + this.user.residence_id + "&with[]=residence";
        }
        if (resource == "vehicles") {
          query = "?where[residence_id]=" + this.user.residence_id + "&with[]=owner&with[]=visitor&with[]=residence";
        }
        if (resource == "parkings") {
          query = "?with[]=user";
        }
        if (resource == "products") {
          query = "?with[]=category";
        }
        if (resource == "residences") {
          query = "?with[]=owner&with[]=users";
        }
        this.objects[resource].promise = promise = this.get(site, resource + query);
        this.objects[resource].promise
          .then(resp => {
            this.objects[resource] = resp;
            this.objects[resource].promise = promise;
            this.objects[resource].collection = this.mapToCollection(resp);
            this.storage.set(resource + "_resource", resp);
            console.timeEnd("load " + resource);
            return resolve(this.objects[resource]);
          })
          .catch(err => {
            reject(err);
            this.Error(err);
          });
      });
    });
  }

  get(site, uri) {
    return new Promise((resolve, reject) => {
      this.http
        .get(site.url + "api/" + uri, { headers: this.setHeaders(site) })
        .map(res => res.json())
        .subscribe(
          data => {
            resolve(data);
          },
          error => {
            return reject(error);
          }
        );
    });
  }

  post(uri, data) {
    return new Promise((resolve, reject) => {
      this.http
        .post(this.url + "api/" + uri, data, { headers: this.setHeaders() })
        .map(res => res.json())
        .subscribe(
          data => {
            resolve(data);
          },
          error => {
            return reject(error);
          }
        );
    });
  }

  put(uri, data) {
    return new Promise((resolve, reject) => {
      this.http
        .put(this.url + "api/" + uri, data, { headers: this.setHeaders() })
        .map(res => res.json())
        .subscribe(
          data => {
            resolve(data);
          },
          error => {
            return reject(error);
          }
        );
    });
  }

  delete(uri) {
    return new Promise((resolve, reject) => {
      this.http
        .delete(this.url + "api/" + uri, { headers: this.setHeaders() })
        .map(res => res.json())
        .subscribe(
          data => {
            resolve(data);
          },
          error => {
            return reject(error);
          }
        );
    });
  }

  private mapToCollection(array, key = "id") {
    var collection = {};
    array.forEach(element => {
      collection[element[key]] = element;
    });
    return collection;
  }

  saveData(userData) {
    this.user = userData.user;
    this.user.residences = userData.residences;
    this.settings = userData.settings;
    this.modules = userData.modules;
    this.storage.set("user", this.user);
    this.storage.set("modules", this.modules);
    this.storage.set("settings", this.settings);
  }

  loginOAuth(userData) {
    return new Promise((resolve, reject) => {
      this.http
        .post(this.url + "api/login/oauth", userData, {})
        .map(res => res.json())
        .subscribe(
          data => {
            resolve(data);
          },
          error => {
            return reject(error);
          }
        );
    });
  }

  trans(value, args = null) {
    if (!this.langs) return value.replace("literals.", "").replace("__.", "");
    var splits = value.split(".");
    var base, trans;
    if (splits.length == 2) {
      base = this.langs[splits[0]];
      if (base) {
        trans = base[splits[1]];
        if (trans) {
          value = trans;
        }
      }
    } else {
      base = this.langs["__"];
      if (base) {
        trans = base[value];
        if (trans) {
          value = trans;
        }
      }
    }
    if (args) {
      for (var k in args) {
        value = value.replace(":" + k, args[k]);
      }
    }
    return value.replace("literals.", "").replace("__.", "");
  }

  private setHeaders(site = null) {
    let headers = new Headers();
    if (site) headers.append("Auth-Token", site.token);
    else headers.append("Authorization", "Basic " + btoa(this.username + ":" + this.password));
    return headers;
  }

  playSoundNotfication() {
    this.sound = new Audio("assets/sounds/notifcations.mp3");
    this.sound.play();
    return this.sound;
  }

  Error(error) {
    console.error(error);
    var message = "";
    if (error.status == 500) {
      message = this.trans("__.Internal Server Error");
    }
    if (error.status == 404) {
      message = this.trans("__.Not Found");
    }
    if (error.status == 401) {
      message = this.trans("__.Unauthorized");
    }
    this.alert
      .create({
        title: this.trans("__.Network Error"),
        subTitle: error.error,
        message: message + ":" + error.statusText,
        buttons: ["OK"]
      })
      .present();
  }
}
