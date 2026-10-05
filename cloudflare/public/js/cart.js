window.CamilloCart={
 key:'camillo_cart',get(){try{return JSON.parse(localStorage.getItem(this.key)||'[]')}catch{return[]}},save(items){localStorage.setItem(this.key,JSON.stringify(items));window.dispatchEvent(new Event('cartchange'))},
 add(item){const items=this.get();const found=items.find(x=>Number(x.variantId)===Number(item.variantId));if(found)found.quantity+=Number(item.quantity||1);else items.push({...item,quantity:Number(item.quantity||1)});this.save(items)},
 update(id,q){let items=this.get();const x=items.find(i=>Number(i.variantId)===Number(id));if(x)x.quantity=Math.max(1,Number(q));this.save(items)},remove(id){this.save(this.get().filter(i=>Number(i.variantId)!==Number(id)))},clear(){this.save([])},count(){return this.get().reduce((s,i)=>s+Number(i.quantity),0)},subtotal(){return this.get().reduce((s,i)=>s+Number(i.price)*Number(i.quantity),0)}
};
