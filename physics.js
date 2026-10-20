// SI units. Reduced-radius bodies keep orbital flights approachable.
export const V = {
 add:(a,b)=>a.map((x,i)=>x+b[i]), sub:(a,b)=>a.map((x,i)=>x-b[i]),
 mul:(a,k)=>a.map(x=>x*k), dot:(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),
 cross:(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],
 len:a=>Math.hypot(...a), norm:a=>{const n=Math.hypot(...a);return n>1e-12?a.map(x=>x/n):[0,1,0];}
};
export const BODIES={
 earth:{name:'Земля',radius:600000,mu:3.5316e12,atmosphere:70000,scaleHeight:8500,density:1.225,color:[.08,.23,.36],land:[.19,.35,.28]},
 mars:{name:'Марс',radius:320000,mu:3.8*320000**2,atmosphere:45000,scaleHeight:11000,density:.02,color:[.42,.19,.12],land:[.58,.31,.19]},
 venus:{name:'Венера',radius:570000,mu:8.87*570000**2,atmosphere:90000,scaleHeight:15000,density:9,color:[.48,.36,.18],land:[.59,.44,.23]},
 moon:{name:'Місяць',radius:170000,mu:1.62*170000**2,atmosphere:0,scaleHeight:1,density:0,color:[.26,.28,.3],land:[.37,.38,.4]}
};
export function density(body,alt){return alt>=body.atmosphere?0:body.density*Math.exp(-Math.max(0,alt)/body.scaleHeight);}
export function gravity(p,body){return V.mul(p,-body.mu/Math.max(1,V.len(p))**3);}
// Kick-drift-kick (velocity Verlet), with <= 0.1 s steps in the live simulation.
export function coast(p,v,dt,body){const half=V.add(v,V.mul(gravity(p,body),dt/2));const pos=V.add(p,V.mul(half,dt));return {p:pos,v:V.add(half,V.mul(gravity(pos,body),dt/2))};}
export function elements(p,v,body){
 const r=V.len(p),speed=V.len(v),h=V.cross(p,v),energy=speed*speed/2-body.mu/r;
 const ev=V.sub(V.mul(V.cross(v,h),1/body.mu),V.mul(p,1/r)),e=V.len(ev);
 const a=Math.abs(energy)<1e-10?Infinity:-body.mu/(2*energy),peri=V.dot(h,h)/body.mu/(1+e)-body.radius;
 return {e,a,peri,apo:energy>=0?Infinity:a*(1+e)-body.radius,energy,speed,alt:r-body.radius,radial:V.dot(p,v)/r,period:energy<0?2*Math.PI*Math.sqrt(a**3/body.mu):Infinity};
}
export function predict(p,v,body,count=240){
 const el=elements(p,v,body),duration=Number.isFinite(el.period)?Math.min(el.period,20000):4000,dt=duration/count,points=[p.slice()];
 let state={p:p.slice(),v:v.slice()};
 for(let i=0;i<count;i++){const sub=Math.max(1,Math.ceil(dt/2));for(let j=0;j<sub;j++)state=coast(state.p,state.v,dt/sub,body);points.push(state.p);if(V.len(state.p)<body.radius)break;}
 return points;
}
export const PARTS={
 engine:{name:'Двигун «Промінь»',cat:'Двигуни',icon:'♜',h:1.7,w:2,mass:1250,thrust:460000,isp:310,desc:'460 кН · атмосферний'},
 vacuum:{name:'Двигун «Вектор»',cat:'Двигуни',icon:'♜',h:1.7,w:1.7,mass:550,thrust:125000,isp:365,desc:'125 кН · вакуумний'},
 solid:{name:'Прискорювач SRB',cat:'Двигуни',icon:'⇡',h:3,w:1,mass:450,fuel:1800,thrust:90000,isp:245,desc:'90 кН · без дроселювання'},
 ion:{name:'Іонний «Іскра»',cat:'Двигуни',icon:'✧',h:.8,w:1,mass:180,thrust:3500,isp:1800,desc:'3,5 кН · електричний'},
 tank:{name:'Паливний бак',cat:'Баки',icon:'▥',h:5,w:2.2,mass:650,fuel:9000,desc:'9 т · паливо + окисник'},
 mono:{name:'Бак RCS',cat:'Баки',icon:'▤',h:.8,w:1.7,mass:120,mono:160,desc:'160 кг · монопаливо'},
 capsule:{name:'Капсула «Обрій»',cat:'Керування',icon:'◭',h:2.1,w:2.2,mass:850,crew:true,desc:'1 космонавт · EVA'},
 probe:{name:'Безпілотний модуль',cat:'Керування',icon:'▣',h:.7,w:1.6,mass:180,desc:'Дистанційне керування'},
 wheel:{name:'Гіроскоп',cat:'Керування',icon:'◎',h:.5,w:1.7,mass:150,desc:'Стабілізація · SAS'},
 fairing:{name:'Обтічник',cat:'Корпус',icon:'△',h:2.4,w:2.2,mass:180,desc:'Скидання клавішею F'},
 shield:{name:'Тепловий щит',cat:'Корпус',icon:'◡',h:.3,w:2.4,mass:300,desc:'Захист від нагрівання'},
 wing:{name:'Стабілізатори',cat:'Корпус',icon:'⋈',h:.5,w:2,mass:100,desc:'4 аеродинамічні пера'},
 separator:{name:'Відділювач',cat:'Механіка',icon:'═',h:.35,w:2.2,mass:90,desc:'Розділення ступенів'},
 legs:{name:'Посадкові опори',cat:'Механіка',icon:'⋀',h:.45,w:2,mass:180,desc:'Розкладаються · G'},
 solar:{name:'Сонячні панелі',cat:'Механіка',icon:'⊞',h:.4,w:1.8,mass:90,desc:'Розкладаються · G'},
 dock:{name:'Стикувальний вузол',cat:'Механіка',icon:'⊙',h:.4,w:1.5,mass:120,desc:'Візуальний модуль'},
 cargo:{name:'Вантажний відсік',cat:'Механіка',icon:'▣',h:2.2,w:2.2,mass:320,desc:'Відчиняється · G'},
 ladder:{name:'Висувна драбина',cat:'Механіка',icon:'☷',h:.3,w:1.8,mass:30,desc:'Розкладається · G'}
};
export function part(type){if(!PARTS[type])throw Error('Невідома деталь');return {type,length:1,width:1,finish:'white',fuel:PARTS[type].fuel||0,mono:PARTS[type].mono||0};}
export function defaultRocket(){const lower=part('tank'),upper=part('tank');upper.length=.65;upper.width=.8;upper.fuel*=.65*.8**2;return [part('engine'),lower,part('wing'),part('separator'),part('vacuum'),upper,part('shield'),part('capsule'),part('solar')];}
export const capacity=p=>(PARTS[p.type].fuel||0)*p.length*p.width**2;
export const dryMass=p=>PARTS[p.type].mass*(p.type==='tank'?p.length*p.width**2:1);
export const mass=parts=>parts.reduce((n,p)=>n+dryMass(p)+p.fuel+p.mono,0);
export function activeStage(parts){const end=parts.findIndex(p=>p.type==='separator');return parts.slice(0,end<0?parts.length:end);}
export function engineStats(parts,alt,body){
 const stage=activeStage(parts),fuel=stage.reduce((n,p)=>n+(p.type==='tank'?p.fuel:0),0);let thrust=0,flow=0;
 for(const p of stage){const d=PARTS[p.type];if(!d.thrust||!(p.type==='solid'?p.fuel>0:fuel>0))continue;
 const isp=d.isp*(p.type==='vacuum'?1-.35*density(body,alt)/Math.max(.001,body.density):1-.12*density(body,alt)/Math.max(.001,body.density));
 const force=d.thrust*isp/d.isp;thrust+=force;flow+=force/(isp*9.80665);
 }return {thrust,flow,isp:flow?thrust/flow/9.80665:0};
}
export function deltaV(parts){let remaining=parts.map(p=>({...p})),dv=0;
 while(remaining.length){const e=engineStats(remaining,1e9,BODIES.earth),m=mass(remaining),fuel=activeStage(remaining).reduce((n,p)=>n+p.fuel,0);if(e.isp&&fuel>0)dv+=e.isp*9.80665*Math.log(m/(m-fuel));const i=remaining.findIndex(p=>p.type==='separator');if(i<0)break;remaining=remaining.slice(i+1);}return dv;
}
export function validateBlueprint(data){
 if(!data||!Array.isArray(data.parts)||!data.parts.length||data.parts.length>50)throw Error('Потрібно від 1 до 50 деталей.');
 const parts=data.parts.map(p=>{if(!PARTS[p.type])throw Error('Невідомий тип деталі.');if(!Number.isFinite(p.length)||p.length<.4||p.length>2.5||!Number.isFinite(p.width)||p.width<.5||p.width>1.8)throw Error('Некоректний розмір.');const q=part(p.type);q.length=p.length;q.width=p.width;q.finish=['white','metal','carbon','stripe'].includes(p.finish)?p.finish:'white';q.fuel=capacity(q);return q;});
 return {name:typeof data.name==='string'?data.name.slice(0,32):'Новий проєкт',parts};
}
