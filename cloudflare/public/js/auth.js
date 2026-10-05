window.CamilloAuth={
 setSession(data){localStorage.setItem('camillo_token',data.token);localStorage.setItem('camillo_user',JSON.stringify(data.user));},
 clear(){localStorage.removeItem('camillo_token');localStorage.removeItem('camillo_user');},
 user(){try{return JSON.parse(localStorage.getItem('camillo_user')||'null')}catch{return null}},
 isLogged(){return !!localStorage.getItem('camillo_token')},
 requireLogin(next=location.pathname+location.search){if(!this.isLogged()){location.href='/login?next='+encodeURIComponent(next);return false}return true},
 requireAdmin(){const u=this.user();if(!this.isLogged()||u?.role!=='admin'){location.href='/login?next='+encodeURIComponent('/admin');return false}return true}
};
