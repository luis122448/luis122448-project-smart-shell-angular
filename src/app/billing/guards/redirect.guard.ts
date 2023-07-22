import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { TokenService } from 'src/app/auth/services/token.service';

@Injectable({
  providedIn: 'root'
})
export class RedirectGuard implements CanActivate {

constructor(
  private tokenService: TokenService,
  private router: Router
){}

  canActivate(): boolean {
    const isValidToken =  this.tokenService.isValidRefreshToken()
    console.log(isValidToken)
    if (isValidToken) {
      this.router.navigate(['/facturacion'])
    }
    return true
  }

}
