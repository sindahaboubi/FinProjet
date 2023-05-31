import { Component, OnInit, ElementRef, OnDestroy, HostListener } from "@angular/core";
import { ROUTES } from "../sidebar/sidebar.component";
import { Location } from "@angular/common";
import { Router } from "@angular/router";
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { MatDialog } from "@angular/material/dialog";
import { InvitationComponent } from "src/app/pages/dialogs/invitation/invitation.component";
import { Projet } from "src/app/model/projet";
import { ChefProjet } from "src/app/model/chef-projet";
import { RoleService } from "src/app/service/role.service";
import { Role } from "src/app/model/role";
import { Membre } from "src/app/model/membre";
import { ToastrService } from "ngx-toastr";
import Swal from "sweetalert2";
import { MembreService } from "src/app/service/membre.service";
import { SearchPanelComponent } from "src/app/pages/dialogs/search-panel/search-panel.component";
import { WebSocketInvitationService } from "src/app/service/web-socket-invitation.service";
import { AuthentificationService } from "src/app/service/authentification.service";
import { ProjetServiceService } from "src/app/service/projet-service.service";

export interface InvitationPanel{
  projet:Projet
}

@Component({
  selector: "app-navbar",
  templateUrl: "./navbar.component.html",
  styleUrls: ["./navbar.component.css"]
})
export class NavbarComponent implements OnInit, OnDestroy {

  navbarScrolled = false;

  @HostListener('window:scroll')
  onWindowScroll() {
    this.navbarScrolled = (window.pageYOffset > 0);
  }

  private listTitles: any[];
  location: Location;
  mobile_menu_visible: any = 0;
  private toggleButton: any;
  private sidebarVisible: boolean
  public isCollapsed = true;
  listeRole:Role[]
  closeResult: string;
  membresApp:Membre[]

  constructor(
    location: Location,
    private toastr: ToastrService,
    private element: ElementRef,
    private roleService: RoleService,
    private membreService:MembreService,
    private dialogInvitation: MatDialog,
    private dialogRecherche: MatDialog,
    private router: Router,
    private authentificationService:AuthentificationService,
    private projetService:ProjetServiceService


  ) {
    this.location = location;
    this.sidebarVisible = false;

  }
  // function that adds color white/transparent to the navbar on resize (this is for the collapse)
   updateColor = () => {
   var navbar = document.getElementsByClassName('navbar')[0];
     if (window.innerWidth < 993 && !this.isCollapsed) {
       navbar.classList.add('bg-white');
       navbar.classList.remove('navbar-transparent');
     } else {
       navbar.classList.remove('bg-white');
       navbar.classList.add('navbar-transparent');
     }
   };
   membre:Membre
   role:String;

   ngOnInit(){
    if(this.authentificationService.getUserRolesToken(sessionStorage.getItem('token')).roles.includes('chefProjet')){
      this.role='chefProjet';
    }else{
      const roleToken = this.authentificationService.getUserRolesToken(sessionStorage.getItem('token')).roles as Role[]
      this.role = roleToken.find(role =>
         role.pk.membreId == this.membreService.getMembreFromToken().id
         && role.pk.projetId == this.projetService.getProjetFromLocalStorage().id).type
         console.log("wellllllltedd+",this.role);

    }

     if(localStorage.getItem('projet')){
      /** pour chercher un membre */
      this.membreService.afficherTousMembres().subscribe(
        data =>{
          this.membresApp = data
          console.log('liste = ',this.membresApp);
          console.log('data = ',data)
        }
      )
    }
    if(localStorage.getItem('membre'))
      this.membre = JSON.parse(localStorage?.getItem('membre'));

    window.addEventListener("resize", this.updateColor);
    this.listTitles = ROUTES.filter(listTitle => listTitle);
    const navbar: HTMLElement = this.element.nativeElement;
    this.toggleButton = navbar.getElementsByClassName("navbar-toggler")[0];
    this.router.events.subscribe(event => {
      this.sidebarClose();
      var $layer: any = document.getElementsByClassName("close-layer")[0];
      if ($layer) {
        $layer.remove();
        this.mobile_menu_visible = 0;
      }
    });
    if(this.membre)
      this.roleService.afficherListRoleParMembre(this.membre.id).subscribe(
        data =>{
          data = data.filter(role => role.status=="ATTENTE")
          this.roleService.setRoles(data)
          this.listeRole = this.roleService.getRoles()
        }
      )

  }

  collapse() {
    this.isCollapsed = !this.isCollapsed;
    const navbar = document.getElementsByTagName("nav")[0];
    if (!this.isCollapsed) {
      navbar.classList.remove("navbar-transparent");
      navbar.classList.add("bg-white");
    } else {
      navbar.classList.add("navbar-transparent");
      navbar.classList.remove("bg-white");
    }
  }

  sidebarOpen() {
    const toggleButton = this.toggleButton;
    const mainPanel = <HTMLElement>(
      document.getElementsByClassName("main-panel")[0]
    );
    const html = document.getElementsByTagName("html")[0];
    if (window.innerWidth < 991) {
      mainPanel.style.position = "fixed";
    }

    setTimeout(function() {
      toggleButton.classList.add("toggled");
    }, 500);

    html.classList.add("nav-open");

    this.sidebarVisible = true;
  }
  sidebarClose() {
    const html = document.getElementsByTagName("html")[0];
    this.toggleButton.classList.remove("toggled");
    const mainPanel = <HTMLElement>(
      document.getElementsByClassName("main-panel")[0]
    );

    if (window.innerWidth < 991) {
      setTimeout(function() {
        mainPanel.style.position = "";
      }, 500);
    }
    this.sidebarVisible = false;
    html.classList.remove("nav-open");
  }
  sidebarToggle() {
    // const toggleButton = this.toggleButton;
    // const html = document.getElementsByTagName('html')[0];
    var $toggle = document.getElementsByClassName("navbar-toggler")[0];

    if (this.sidebarVisible === false) {
      this.sidebarOpen();
    } else {
      this.sidebarClose();
    }
    const html = document.getElementsByTagName("html")[0];

    if (this.mobile_menu_visible == 1) {
      // $('html').removeClass('nav-open');
      html.classList.remove("nav-open");
      if ($layer) {
        $layer.remove();
      }
      setTimeout(function() {
        $toggle.classList.remove("toggled");
      }, 400);

      this.mobile_menu_visible = 0;
    } else {
      setTimeout(function() {
        $toggle.classList.add("toggled");
      }, 430);

      var $layer = document.createElement("div");
      $layer.setAttribute("class", "close-layer");

      if (html.querySelectorAll(".main-panel")) {
        document.getElementsByClassName("main-panel")[0].appendChild($layer);
      } else if (html.classList.contains("off-canvas-sidebar")) {
        document
          .getElementsByClassName("wrapper-full-page")[0]
          .appendChild($layer);
      }

      setTimeout(function() {
        $layer.classList.add("visible");
      }, 100);

      $layer.onclick = function() {
        //asign a function
        html.classList.remove("nav-open");
        this.mobile_menu_visible = 0;
        $layer.classList.remove("visible");
        setTimeout(function() {
          $layer.remove();
          $toggle.classList.remove("toggled");
        }, 400);
      }.bind(this);

      html.classList.add("nav-open");
      this.mobile_menu_visible = 1;
    }
  }

  getTitle() {
    var titlee = this.location.prepareExternalUrl(this.location.path());
    if (titlee.charAt(0) === "#") {
      titlee = titlee.slice(1);
    }

    for (var item = 0; item < this.listTitles.length; item++) {
      if (this.listTitles[item].path === titlee) {
        return this.listTitles[item].title;
      }
    }
    return "Dashboard";
  }

  openSearchPanel() {
    this.dialogRecherche.open(SearchPanelComponent,{
      width: '800px',
      position:{ top: '90px', left: '350px'},
      height:'70px',
      data: {
        membres:this.membresApp
      }
    });
  }


  ngOnDestroy(){
     window.removeEventListener("resize", this.updateColor);
  }
  openDialogInvitation(){
     this.dialogInvitation.open(InvitationComponent,{
      width: '350px',
      height:'420px',
      data: {
        projet:JSON.parse(localStorage.getItem('projet'))
      }
    });
  }

  accepter(role:Role){
    role.status = "ACCEPTE"
    this.roleService.modifierRole(role).subscribe(
      data =>{
        console.log(data);
        this.listeRole.splice(this.listeRole.indexOf(role),1)
        this.toastr.success("vous avez accepté l'invitation")
      }
    )
  }

  refuser(role:Role){
    Swal.fire({
      title: "Vous êtes sûr de refuser l'invitation",
      icon: 'info',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui',
      cancelButtonText: 'Annuler',
      background:'rgba(0,0,0,0.9)',
      backdrop: 'rgba(0,0,0,0.4)',
      allowOutsideClick: false,
      allowEscapeKey: false,
      allowEnterKey: false,
      focusConfirm: false
    }).then((result) => {
      if (result.isConfirmed) {
          this.roleService.supprimerRole(role.pk,role.invitation.chefProjetId).subscribe(
            data =>{
              Swal.fire(
                'Refus',
                'Vous avez rejeté l offre',
                'warning'
              )
              this.listeRole.splice(this.listeRole.indexOf(role),1)
            }
          )
      }
    });


  }

  navigationProjet(){
    if(this.role=='chefProjet'){
      this.router.navigate(['/liste-projet']);
    }else{
      this.router.navigate(['/liste-projet-membre']);
    }
  }

  logOut(): void {
    localStorage.clear();
    sessionStorage.clear();
    this.router.navigate(['/auth']);
  }


  isOnProjetsPage(): boolean {
    return this.router.url.includes('/liste-projet');
  }





}
