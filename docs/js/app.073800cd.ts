(function(e){function t(t){for(var s,n,o=t[0],l=t[1],c=t[2],u=0,d=[];u<o.length;u++)n=o[u],i[n]&&d.push(i[n][0]),i[n]=0;for(s in l)Object.prototype.hasOwnProperty.call(l,s)&&(e[s]=l[s]);p&&p(t);while(d.length)d.shift()();return r.push.apply(r,c||[]),a()}function a(){for(var e,t=0;t<r.length;t++){for(var a=r[t],s=!0,o=1;o<a.length;o++){var l=a[o];0!==i[l]&&(s=!1)}s&&(r.splice(t--,1),e=n(n.s=a[0]))}return e}var s={},i={app:0},r=[];function n(t){if(s[t])return s[t].exports;var a=s[t]={i:t,l:!1,exports:{}};return e[t].call(a.exports,a,a.exports,n),a.l=!0,a.exports}n.m=e,n.c=s,n.d=function(e,t,a){n.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:a})},n.r=function(e){"undefined"!==typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},n.t=function(e,t){if(1&t&&(e=n(e)),8&t)return e;if(4&t&&"object"===typeof e&&e&&e.__esModule)return e;var a=Object.create(null);if(n.r(a),Object.defineProperty(a,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var s in e)n.d(a,s,function(t){return e[t]}.bind(null,s));return a},n.n=function(e){var t=e&&e.__esModule?function(){return e["default"]}:function(){return e};return n.d(t,"a",t),t},n.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},n.p="";var o=window["webpackJsonp"]=window["webpackJsonp"]||[],l=o.push.bind(o);o.push=t,o=o.slice();for(var c=0;c<o.length;c++)t(o[c]);var p=l;r.push([0,"chunk-vendors"]),a()})({0:function(e,t,a){e.exports=a("56d7")},"07bb":function(e,t,a){},"28f3":function(e,t,a){"use strict";var s=a("8afc"),i=a.n(s);i.a},5490:function(e,t,a){"use strict";var s=a("bdf3"),i=a.n(s);i.a},"56d7":function(e,t,a){"use strict";a.r(t);var s=a("2b0e"),i=function(){var e=this,t=e.$createElement,a=e._self._c||t;return a("div",{staticClass:"flex flex-column vh-100 avenir",attrs:{id:"app"}},[a("div",{staticClass:"bb b--gray bg-washed-yellow",attrs:{id:"top"}}),a("div",{staticClass:"flex flex-auto",attrs:{id:"middle"}},[a("div",{staticClass:"br b--light-gray overflow-auto pa2-ns",class:{collapsed:!e.sidebarOpen},attrs:{id:"sidebar"}},[a("div",{staticClass:"container br bg-white b--light-gray overflow-auto pa2 bw2"},[e._m(0),a("FeatureInfo"),a("Filters"),a("AnimationControls"),a("HashStats")],1)]),a("div",{directives:[{name:"show",rawName:"v-show",value:!e.sidebarOpen,expression:"!sidebarOpen"}],staticClass:"relative br b--gray bw2",staticStyle:{width:"20px"},attrs:{id:"sidebar-rim"},on:{click:function(t){e.sidebarOpen=!0}}}),a("div",{staticClass:"relative flex-auto",attrs:{id:"map-container"}},[a("Map"),a("div",{staticClass:"absolute bg-white f3 br bt bb br--right br-100 b--magenta bw1 magenta pa1 pointer grow fw8",attrs:{id:"sidebarToggle"},on:{click:function(t){e.sidebarOpen=!e.sidebarOpen}}},[e.sidebarOpen?e._e():a("span",[e._v("→")]),e.sidebarOpen?a("span",[e._v("←")]):e._e()]),a("div",{staticClass:"absolute h-100 w-100",attrs:{id:"overlay"}},[a("Legend")],1)],1)]),a("div",{staticClass:"bt b--light-gray flex-none",attrs:{id:"bottom"}})])},r=[function(){var e=this,t=e.$createElement,a=e._self._c||t;return a("div",{staticClass:"credits"},[e._v("By "),a("a",{attrs:{href:"https://hire.stevebennett.me"}},[e._v("Steve Bennett")]),e._v(". Data by "),a("a",{attrs:{href:"https://fippe.de"}},[e._v("fippe")]),e._v(".")])}],n=function(){var e=this,t=e.$createElement,a=e._self._c||t;return a("div",{staticClass:"absolute absolute--fill",attrs:{id:"map"}})},o=[],l=a("b7d4"),c=a.n(l),p=(a("5e64"),a("602d"));const u=new s["a"];var d=a("3243");function h(e){return 4===String(e).length&&(e=`${e}-01-01`),Math.floor(new Date(e)/864e5)}function f(e){const[t,a]=e.getBounds().toArray()[0].map(Math.floor),[s,i]=e.getBounds().toArray()[1].map(Math.ceil);return[t,a,s,i]}let m,g;async function v(e,t){const a=e?"alldata.json":"https://fippe-geojson.glitch.me/alldata.json",s=await window.fetch(a).then(e=>e.json());if(g&&e)return;m=s;const i={};m.features.forEach((e,t)=>{e.id=t;const[a,s,i]=e.properties.id.split("_");e.properties.year=+a.slice(0,4),e.properties.days=h(e.properties.id.slice(0,10)),e.properties.x=+i||0,e.properties.y=+s||0,e.properties.global=/global/.test(e.properties.id)}),m.features.sort((e,t)=>e.properties.days-t.properties.days);for(const r of m.features){for(const a of r.properties.participants)i[a]||(i[a]={expeditions:0,firstExpeditionDays:r.properties.days}),i[a].expeditions++;r.properties.participantsString=r.properties.participants.join(", "),r.properties.participantsStringLower=r.properties.participantsString.toLowerCase(),r.properties.participantsCount=r.properties.participants.length;const e=r.properties.participants.map(e=>i[e].expeditions);r.properties.experienceMax=e.length?Math.max(...e):0,r.properties.experienceMin=e.length?Math.min(...e):0,r.properties.experienceTotal=e.length?e.reduce((e,t)=>e+t,0):0;const t=r.properties.participants.map(e=>r.properties.days-i[e].firstExpeditionDays);r.properties.experienceDaysMax=t.length?Math.max(...t):0,r.properties.experienceDaysMin=t.length?Math.min(...t):0,r.properties.experienceDaysTotal=t.length?t.reduce((e,t)=>e+t,0):0}t.U.setData("hashes",m),u.$emit("hashes-loaded",m),window.hashes=m,M({map:t}),g=!0}function b(){const e=["interpolate-hcl",["linear"],["get","days"],h(2008),"hsl(200, 80%, 40%)",h(2016),"red",h(2021),"hsl(60,100%,40%)",h(2022),"hsl(120, 100%, 70%)"];return e}function y(){const e=["interpolate-hcl",["linear"],["get","experienceMax"],1,"hsl(200, 80%, 40%)",10,"hsl(280, 80%, 40%)",50,"red",100,"hsl(60,100%,50%)",250,"hsl(120, 100%, 70%)"];return e}function x(){const e=["interpolate-hcl",["linear"],["get","experienceDaysMax"],0,"hsl(200, 80%, 40%)",365,"hsl(280, 80%, 40%)",730,"red",1825,"hsl(60,100%,50%)",3650,"hsl(120, 100%, 70%)",7300,"hsl(120, 100%, 70%)"];return e}function w(e){return{year:b(),experienceMax:y(),experienceDaysMax:x()}[e.colorVis]}function _(e){const t=[];if("experienceMax"===e.colorVis)for(let a of[1,5,10,20,50,100,250]){const s=d["a"].parse(w(e)).evaluate({type:"Feature",properties:{experienceMax:a},geometry:null});t.push([a,s])}else if("experienceDaysMax"===e.colorVis)for(let a of[0,1,2,5,10]){const s=d["a"].parse(w(e)).evaluate({type:"Feature",properties:{experienceDaysMax:365*a},geometry:null});t.push([a,s])}else for(let a=2008;a<=2022;a++){const s=d["a"].parse(w(e)).evaluate({type:"Feature",properties:{year:a,days:h(a)},geometry:null});t.push([a,s])}return t}function S({isGlow:e,isFlash:t,filters:a}={}){const s=t?30:e?2:0,i=e=>a.scaleExpedition?["+",["*",["log2",["length",["get","participants"]]],e],s]:["+",e,s];return["interpolate",["linear"],["zoom"],1,t?5:e?0:i(1),3,t?10:i(1),5,t?15:i(2),8,i(3),10,i(4),12,i(e?16:10)]}function C({map:e,filters:t}){const a="all"===t.outcome||["==",["get","success"],"success"===t.outcome];e.U.setFilter(/hashes-/,["all",!t.participants||["in",(t.participants||"").replace(/ /g,"_").toLowerCase(),["get","participantsStringLower"]],[">=",["get","participantsCount"],t.minParticipants],[">=",["get","year"],t.minYear],["<=",["get","year"],t.maxYear],a]),e.U.setCircleRadius("hashes-circles",S({filters:t}))}function O({map:e,filters:t}){const a=!0,s=!e.getLayer("hashes-circles");s&&(e.U.addGeoJSON("hashes"),v(!0,e).then(()=>M({map:e,filters:t,show:!0})),v(!1,e).then(()=>M({map:e,filters:t,show:!0}))),e.U.addCircle("hashes-glow","hashes",{circleColor:["step",["zoom"],w(t),3,["case",["get","success"],w(t),"transparent"]],circleOpacity:["feature-state","opacity"],circleBlur:.5,circleRadius:S({isGlow:!0,filters:t}),circleSortKey:["get","days"]}),e.U.addCircle("hashes-circles","hashes",{circleStrokeColor:["case",["get","success"],["case",["get","global"],"#fff","hsla(0,0%,30%,0.5)"],w(t)],circleStrokeWidth:["step",["zoom"],["case",["get","global"],0,0],1,["case",["get","global"],1,0],3,["case",["get","global"],2,["case",["get","success"],0,2]],6,["case",["get","global"],2,["case",["get","success"],.5,2]],8,["case",["get","global"],4,["case",["get","success"],1,2]]],circleColor:["step",["zoom"],w(t),3,["case",["get","success"],w(t),"transparent"]],circleRadius:S({filters:t}),circleSortKey:["get","days"],circleOpacity:["feature-state","opacity"],circleStrokeOpacity:["case",["feature-state","show"],1,0]}),e.U.addCircle("hashes-flash","hashes",{circleStrokeColor:["case",["get","success"],"hsla(0,0%,30%,0.5)",w(t)],circleColor:["step",["zoom"],w(t),4,["case",["get","success"],w(t),"transparent"]],circleRadius:S({isFlash:!0,filters:t}),circleSortKey:["get","days"],circleOpacity:["feature-state","flashOpacity"],circleStrokeOpacity:["case",["feature-state","show"],1,0],circleBlur:1.5}),e.U.addSymbol("hashes-label","hashes",{textField:["step",["zoom"],["slice",["get","id"],0,4],11,["slice",["get","id"],0,10],12,["concat",["slice",["get","id"],0,10],"\n",["get","participantsString"]]],textSize:["interpolate",["linear"],["zoom"],10,10,12,12],textOffset:[0,1.5],textColor:w(t),textHaloColor:a?"hsla(0,0%,0%,0.4)":"hsla(0,0%,100%,0.5)",textHaloWidth:1,textOpacity:["feature-state","opacity"],minzoom:9}),C({map:e,filters:t}),s&&(e.U.hoverPointer(/hashes-circles/),e.on("click","hashes-circles",e=>{console.log(e),u.$emit("select-feature",e.features[0])}),e.on("click","hashes-glow",e=>{console.log(e),u.$emit("select-feature",e.features[0])}),e.U.hoverPopup("hashes-glow",e=>`<div>${e.properties.id}</div> ${JSON.parse(e.properties.participants).join(", ")}`,{closeButton:!1})),u.$emit("colors-change",{colorVis:t.colorVis,colors:_(t)})}function M({map:e,filters:t,show:a}){for(const s of m.features)e.setFeatureState({id:s.id,source:"hashes"},{opacity:a?1:0,show:a,flashOpacity:0})}function $({map:e,filters:t,minx:a,maxx:s,miny:i,maxy:r,animationDay:n}){for(const o of m.features)if(o.properties.x>=a&&o.properties.x<=s&&o.properties.y>=i&&o.properties.y<=r||o.properties.global){const t=n-o.properties.days;if(t<0)break;t>=0&&t<=730&&(e.setFeatureState({id:o.id,source:"hashes"},{show:t>0,opacity:t<0?0:Math.max(1-t/730,.2),flashOpacity:t<0?0:Math.max(1-t/120,0)}),0)}}function F({map:e}){const t=!e.getSource("meridians");t&&(e.U.addGeoJSON("meridians"),e.U.setData("meridians",{type:"FeatureCollection",features:[{type:"Feature",properties:{},geometry:{type:"LineString",coordinates:[[-180,0],[180,0]]}},{type:"Feature",properties:{},geometry:{type:"LineString",coordinates:[[0,90],[0,-90]]}},{type:"Feature",properties:{},geometry:{type:"LineString",coordinates:[[180,90],[180,-90]]}}]})),e.U.addLine("meridians-line","meridians",{lineColor:["interpolate",["linear"],["zoom"],3,"#333",7,"#777"],lineDasharray:[4,8]})}let D={};const A=e=>Object.is(e,-0)?"-0":String(e);function k(e,t){return D[e]&&D[e][t]||{expeditions:0,successes:0,failures:0}}function j(e){const t=e=>(e+540)%360-180,a=e.getBounds().toArray().flat();function s(e,t){for(let a=0;a<=179;a++)for(let s=0;s<=89;s++){const r=a*e,n=s*t;i.push({type:"Feature",geometry:{type:"Polygon",coordinates:[[[r,n],[r+e,n],[r+e,n+t],[r,n+t],[r,n]]]},properties:{x:A(a*e),y:A(s*t),...k(r,n)}})}}a[0]=t(a[0]),a[2]=t(a[2]);const i=[];s(1,1),s(-1,1),s(1,-1),s(-1,-1);const r={type:"FeatureCollection",features:i};return console.log(r.features.length,"graticules"),r}function P(e){e.getBounds().getNorth()-e.getBounds().getSouth()<40?e.U.setData("graticules",j(e)):e.U.setData("graticules")}function E({map:e,filters:t}){const a=!e.getSource("graticules");a&&(e.U.addGeoJSON("graticules"),e.on("moveend",()=>{}),P(e)),e.U.addLine("graticules-line","graticules",{lineColor:["case",[">",["get","successes"],0],"hsla(0,0%,30%,0.15)","hsla(0,0%,30%,0.15)"],lineOpacity:["interpolate",["linear"],["zoom"],5,0,6,1],minzoom:4}),e.U.addFill("graticules-fill","graticules",{fillColor:["case",[">",["get","successes"],0],"transparent","hsla(0,0%,30%,0.2)"],fillOutlineColor:"transparent",fillOpacity:["interpolate",["linear"],["zoom"],3,0,4,1],minzoom:3})}u.$on("hashes-loaded",e=>{D={};for(const t of e.features){const e=A(t.properties.x),a=A(t.properties.y);t.properties.global||(D[e]=D[e]||{},D[e][a]=D[e][a]||{expeditions:0,successes:0,failures:0},D[e][a].expeditions++,t.properties.success?D[e][a].successes++:D[e][a].failures++)}window.graticules=D,P(window.map)});var U={data:()=>({filters:{minYear:2008,maxYear:2022,colorVis:"experienceDaysMax",participants:"",outcome:"all"},animationDay:0}),async mounted(){c.a.accessToken="pk.eyJ1Ijoic3RldmFnZSIsImEiOiJja3p5cHdtOGEwMm1hM2RtdzJlYXJrajhrIn0.veC37cfBaslGu1MteavjNA";const e=new c.a.Map({container:"map",center:[144.96,-37.81],zoom:7,style:"mapbox://styles/stevage/ckzoqlsr1000115qtr5pendfa/draft",hash:"center"});p["a"].init(e,c.a),window.map=e,window.map.hash="center",this.map=e,window.app.Map=this,await e.U.onLoad(),u.$emit("map-loaded",e),this.filters=window.Filters.filters,this.initMapContent(e),u.$on("filters-change",e=>{this.filters=e,this.updateMapStyle()}),u.$on("animation-change",e=>e?this.startAnimation():this.stopAnimation())},methods:{findPairs(e){const t={};let a=[0,null];for(const i of e.features)for(const e of i.properties.participants){t[e]||(t[e]={});for(const s of i.properties.participants)e!==s&&(t[e][s]=(t[e][s]||0)+1,t[e][s]>a[0]&&(a=[t[e][s],e,s]))}console.log("Maximum pair",a);let s="";for(const[i,r]of Object.entries(t))for(const[e,t]of Object.entries(r))t>50&&i>e&&console.log(i,e,t);console.log(s);for(const[i,r]of Object.entries(t).filter(e=>"Stevage"===e[0]))for(const[e,t]of Object.entries(r))console.log(i,e,t)},async initMapContent(e){this.updateMapStyle()},updateMapStyle(){O({map:this.map,filters:this.filters}),E({map:this.map,filters:this.filters}),F({map:map})},startAnimation(){this.stopAnimation(),this.animationDay=h(`${this.filters.minYear}-01-01`),M({map:this.map,filters:this.filters,show:!1}),this.lastFrame=0,this.timerFunc=(e=>{if(!this.timer||this.animationDay>h(new Date))u.$emit("animation-ended"),this.stopAnimation();else{if(this.updateAnimation(),this.lastFrame){const t=e-this.lastFrame,a=Math.max(1,Math.floor(t/10));this.animationDay+=a}this.lastFrame=e,requestAnimationFrame(this.timerFunc)}}),this.timer=1,requestAnimationFrame(this.timerFunc)},stopAnimation(){this.timer,this.timer=0,M({map:this.map,filters:this.filters,show:!0})},updateAnimation(){const[e,t,a,s]=f(this.map);u.$emit("animation-cycle",{animationDay:this.animationDay}),$({map:this.map,filters:this.filters,minx:e,miny:t,maxx:a,maxy:s,animationDay:this.animationDay})}}},Y=U,N=(a("5490"),a("2877")),z=Object(N["a"])(Y,n,o,!1,null,null,null);z.options.__file="Map.vue";var L=z.exports,H=function(){var e=this,t=e.$createElement,a=e._self._c||t;return e.p?a("div",[e.imageUrl?a("img",{staticClass:"image",attrs:{src:e.imageUrl}}):e._e(),a("h2",[a("a",{attrs:{href:"https://geohashing.site/geohashing/"+e.p.id,target:"_blank"}},[e._v(e._s(e.p.id))])]),e.p.success?a("div",[e._v("Successful geohash!")]):e._e(),e.p.success?e._e():a("div",[e._v("Failed geohash")]),a("h4",[e._v(" Participants")]),e._l(JSON.parse(e.p.participants),function(t){return a("div",[e._v(e._s(t))])}),a("h4",[e._v("Experience")]),a("div",[e._v("Years (most experienced): "+e._s((e.p.experienceDaysMax/365).toFixed(2)))])],2):e._e()},V=[],J={name:"FeatureInfo",data:()=>({feature:void 0,ignoreProps:["id","Longitude","Latitude","image_url"]}),computed:{p(){return this.feature&&this.feature.properties},imageUrl(){return this.p&&this.p.image_url}},created(){window.app.FeatureInfo=this,u.$on("select-feature",e=>this.feature=e)}},B=J,I=(a("28f3"),Object(N["a"])(B,H,V,!1,null,"412b6cd4",null));I.options.__file="FeatureInfo.vue";var T=I.exports,q=function(){var e=this,t=e.$createElement,a=e._self._c||t;return a("div",{staticClass:"relative h-100",attrs:{id:"Legend"}},[a("div",{staticClass:"bg-dark-gray light-gray b--gray ba shadow-1 pa2 ma2 bottom absolute bottom-2"},[a("h3",[e._v(e._s(e.title))]),e._l(e.colors.slice().reverse(),function(t){var s=t[0],i=t[1];return a("div",[a("div",{staticClass:"pill",style:{backgroundColor:i}}),e._v(e._s(s))])})],2)])},G=[],R={name:"Legend",data:()=>({colors:window.app.yearColors,colorVis:"experienceDaysMax"}),created(){window.Legend=this,u.$on("colors-change",({colorVis:e,colors:t})=>{console.log(t),this.colors=t,this.colorVis=e})},computed:{title(){return{experienceMax:"Expeditions",experienceDaysMax:"Years of geohashing",year:"Year"}[this.colorVis]}}},K=R,W=(a("8faa"),Object(N["a"])(K,q,G,!1,null,"58842f40",null));W.options.__file="Legend.vue";var X=W.exports,Z=function(){var e=this,t=e.$createElement,a=e._self._c||t;return a("div",{class:{disabled:!e.enabled},attrs:{id:"Filters"}},[a("h3",[e._v("Filters")]),a("label",{staticClass:"mb2"},[a("div",[e._v("Participant name")]),a("input",{directives:[{name:"model",rawName:"v-model",value:e.filters.participants,expression:"filters.participants"}],staticClass:"mr1",attrs:{id:"filter-by-participants",type:"text",disabled:!e.enabled},domProps:{value:e.filters.participants},on:{input:function(t){t.target.composing||e.$set(e.filters,"participants",t.target.value)}}})]),a("label",{staticClass:"mb2"},[a("div",[e._v("Minimum participants")]),a("input",{directives:[{name:"model",rawName:"v-model.number",value:e.filters.minParticipants,expression:"filters.minParticipants",modifiers:{number:!0}}],staticClass:"mr1",attrs:{id:"filter-by-participants",type:"number",min:"1",disabled:!e.enabled},domProps:{value:e.filters.minParticipants},on:{input:function(t){t.target.composing||e.$set(e.filters,"minParticipants",e._n(t.target.value))},blur:function(t){e.$forceUpdate()}}})]),a("label",{staticClass:"mb2"},[a("div",[e._v("Minimum year")]),a("input",{directives:[{name:"model",rawName:"v-model.number",value:e.filters.minYear,expression:"filters.minYear",modifiers:{number:!0}}],staticClass:"mr1",attrs:{id:"filter-by-participants",type:"number",min:"2008",max:e.filters.maxYear,disabled:!e.enabled},domProps:{value:e.filters.minYear},on:{input:function(t){t.target.composing||e.$set(e.filters,"minYear",e._n(t.target.value))},blur:function(t){e.$forceUpdate()}}})]),a("label",[a("div",[e._v("Maximum year")]),a("input",{directives:[{name:"model",rawName:"v-model.number",value:e.filters.maxYear,expression:"filters.maxYear",modifiers:{number:!0}}],staticClass:"mr1",attrs:{id:"filter-by-participants",type:"number",min:"2008",max:"2030",disabled:!e.enabled},domProps:{value:e.filters.maxYear},on:{input:function(t){t.target.composing||e.$set(e.filters,"maxYear",e._n(t.target.value))},blur:function(t){e.$forceUpdate()}}})]),a("h5",[e._v("Outcome")]),a("label",[a("input",{directives:[{name:"model",rawName:"v-model",value:e.filters.outcome,expression:"filters.outcome"}],staticClass:"mr1",attrs:{type:"radio",value:"all",disabled:!e.enabled},domProps:{checked:e._q(e.filters.outcome,"all")},on:{change:function(t){e.$set(e.filters,"outcome","all")}}}),e._v("All")]),a("label",[a("input",{directives:[{name:"model",rawName:"v-model",value:e.filters.outcome,expression:"filters.outcome"}],staticClass:"mr1",attrs:{type:"radio",value:"success",disabled:!e.enabled},domProps:{checked:e._q(e.filters.outcome,"success")},on:{change:function(t){e.$set(e.filters,"outcome","success")}}}),e._v("Successes")]),a("label",[a("input",{directives:[{name:"model",rawName:"v-model",value:e.filters.outcome,expression:"filters.outcome"}],staticClass:"mr1",attrs:{type:"radio",value:"failure",disabled:!e.enabled},domProps:{checked:e._q(e.filters.outcome,"failure")},on:{change:function(t){e.$set(e.filters,"outcome","failure")}}}),e._v("Failures")]),a("h4",{staticClass:"mb1"},[e._v("Visualisation")]),a("label",{staticClass:"mb2"},[a("span",[e._v("Color by")]),a("select",{directives:[{name:"model",rawName:"v-model",value:e.filters.colorVis,expression:"filters.colorVis"}],attrs:{disabled:!e.enabled},on:{change:function(t){var a=Array.prototype.filter.call(t.target.options,function(e){return e.selected}).map(function(e){var t="_value"in e?e._value:e.value;return t});e.$set(e.filters,"colorVis",t.target.multiple?a:a[0])}}},[a("option",{attrs:{value:"year"}},[e._v("Year")]),a("option",{attrs:{value:"experienceMax"}},[e._v("Hasher's previous expeditions")]),a("option",{attrs:{value:"experienceDaysMax"}},[e._v("Hasher's years of experience")])])]),a("label",[a("input",{directives:[{name:"model",rawName:"v-model",value:e.filters.scaleExpedition,expression:"filters.scaleExpedition"}],staticClass:"mr1",attrs:{id:"filter-by-participants",type:"checkbox",disabled:!e.enabled},domProps:{checked:Array.isArray(e.filters.scaleExpedition)?e._i(e.filters.scaleExpedition,null)>-1:e.filters.scaleExpedition},on:{change:function(t){var a=e.filters.scaleExpedition,s=t.target,i=!!s.checked;if(Array.isArray(a)){var r=null,n=e._i(a,r);s.checked?n<0&&e.$set(e.filters,"scaleExpedition",a.concat([r])):n>-1&&e.$set(e.filters,"scaleExpedition",a.slice(0,n).concat(a.slice(n+1)))}else e.$set(e.filters,"scaleExpedition",i)}}}),a("span",[e._v("Scale by expedition size")])])])},Q=[],ee={name:"Filters",data:()=>({enabled:!0,filters:{participants:"",minParticipants:0,scaleExpedition:!1,minYear:2008,maxYear:2022,outcome:"all",colorVis:"year"}}),created(){window.Filters=this,u.$on("animation-change",e=>this.enabled=!e)},watch:{filters:{deep:!0,handler(){this.filters.minYear>this.filters.maxYear&&(this.filters.minYear=this.filters.maxYear),u.$emit("filters-change",this.filters)}}}},te=ee,ae=(a("6687"),Object(N["a"])(te,Z,Q,!1,null,"7d8f3c42",null));ae.options.__file="Filters.vue";var se=ae.exports,ie=function(){var e=this,t=e.$createElement,a=e._self._c||t;return a("div",{attrs:{id:"AnimationControls"}},[a("h3",[e._v("Animation")]),a("button",{on:{click:e.toggleAnimation}},[e._v(e._s(e.running?"Stop":"Start"))]),e.running&&e.animationDay?a("p",[e._v(e._s(new Date(864e5*e.animationDay).toISOString().slice(0,7)))]):e._e()])},re=[],ne={name:"AnimationControls",data:()=>({running:!1,animationDay:""}),created(){window.AnimationControls=this,u.$on("animation-cycle",({animationDay:e})=>this.animationDay=e),u.$on("animation-ended",()=>{console.log("not running"),this.running=!1})},methods:{async toggleAnimation(){this.running=!this.running,console.log(this.running),await this.$nextTick(),u.$emit("animation-change",this.running)}}},oe=ne,le=Object(N["a"])(oe,ie,re,!1,null,"6618fe45",null);le.options.__file="AnimationControls.vue";var ce=le.exports,pe=function(){var e=this,t=e.$createElement,a=e._self._c||t;return a("div",{staticClass:"bg-white",attrs:{id:"HashStats"}},[a("h3",[e._v("Stats")]),a("label",[a("input",{directives:[{name:"model",rawName:"v-model",value:e.showStats,expression:"showStats"}],staticClass:"mr2",attrs:{type:"checkbox"},domProps:{checked:Array.isArray(e.showStats)?e._i(e.showStats,null)>-1:e.showStats},on:{change:function(t){var a=e.showStats,s=t.target,i=!!s.checked;if(Array.isArray(a)){var r=null,n=e._i(a,r);s.checked?n<0&&(e.showStats=a.concat([r])):n>-1&&(e.showStats=a.slice(0,n).concat(a.slice(n+1)))}else e.showStats=i}}}),e._v("Show stats")]),a("div",{directives:[{name:"show",rawName:"v-show",value:e.showStats&&e.hashes.length,expression:"showStats && hashes.length"}]},[a("h3",{staticClass:"mb1"},[e._v("Hashers in this area")]),a("table",[e._m(0),e._l(e.topHashers.slice(0,10),function(t){return a("tr",[a("td",[a("a",{attrs:{href:"https://geohashing.site/geohashing/User:"+t.name}},[e._v(e._s(t.name))])]),a("td",[e._v(e._s(t.success))]),a("td",[e._v(e._s(t.fail))]),a("td",[e._v(e._s(t.success+t.fail))])])})],2)])])},ue=[function(){var e=this,t=e.$createElement,a=e._self._c||t;return a("tr",[a("th",[e._v("Name")]),a("th",[e._v("Success")]),a("th",[e._v("Fail")]),a("th",[e._v("Total")])])}],de={name:"HashStats",data:()=>({hashes:[],showStats:!1}),created(){window.HashStats=this,u.$on("map-loaded",e=>e.on("moveend",()=>this.update(e)))},methods:{update(e){this.showStats&&(this.hashes=e.queryRenderedFeatures({layers:["hashes-circles"]}))}},computed:{topHashers(){const e={};for(const a of this.hashes)for(const t of JSON.parse(a.properties.participants))e[t]=e[t]||{success:0,fail:0},e[t][a.properties.success?"success":"fail"]++;const t=Object.entries(e).map(([e,t])=>({name:e,...t})).sort((e,t)=>t.success-e.success);return t},newestHashers(){}},watch:{showStats(){this.showStats&&this.update(window.map)}}},he=de,fe=(a("87a4"),Object(N["a"])(he,pe,ue,!1,null,"ebb3806c",null));fe.options.__file="HashStats.vue";var me=fe.exports;window.app={},window.app.yearColors="#000 #e69f00 #56b4e9 #009e73 #f0e442 #0072b2 #d55e00 #cc79a7 #999999".split(" ");var ge={name:"app",components:{Map:L,FeatureInfo:T,Legend:X,Filters:se,AnimationControls:ce,HashStats:me},data(){return{sidebarOpen:!0}},created(){window.app.App=this,u.$on("select-feature",()=>this.sidebarOpen=!0)},watch:{sidebarOpen(){this.$nextTick(()=>window.map.resize())}}};a("948e");var ve=ge,be=(a("add8"),a("b0a0"),Object(N["a"])(ve,i,r,!1,null,"7200716d",null));be.options.__file="App.vue";var ye=be.exports;s["a"].config.productionTip=!1,new s["a"]({render:e=>e(ye)}).$mount("#app")},6687:function(e,t,a){"use strict";var s=a("f4dd"),i=a.n(s);i.a},"69a1":function(e,t,a){},"7da0":function(e,t,a){},"87a4":function(e,t,a){"use strict";var s=a("b914"),i=a.n(s);i.a},"8afc":function(e,t,a){},"8faa":function(e,t,a){"use strict";var s=a("69a1"),i=a.n(s);i.a},add8:function(e,t,a){"use strict";var s=a("7da0"),i=a.n(s);i.a},b0a0:function(e,t,a){"use strict";var s=a("07bb"),i=a.n(s);i.a},b914:function(e,t,a){},bdf3:function(e,t,a){},f4dd:function(e,t,a){}});
//# sourceMappingURL=app.073800cd.js.map