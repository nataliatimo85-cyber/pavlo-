import {test} from 'node:test';
import assert from 'node:assert/strict';
import {V,BODIES,coast,elements,predict,defaultRocket,mass,deltaV,engineStats,validateBlueprint,capacity} from '../physics.js';
const earth=BODIES.earth,r=earth.radius+90000,v=Math.sqrt(earth.mu/r);
test('circular orbit stays circular and conserves energy over one orbit',()=>{let state={p:[0,r,0],v:[v,0,0]};const initial=elements(state.p,state.v,earth),duration=initial.period;for(let t=0;t<duration;t+=.5)state=coast(state.p,state.v,Math.min(.5,duration-t),earth);const final=elements(state.p,state.v,earth);assert.ok(Math.abs(final.energy/initial.energy-1)<1e-8);assert.ok(Math.abs(V.len(state.p)-r)<1);assert.ok(V.len(V.sub(state.p,[0,r,0]))<10);assert.ok(Math.abs(initial.apo-90000)<1e-6);assert.ok(Math.abs(initial.peri-90000)<1e-6);});
test('escape trajectory has no finite apoapsis',()=>{assert.equal(elements([0,r,0],[v*1.5,0,0],earth).apo,Infinity);});
test('radial suborbital trajectory intersects surface in prediction',()=>{const points=predict([0,earth.radius+10000,0],[0,500,0],earth);assert.ok(points.some(p=>V.len(p)<earth.radius));});
test('default rocket can lift off and has orbital delta-v',()=>{const p=defaultRocket();assert.ok(engineStats(p,0,earth).thrust/mass(p)>9.81);assert.ok(deltaV(p)>4000);assert.ok(deltaV(p)<15000);});
test('blueprints reject malformed and oversized input and refill tanks',()=>{assert.throws(()=>validateBlueprint({parts:[{type:'unknown',length:1,width:1}]}));assert.throws(()=>validateBlueprint({parts:Array(51).fill({})}));assert.throws(()=>validateBlueprint({parts:[{type:'tank',length:NaN,width:1}]}));const d=validateBlueprint({parts:defaultRocket()});for(const p of d.parts)assert.equal(p.fuel,capacity(p));});
