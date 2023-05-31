import { Component, OnInit } from "@angular/core";
import { Projet } from "src/app/model/projet";
import { SprintService } from "src/app/service/sprint.service";

declare interface RouteInfo {
  path: string;
  title: string;
  rtlTitle: string;
  icon: string;
  disabled?:boolean,
  class: string,
}
export const ROUTES: RouteInfo[] = [
  {
    path: "/dashboard",
    title: "Dashboard",
    rtlTitle: "لوحة القيادة",
    icon: "icone-chart-line",
    class: ""
  },
  {
    path: "/planification-projet",
    title: "Planification projet",
    rtlTitle: "مهام المنتج",
    icon: "icon-tablet-2",
    class: ""
  },
  {
    path: "/sprint-backlog",
    title: "sprint backlog",
    rtlTitle: "مهام سبرنت",
    icon: "icon-tie-bow",
    class: "" ,
  },


  {
    path: "/scrumBoard",
    title: "scrum board",
    rtlTitle: "لوحة السكروم",
    icon: "icon-video-66",
    class: ""
  },
  {
    path: "/dossiers",
    title: "liste des ressources",
    rtlTitle: "الموارد المشترك ",
    icon: "icone-folders",
    class: ""
  },
  {
    path: "/chat-bot",
    title: "Scrum teacher",
    rtlTitle: "طباعة",
    icon: "icone-comment-alt-smile",
    class: ""
  },
  {
    path: "/feuille-route",
    title: "Feuille de route",
    rtlTitle: "ار تي ال",
    icon: "icon-world",
    class: ""
  },
  {
    path: "/corbeille",
    title: "corbeille",
    rtlTitle: "ار تي ال",
    icon: "icon-trash-simple",
    class: ""
  }
];

@Component({
  selector: "app-sidebar",
  templateUrl: "./sidebar.component.html",
  styleUrls: ["./sidebar.component.css"]
})
export class SidebarComponent implements OnInit {
  menuItems: any[];
  projet:Projet;

  constructor(
    private sprintService: SprintService
  ) {}

  sprintLancee:number;

  ngOnInit() {
    this.projet =JSON.parse(localStorage.getItem("projet"));
    this.sprintService.getListSprintsByProductBacklog(JSON.parse(localStorage.getItem('productBacklogCourant')).id)
    .subscribe(
      data => {
        this.sprintLancee = data.filter(sprint => sprint.etat == "en cours")?.length
        this.menuItems = ROUTES.map((menuItem) =>
        menuItem.path === "/sprint-backlog"
          ? {
              ...menuItem,
              disabled: this.sprintLancee == 0,
            }
          : menuItem
      );
      }
    )
   this.menuItems = ROUTES.filter(menuItem => menuItem);
  }

  isMobileMenu() {
    if (window.innerWidth > 991) {
      return false;
    }
    return true;
  }
}
