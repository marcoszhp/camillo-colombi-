window.CamilloAPI={
  base:'/api/v1',
  token(){return localStorage.getItem('camillo_token')||''},
  async request(path,options={}){
    const headers={'Content-Type':'application/json',...(options.headers||{})}; const token=this.token(); if(token) headers.Authorization=`Bearer ${token}`;
    const res=await fetch(this.base+path,{...options,headers}); let body; try{body=await res.json()}catch{body={success:false,error:{message:'Resposta inválida do servidor.'}}}
    if(!res.ok||body.success===false) throw new Error(body?.error?.message||`Erro HTTP ${res.status}`); return body.data;
  },
  get(path){return this.request(path)}, post(path,data){return this.request(path,{method:'POST',body:JSON.stringify(data)})}, patch(path,data){return this.request(path,{method:'PATCH',body:JSON.stringify(data)})}
};
