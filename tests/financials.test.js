import test from 'node:test';
import assert from 'node:assert/strict';
import {openStore} from '../server/store.js';
import {sampleDraft,selectionKey} from '../shared/product.js';
import {financialValues,financialNarrative} from '../shared/financials.js';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';

test('empty facility is zero without synthetic transactions or services',()=>{
 const store=openStore(':memory:');try{const s=store.snapshot(store.create()),v=financialValues(s);assert.deepEqual(v.values,[0]);assert.equal(v.net,0);assert.equal(v.events.length,0);assert.equal(v.popular.length,0);assert.ok(v.reconciled);assert.equal(financialNarrative(s).mode,'empty');}finally{store.close();}
});
test('charges, amendments and full cancellation retain the historical curve and reconcile',()=>{
 const store=openStore(':memory:');try{const id=store.create(),draft=sampleDraft(1,2);store.book(id,'first-booking',draft);const b=store.snapshot(id).bookings[0];
 const extra={...draft,services:[...draft.services,selectionKey(draft.legs[0],'lounge','departure')]};
 store.manage(id,'increase','amend',{bookingId:b.id,version:1,payload:extra});store.manage(id,'decrease','amend',{bookingId:b.id,version:2,payload:draft});const s=store.manage(id,'cancelled','cancel',{bookingId:b.id,version:3});const before=JSON.stringify(s),v=financialValues(s);
 assert.deepEqual(v.values,[0,57600,97200,57600,0]);assert.equal(v.charges,97200);assert.equal(v.returns,97200);assert.equal(v.active,0);assert.equal(v.savings,0);assert.equal(v.popular.length,0);assert.ok(v.reconciled);assert.equal(financialNarrative(s).mode,'credit-returns');assert.equal(JSON.stringify(s),before);
 }finally{store.close();}
});
test('mixed records retain all history but active insights exclude cancelled selections',()=>{
 const store=openStore(':memory:');try{const id=store.create(),d=sampleDraft(1,2);store.book(id,'one',d);const first=store.snapshot(id).bookings[0];store.book(id,'two',sampleDraft(1,1));store.manage(id,'cancel-one','cancel',{bookingId:first.id,version:1});const v=financialValues(store.snapshot(id));assert.equal(v.active,1);assert.equal(v.net,28800);assert.equal(v.events.length,3);assert.equal(v.popular.reduce((n,s)=>n+s.count,0),2);assert.ok(v.reconciled);}finally{store.close();}
});
test('zero-price amendments remain events, legacy confirmations reconcile, inconsistent ledgers are flagged',()=>{
 const s={bookings:[{id:'a',created:'2026-09-20',subtotal:64000,discount:6400,total:57600,services:[]}],credit:{limit:10000000,used:57600,available:9942400}};
 assert.equal(financialValues(s).events.length,1);assert.ok(financialValues(s).reconciled);s.bookings[0].history=[{kind:'confirmed',at:'2026-09-20',delta:57600},{kind:'amended',at:'2026-09-21',delta:0}];assert.deepEqual(financialValues(s).values,[0,57600,57600]);s.credit.used=1;assert.equal(financialValues(s).reconciled,false);
});
test('actual Financials renders retained returns and gates booking links, with currency fault isolated to the chart',async()=>{
 const vite=await createServer({configFile:false,server:{middlewareMode:true},appType:'custom',logLevel:'silent'});const store=openStore(':memory:');try{
 const {Financials}=await vite.ssrLoadModule('/src/product/pages.jsx');const id=store.create();store.book(id,'first',sampleDraft());const b=store.snapshot(id).bookings[0];const session=store.manage(id,'cancel','cancel',{bookingId:b.id,version:1});
 const props={session,onOpen:()=>{},availableFeatures:['financials']};const html=renderToStaticMarkup(React.createElement(Financials,props));assert.match(html,/AED\s100,000\.00/);assert.match(html,/cancelled/);assert.match(html,/No active service selections/);assert.doesNotMatch(html,/No booking activity yet/);assert.match(html,/disabled=""[^>]*>View booking/);assert.match(html,/Returned/);
 const live=renderToStaticMarkup(React.createElement(Financials,{...props,availableFeatures:['financials','bookings']}));assert.doesNotMatch(live,/disabled=""/);
 const fault=renderToStaticMarkup(React.createElement(Financials,{...props,axisFault:true}));assert.match(fault,/Start · USD 0/);assert.match(fault,/AED\s100,000\.00/);assert.doesNotMatch(html,/USD/);
 }finally{store.close();await vite.close();}
});
