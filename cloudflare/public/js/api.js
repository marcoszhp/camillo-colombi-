window.CamilloAPI={
  base:'/api/v1',
  token(){return localStorage.getItem('camillo_token')||''},
  async request(path,options={}){
    const headers={'Content-Type':'application/json',...(options.headers||{})};
    const isAuthRequest=/^\/auth\/(?:login|register)(?:\?|$)/.test(path);
    const token=this.token(); if(token&&!isAuthRequest) headers.Authorization=`Bearer ${token}`;
    const res=await fetch(this.base+path,{...options,headers}); let body; try{body=await res.json()}catch{body={success:false,error:{message:'Resposta inválida do servidor.'}}}
    if(res.status===401&&['AUTH_REQUIRED','INVALID_TOKEN'].includes(body?.error?.code)){
      window.CamilloAuth?.clear();
      if(!isAuthRequest&&!location.pathname.startsWith('/login')){
        const current=`${location.pathname}${location.search}`;
        const next=current.startsWith('/')&&!current.startsWith('//')?current:'/';
        location.href=`/login?next=${encodeURIComponent(next)}`;
      }
    }
    if(!res.ok||body.success===false) throw new Error(body?.error?.message||`Erro HTTP ${res.status}`); return body.data;
  },
  get(path){return this.request(path)}, post(path,data){return this.request(path,{method:'POST',body:JSON.stringify(data)})}, patch(path,data){return this.request(path,{method:'PATCH',body:JSON.stringify(data)})}
};
