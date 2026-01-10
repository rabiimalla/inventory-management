import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, GuardResult, MaybeAsync, Router, RouterStateSnapshot } from "@angular/router";
import { AuthService } from "../services/auth.service";
import { Permission } from "../enums/permission.enum";

@Injectable({providedIn: 'root'})
export class RoleGuard implements CanActivate {
  constructor(
    private auth: AuthService,
    private router: Router
  ){}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const requiredPermissions = route.data?.['permissions'] as Permission[];

    if(!requiredPermissions || !requiredPermissions.length) {
      return true;
    }

    const hasAccess = this.auth.canAccess(requiredPermissions);
    if(!hasAccess) {
      this.router.navigate(['/unauthorized']);
      return false;
    }

    return true;
  }
}
