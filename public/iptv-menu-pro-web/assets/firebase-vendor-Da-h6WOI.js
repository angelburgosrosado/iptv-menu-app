import{o as Wu,R as Ts}from"./vendor-C8FB8QAo.js";const Gu=()=>{};var to={};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Yo=function(n){const e=[];let t=0;for(let r=0;r<n.length;r++){let i=n.charCodeAt(r);i<128?e[t++]=i:i<2048?(e[t++]=i>>6|192,e[t++]=i&63|128):(i&64512)===55296&&r+1<n.length&&(n.charCodeAt(r+1)&64512)===56320?(i=65536+((i&1023)<<10)+(n.charCodeAt(++r)&1023),e[t++]=i>>18|240,e[t++]=i>>12&63|128,e[t++]=i>>6&63|128,e[t++]=i&63|128):(e[t++]=i>>12|224,e[t++]=i>>6&63|128,e[t++]=i&63|128)}return e},Ku=function(n){const e=[];let t=0,r=0;for(;t<n.length;){const i=n[t++];if(i<128)e[r++]=String.fromCharCode(i);else if(i>191&&i<224){const a=n[t++];e[r++]=String.fromCharCode((i&31)<<6|a&63)}else if(i>239&&i<365){const a=n[t++],l=n[t++],h=n[t++],f=((i&7)<<18|(a&63)<<12|(l&63)<<6|h&63)-65536;e[r++]=String.fromCharCode(55296+(f>>10)),e[r++]=String.fromCharCode(56320+(f&1023))}else{const a=n[t++],l=n[t++];e[r++]=String.fromCharCode((i&15)<<12|(a&63)<<6|l&63)}}return e.join("")},Xo={byteToCharMap_:null,charToByteMap_:null,byteToCharMapWebSafe_:null,charToByteMapWebSafe_:null,ENCODED_VALS_BASE:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",get ENCODED_VALS(){return this.ENCODED_VALS_BASE+"+/="},get ENCODED_VALS_WEBSAFE(){return this.ENCODED_VALS_BASE+"-_."},HAS_NATIVE_SUPPORT:typeof atob=="function",encodeByteArray(n,e){if(!Array.isArray(n))throw Error("encodeByteArray takes an array as a parameter");this.init_();const t=e?this.byteToCharMapWebSafe_:this.byteToCharMap_,r=[];for(let i=0;i<n.length;i+=3){const a=n[i],l=i+1<n.length,h=l?n[i+1]:0,f=i+2<n.length,_=f?n[i+2]:0,b=a>>2,R=(a&3)<<4|h>>4;let V=(h&15)<<2|_>>6,x=_&63;f||(x=64,l||(V=64)),r.push(t[b],t[R],t[V],t[x])}return r.join("")},encodeString(n,e){return this.HAS_NATIVE_SUPPORT&&!e?btoa(n):this.encodeByteArray(Yo(n),e)},decodeString(n,e){return this.HAS_NATIVE_SUPPORT&&!e?atob(n):Ku(this.decodeStringToByteArray(n,e))},decodeStringToByteArray(n,e){this.init_();const t=e?this.charToByteMapWebSafe_:this.charToByteMap_,r=[];for(let i=0;i<n.length;){const a=t[n.charAt(i++)],h=i<n.length?t[n.charAt(i)]:0;++i;const _=i<n.length?t[n.charAt(i)]:64;++i;const R=i<n.length?t[n.charAt(i)]:64;if(++i,a==null||h==null||_==null||R==null)throw new Ju;const V=a<<2|h>>4;if(r.push(V),_!==64){const x=h<<4&240|_>>2;if(r.push(x),R!==64){const O=_<<6&192|R;r.push(O)}}}return r},init_(){if(!this.byteToCharMap_){this.byteToCharMap_={},this.charToByteMap_={},this.byteToCharMapWebSafe_={},this.charToByteMapWebSafe_={};for(let n=0;n<this.ENCODED_VALS.length;n++)this.byteToCharMap_[n]=this.ENCODED_VALS.charAt(n),this.charToByteMap_[this.byteToCharMap_[n]]=n,this.byteToCharMapWebSafe_[n]=this.ENCODED_VALS_WEBSAFE.charAt(n),this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[n]]=n,n>=this.ENCODED_VALS_BASE.length&&(this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(n)]=n,this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(n)]=n)}}};class Ju extends Error{constructor(){super(...arguments),this.name="DecodeBase64StringError"}}const Yu=function(n){const e=Yo(n);return Xo.encodeByteArray(e,!0)},ar=function(n){return Yu(n).replace(/\./g,"")},Qo=function(n){try{return Xo.decodeString(n,!0)}catch(e){console.error("base64Decode failed: ",e)}return null};/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Xu(){if(typeof self<"u")return self;if(typeof window<"u")return window;if(typeof global<"u")return global;throw new Error("Unable to locate global object.")}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Qu=()=>Xu().__FIREBASE_DEFAULTS__,Zu=()=>{if(typeof process>"u"||typeof to>"u")return;const n=to.__FIREBASE_DEFAULTS__;if(n)return JSON.parse(n)},el=()=>{if(typeof document>"u")return;let n;try{n=document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/)}catch{return}const e=n&&Qo(n[1]);return e&&JSON.parse(e)},As=()=>{try{return Gu()||Qu()||Zu()||el()}catch(n){console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${n}`);return}},Zo=n=>{var e,t;return(t=(e=As())==null?void 0:e.emulatorHosts)==null?void 0:t[n]},ea=n=>{const e=Zo(n);if(!e)return;const t=e.lastIndexOf(":");if(t<=0||t+1===e.length)throw new Error(`Invalid host ${e} with no separate hostname and port!`);const r=parseInt(e.substring(t+1),10);return e[0]==="["?[e.substring(1,t-1),r]:[e.substring(0,t),r]},ta=()=>{var n;return(n=As())==null?void 0:n.config},na=n=>{var e;return(e=As())==null?void 0:e[`_${n}`]};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class tl{constructor(){this.reject=()=>{},this.resolve=()=>{},this.promise=new Promise((e,t)=>{this.resolve=e,this.reject=t})}wrapCallback(e){return(t,r)=>{t?this.reject(t):this.resolve(r),typeof e=="function"&&(this.promise.catch(()=>{}),e.length===1?e(t):e(t,r))}}}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ra(n,e){if(n.uid)throw new Error('The "uid" field is no longer supported by mockUserToken. Please use "sub" instead for Firebase Auth User ID.');const t={alg:"none",type:"JWT"},r=e||"demo-project",i=n.iat||0,a=n.sub||n.user_id;if(!a)throw new Error("mockUserToken must contain 'sub' or 'user_id' field!");const l={iss:`https://securetoken.google.com/${r}`,aud:r,iat:i,exp:i+3600,auth_time:i,sub:a,user_id:a,firebase:{sign_in_provider:"custom",identities:{}},...n};return[ar(JSON.stringify(t)),ar(JSON.stringify(l)),""].join(".")}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ce(){return typeof navigator<"u"&&typeof navigator.userAgent=="string"?navigator.userAgent:""}function nl(){return typeof window<"u"&&!!(window.cordova||window.phonegap||window.PhoneGap)&&/ios|iphone|ipod|ipad|android|blackberry|iemobile/i.test(ce())}function rl(){return typeof navigator<"u"&&navigator.userAgent==="Cloudflare-Workers"}function sl(){const n=typeof chrome=="object"?chrome.runtime:typeof browser=="object"?browser.runtime:void 0;return typeof n=="object"&&n.id!==void 0}function il(){return typeof navigator=="object"&&navigator.product==="ReactNative"}function ol(){const n=ce();return n.indexOf("MSIE ")>=0||n.indexOf("Trident/")>=0}function al(){try{return typeof indexedDB=="object"}catch{return!1}}function ul(){return new Promise((n,e)=>{try{let t=!0;const r="validate-browser-context-for-indexeddb-analytics-module",i=self.indexedDB.open(r);i.onsuccess=()=>{i.result.close(),t||self.indexedDB.deleteDatabase(r),n(!0)},i.onupgradeneeded=()=>{t=!1},i.onerror=()=>{var a;e(((a=i.error)==null?void 0:a.message)||"")}}catch(t){e(t)}})}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ll="FirebaseError";class Fe extends Error{constructor(e,t,r){super(t),this.code=e,this.customData=r,this.name=ll,Object.setPrototypeOf(this,Fe.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,bn.prototype.create)}}class bn{constructor(e,t,r){this.service=e,this.serviceName=t,this.errors=r}create(e,...t){const r=t[0]||{},i=`${this.service}/${e}`,a=this.errors[e],l=a?cl(a,r):"Error",h=`${this.serviceName}: ${l} (${i}).`;return new Fe(i,h,r)}}function cl(n,e){return n.replace(hl,(t,r)=>{const i=e[r];return i!=null?String(i):`<${r}?>`})}const hl=/\{\$([^}]+)}/g;function fl(n){for(const e in n)if(Object.prototype.hasOwnProperty.call(n,e))return!1;return!0}function vt(n,e){if(n===e)return!0;const t=Object.keys(n),r=Object.keys(e);for(const i of t){if(!r.includes(i))return!1;const a=n[i],l=e[i];if(no(a)&&no(l)){if(!vt(a,l))return!1}else if(a!==l)return!1}for(const i of r)if(!t.includes(i))return!1;return!0}function no(n){return n!==null&&typeof n=="object"}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Rn(n){const e=[];for(const[t,r]of Object.entries(n))Array.isArray(r)?r.forEach(i=>{e.push(encodeURIComponent(t)+"="+encodeURIComponent(i))}):e.push(encodeURIComponent(t)+"="+encodeURIComponent(r));return e.length?"&"+e.join("&"):""}function dl(n,e){const t=new pl(n,e);return t.subscribe.bind(t)}class pl{constructor(e,t){this.observers=[],this.unsubscribes=[],this.observerCount=0,this.task=Promise.resolve(),this.finalized=!1,this.onNoObservers=t,this.task.then(()=>{e(this)}).catch(r=>{this.error(r)})}next(e){this.forEachObserver(t=>{t.next(e)})}error(e){this.forEachObserver(t=>{t.error(e)}),this.close(e)}complete(){this.forEachObserver(e=>{e.complete()}),this.close()}subscribe(e,t,r){let i;if(e===void 0&&t===void 0&&r===void 0)throw new Error("Missing Observer.");gl(e,["next","error","complete"])?i=e:i={next:e,error:t,complete:r},i.next===void 0&&(i.next=rs),i.error===void 0&&(i.error=rs),i.complete===void 0&&(i.complete=rs);const a=this.unsubscribeOne.bind(this,this.observers.length);return this.finalized&&this.task.then(()=>{try{this.finalError?i.error(this.finalError):i.complete()}catch{}}),this.observers.push(i),a}unsubscribeOne(e){this.observers===void 0||this.observers[e]===void 0||(delete this.observers[e],this.observerCount-=1,this.observerCount===0&&this.onNoObservers!==void 0&&this.onNoObservers(this))}forEachObserver(e){if(!this.finalized)for(let t=0;t<this.observers.length;t++)this.sendOne(t,e)}sendOne(e,t){this.task.then(()=>{if(this.observers!==void 0&&this.observers[e]!==void 0)try{t(this.observers[e])}catch(r){typeof console<"u"&&console.error&&console.error(r)}})}close(e){this.finalized||(this.finalized=!0,e!==void 0&&(this.finalError=e),this.task.then(()=>{this.observers=void 0,this.onNoObservers=void 0}))}}function gl(n,e){if(typeof n!="object"||n===null)return!1;for(const t of e)if(t in n&&typeof n[t]=="function")return!0;return!1}function rs(){}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Le(n){return n&&n._delegate?n._delegate:n}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Pn(n){try{return(n.startsWith("http://")||n.startsWith("https://")?new URL(n).hostname:n).endsWith(".cloudworkstations.dev")}catch{return!1}}async function bs(n){return(await fetch(n,{credentials:"include"})).ok}class ct{constructor(e,t,r){this.name=e,this.instanceFactory=t,this.type=r,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null}setInstantiationMode(e){return this.instantiationMode=e,this}setMultipleInstances(e){return this.multipleInstances=e,this}setServiceProps(e){return this.serviceProps=e,this}setInstanceCreatedCallback(e){return this.onInstanceCreated=e,this}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const _t="[DEFAULT]";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ml{constructor(e,t){this.name=e,this.container=t,this.component=null,this.instances=new Map,this.instancesDeferred=new Map,this.instancesOptions=new Map,this.onInitCallbacks=new Map}get(e){const t=this.normalizeInstanceIdentifier(e);if(!this.instancesDeferred.has(t)){const r=new tl;if(this.instancesDeferred.set(t,r),this.isInitialized(t)||this.shouldAutoInitialize())try{const i=this.getOrInitializeService({instanceIdentifier:t});i&&r.resolve(i)}catch{}}return this.instancesDeferred.get(t).promise}getImmediate(e){const t=this.normalizeInstanceIdentifier(e==null?void 0:e.identifier),r=(e==null?void 0:e.optional)??!1;if(this.isInitialized(t)||this.shouldAutoInitialize())try{return this.getOrInitializeService({instanceIdentifier:t})}catch(i){if(r)return null;throw i}else{if(r)return null;throw Error(`Service ${this.name} is not available`)}}getComponent(){return this.component}setComponent(e){if(e.name!==this.name)throw Error(`Mismatching Component ${e.name} for Provider ${this.name}.`);if(this.component)throw Error(`Component for ${this.name} has already been provided`);if(this.component=e,!!this.shouldAutoInitialize()){if(yl(e))try{this.getOrInitializeService({instanceIdentifier:_t})}catch{}for(const[t,r]of this.instancesDeferred.entries()){const i=this.normalizeInstanceIdentifier(t);try{const a=this.getOrInitializeService({instanceIdentifier:i});r.resolve(a)}catch{}}}}clearInstance(e=_t){this.instancesDeferred.delete(e),this.instancesOptions.delete(e),this.instances.delete(e)}async delete(){const e=Array.from(this.instances.values());await Promise.all([...e.filter(t=>"INTERNAL"in t).map(t=>t.INTERNAL.delete()),...e.filter(t=>"_delete"in t).map(t=>t._delete())])}isComponentSet(){return this.component!=null}isInitialized(e=_t){return this.instances.has(e)}getOptions(e=_t){return this.instancesOptions.get(e)||{}}initialize(e={}){const{options:t={}}=e,r=this.normalizeInstanceIdentifier(e.instanceIdentifier);if(this.isInitialized(r))throw Error(`${this.name}(${r}) has already been initialized`);if(!this.isComponentSet())throw Error(`Component ${this.name} has not been registered yet`);const i=this.getOrInitializeService({instanceIdentifier:r,options:t});for(const[a,l]of this.instancesDeferred.entries()){const h=this.normalizeInstanceIdentifier(a);r===h&&l.resolve(i)}return i}onInit(e,t){const r=this.normalizeInstanceIdentifier(t),i=this.onInitCallbacks.get(r)??new Set;i.add(e),this.onInitCallbacks.set(r,i);const a=this.instances.get(r);return a&&e(a,r),()=>{i.delete(e)}}invokeOnInitCallbacks(e,t){const r=this.onInitCallbacks.get(t);if(r)for(const i of r)try{i(e,t)}catch{}}getOrInitializeService({instanceIdentifier:e,options:t={}}){let r=this.instances.get(e);if(!r&&this.component&&(r=this.component.instanceFactory(this.container,{instanceIdentifier:_l(e),options:t}),this.instances.set(e,r),this.instancesOptions.set(e,t),this.invokeOnInitCallbacks(r,e),this.component.onInstanceCreated))try{this.component.onInstanceCreated(this.container,e,r)}catch{}return r||null}normalizeInstanceIdentifier(e=_t){return this.component?this.component.multipleInstances?e:_t:e}shouldAutoInitialize(){return!!this.component&&this.component.instantiationMode!=="EXPLICIT"}}function _l(n){return n===_t?void 0:n}function yl(n){return n.instantiationMode==="EAGER"}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class wl{constructor(e){this.name=e,this.providers=new Map}addComponent(e){const t=this.getProvider(e.name);if(t.isComponentSet())throw new Error(`Component ${e.name} has already been registered with ${this.name}`);t.setComponent(e)}addOrOverwriteComponent(e){this.getProvider(e.name).isComponentSet()&&this.providers.delete(e.name),this.addComponent(e)}getProvider(e){if(this.providers.has(e))return this.providers.get(e);const t=new ml(e,this);return this.providers.set(e,t),t}getProviders(){return Array.from(this.providers.values())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var j;(function(n){n[n.DEBUG=0]="DEBUG",n[n.VERBOSE=1]="VERBOSE",n[n.INFO=2]="INFO",n[n.WARN=3]="WARN",n[n.ERROR=4]="ERROR",n[n.SILENT=5]="SILENT"})(j||(j={}));const vl={debug:j.DEBUG,verbose:j.VERBOSE,info:j.INFO,warn:j.WARN,error:j.ERROR,silent:j.SILENT},Il=j.INFO,El={[j.DEBUG]:"log",[j.VERBOSE]:"log",[j.INFO]:"info",[j.WARN]:"warn",[j.ERROR]:"error"},Tl=(n,e,...t)=>{if(e<n.logLevel)return;const r=new Date().toISOString(),i=El[e];if(i)console[i](`[${r}]  ${n.name}:`,...t);else throw new Error(`Attempted to log a message with an invalid logType (value: ${e})`)};class Rs{constructor(e){this.name=e,this._logLevel=Il,this._logHandler=Tl,this._userLogHandler=null}get logLevel(){return this._logLevel}set logLevel(e){if(!(e in j))throw new TypeError(`Invalid value "${e}" assigned to \`logLevel\``);this._logLevel=e}setLogLevel(e){this._logLevel=typeof e=="string"?vl[e]:e}get logHandler(){return this._logHandler}set logHandler(e){if(typeof e!="function")throw new TypeError("Value assigned to `logHandler` must be a function");this._logHandler=e}get userLogHandler(){return this._userLogHandler}set userLogHandler(e){this._userLogHandler=e}debug(...e){this._userLogHandler&&this._userLogHandler(this,j.DEBUG,...e),this._logHandler(this,j.DEBUG,...e)}log(...e){this._userLogHandler&&this._userLogHandler(this,j.VERBOSE,...e),this._logHandler(this,j.VERBOSE,...e)}info(...e){this._userLogHandler&&this._userLogHandler(this,j.INFO,...e),this._logHandler(this,j.INFO,...e)}warn(...e){this._userLogHandler&&this._userLogHandler(this,j.WARN,...e),this._logHandler(this,j.WARN,...e)}error(...e){this._userLogHandler&&this._userLogHandler(this,j.ERROR,...e),this._logHandler(this,j.ERROR,...e)}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Al{constructor(e){this.container=e}getPlatformInfoString(){return this.container.getProviders().map(t=>{if(bl(t)){const r=t.getImmediate();return`${r.library}/${r.version}`}else return null}).filter(t=>t).join(" ")}}function bl(n){const e=n.getComponent();return(e==null?void 0:e.type)==="VERSION"}const fs="@firebase/app",ro="0.15.0";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const We=new Rs("@firebase/app"),Rl="@firebase/app-compat",Pl="@firebase/analytics-compat",Sl="@firebase/analytics",Vl="@firebase/app-check-compat",kl="@firebase/app-check",Nl="@firebase/auth",Cl="@firebase/auth-compat",xl="@firebase/database",Ol="@firebase/data-connect",Dl="@firebase/database-compat",Ll="@firebase/functions",Ul="@firebase/functions-compat",Ml="@firebase/installations",Fl="@firebase/installations-compat",Bl="@firebase/messaging",jl="@firebase/messaging-compat",$l="@firebase/performance",Hl="@firebase/performance-compat",ql="@firebase/remote-config",zl="@firebase/remote-config-compat",Wl="@firebase/storage",Gl="@firebase/storage-compat",Kl="@firebase/firestore",Jl="@firebase/ai",Yl="@firebase/firestore-compat",Xl="firebase",Ql="12.15.0";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ds="[DEFAULT]",Zl={[fs]:"fire-core",[Rl]:"fire-core-compat",[Sl]:"fire-analytics",[Pl]:"fire-analytics-compat",[kl]:"fire-app-check",[Vl]:"fire-app-check-compat",[Nl]:"fire-auth",[Cl]:"fire-auth-compat",[xl]:"fire-rtdb",[Ol]:"fire-data-connect",[Dl]:"fire-rtdb-compat",[Ll]:"fire-fn",[Ul]:"fire-fn-compat",[Ml]:"fire-iid",[Fl]:"fire-iid-compat",[Bl]:"fire-fcm",[jl]:"fire-fcm-compat",[$l]:"fire-perf",[Hl]:"fire-perf-compat",[ql]:"fire-rc",[zl]:"fire-rc-compat",[Wl]:"fire-gcs",[Gl]:"fire-gcs-compat",[Kl]:"fire-fst",[Yl]:"fire-fst-compat",[Jl]:"fire-vertex","fire-js":"fire-js",[Xl]:"fire-js-all"};/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const dn=new Map,ec=new Map,ps=new Map;function so(n,e){try{n.container.addComponent(e)}catch(t){We.debug(`Component ${e.name} failed to register with FirebaseApp ${n.name}`,t)}}function It(n){const e=n.name;if(ps.has(e))return We.debug(`There were multiple attempts to register component ${e}.`),!1;ps.set(e,n);for(const t of dn.values())so(t,n);for(const t of ec.values())so(t,n);return!0}function Pr(n,e){const t=n.container.getProvider("heartbeat").getImmediate({optional:!0});return t&&t.triggerHeartbeat(),n.container.getProvider(e)}function Ae(n){return n==null?!1:n.settings!==void 0}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const tc={"no-app":"No Firebase App '{$appName}' has been created - call initializeApp() first","bad-app-name":"Illegal App name: '{$appName}'","duplicate-app":"Firebase App named '{$appName}' already exists with different options or config","app-deleted":"Firebase App named '{$appName}' already deleted","server-app-deleted":"Firebase Server App has been deleted","no-options":"Need to provide options, when not being deployed to hosting via source.","invalid-app-argument":"firebase.{$appName}() takes either no argument or a Firebase App instance.","invalid-log-argument":"First argument to `onLog` must be null or a function.","idb-open":"Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.","idb-get":"Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.","idb-set":"Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.","idb-delete":"Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.","finalization-registry-not-supported":"FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.","invalid-server-app-environment":"FirebaseServerApp is not for use in browser environments."},ut=new bn("app","Firebase",tc);/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class nc{constructor(e,t,r){this._isDeleted=!1,this._options={...e},this._config={...t},this._name=t.name,this._automaticDataCollectionEnabled=t.automaticDataCollectionEnabled,this._container=r,this.container.addComponent(new ct("app",()=>this,"PUBLIC"))}get automaticDataCollectionEnabled(){return this.checkDestroyed(),this._automaticDataCollectionEnabled}set automaticDataCollectionEnabled(e){this.checkDestroyed(),this._automaticDataCollectionEnabled=e}get name(){return this.checkDestroyed(),this._name}get options(){return this.checkDestroyed(),this._options}get config(){return this.checkDestroyed(),this._config}get container(){return this._container}get isDeleted(){return this._isDeleted}set isDeleted(e){this._isDeleted=e}checkDestroyed(){if(this.isDeleted)throw ut.create("app-deleted",{appName:this._name})}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const At=Ql;function rc(n,e={}){let t=n;typeof e!="object"&&(e={name:e});const r={name:ds,automaticDataCollectionEnabled:!0,...e},i=r.name;if(typeof i!="string"||!i)throw ut.create("bad-app-name",{appName:String(i)});if(t||(t=ta()),!t)throw ut.create("no-options");const a=dn.get(i);if(a){if(vt(t,a.options)&&vt(r,a.config))return a;throw ut.create("duplicate-app",{appName:i})}const l=new wl(i);for(const f of ps.values())l.addComponent(f);const h=new nc(t,r,l);return dn.set(i,h),h}function Ps(n=ds){const e=dn.get(n);if(!e&&n===ds&&ta())return rc();if(!e)throw ut.create("no-app",{appName:n});return e}function Ng(){return Array.from(dn.values())}function xe(n,e,t){let r=Zl[n]??n;t&&(r+=`-${t}`);const i=r.match(/\s|\//),a=e.match(/\s|\//);if(i||a){const l=[`Unable to register library "${r}" with version "${e}":`];i&&l.push(`library name "${r}" contains illegal characters (whitespace or "/")`),i&&a&&l.push("and"),a&&l.push(`version name "${e}" contains illegal characters (whitespace or "/")`),We.warn(l.join(" "));return}It(new ct(`${r}-version`,()=>({library:r,version:e}),"VERSION"))}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const sc="firebase-heartbeat-database",ic=1,pn="firebase-heartbeat-store";let ss=null;function sa(){return ss||(ss=Wu(sc,ic,{upgrade:(n,e)=>{switch(e){case 0:try{n.createObjectStore(pn)}catch(t){console.warn(t)}}}}).catch(n=>{throw ut.create("idb-open",{originalErrorMessage:n.message})})),ss}async function oc(n){try{const t=(await sa()).transaction(pn),r=await t.objectStore(pn).get(ia(n));return await t.done,r}catch(e){if(e instanceof Fe)We.warn(e.message);else{const t=ut.create("idb-get",{originalErrorMessage:e==null?void 0:e.message});We.warn(t.message)}}}async function io(n,e){try{const r=(await sa()).transaction(pn,"readwrite");await r.objectStore(pn).put(e,ia(n)),await r.done}catch(t){if(t instanceof Fe)We.warn(t.message);else{const r=ut.create("idb-set",{originalErrorMessage:t==null?void 0:t.message});We.warn(r.message)}}}function ia(n){return`${n.name}!${n.options.appId}`}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ac=1024,uc=30;class lc{constructor(e){this.container=e,this._heartbeatsCache=null;const t=this.container.getProvider("app").getImmediate();this._storage=new hc(t),this._heartbeatsCachePromise=this._storage.read().then(r=>(this._heartbeatsCache=r,r))}async triggerHeartbeat(){var e,t;try{const i=this.container.getProvider("platform-logger").getImmediate().getPlatformInfoString(),a=oo();if(((e=this._heartbeatsCache)==null?void 0:e.heartbeats)==null&&(this._heartbeatsCache=await this._heartbeatsCachePromise,((t=this._heartbeatsCache)==null?void 0:t.heartbeats)==null)||this._heartbeatsCache.lastSentHeartbeatDate===a||this._heartbeatsCache.heartbeats.some(l=>l.date===a))return;if(this._heartbeatsCache.heartbeats.push({date:a,agent:i}),this._heartbeatsCache.heartbeats.length>uc){const l=fc(this._heartbeatsCache.heartbeats);this._heartbeatsCache.heartbeats.splice(l,1)}return this._storage.overwrite(this._heartbeatsCache)}catch(r){We.warn(r)}}async getHeartbeatsHeader(){var e;try{if(this._heartbeatsCache===null&&await this._heartbeatsCachePromise,((e=this._heartbeatsCache)==null?void 0:e.heartbeats)==null||this._heartbeatsCache.heartbeats.length===0)return"";const t=oo(),{heartbeatsToSend:r,unsentEntries:i}=cc(this._heartbeatsCache.heartbeats),a=ar(JSON.stringify({version:2,heartbeats:r}));return this._heartbeatsCache.lastSentHeartbeatDate=t,i.length>0?(this._heartbeatsCache.heartbeats=i,await this._storage.overwrite(this._heartbeatsCache)):(this._heartbeatsCache.heartbeats=[],this._storage.overwrite(this._heartbeatsCache)),a}catch(t){return We.warn(t),""}}}function oo(){return new Date().toISOString().substring(0,10)}function cc(n,e=ac){const t=[];let r=n.slice();for(const i of n){const a=t.find(l=>l.agent===i.agent);if(a){if(a.dates.push(i.date),ao(t)>e){a.dates.pop();break}}else if(t.push({agent:i.agent,dates:[i.date]}),ao(t)>e){t.pop();break}r=r.slice(1)}return{heartbeatsToSend:t,unsentEntries:r}}class hc{constructor(e){this.app=e,this._canUseIndexedDBPromise=this.runIndexedDBEnvironmentCheck()}async runIndexedDBEnvironmentCheck(){return al()?ul().then(()=>!0).catch(()=>!1):!1}async read(){if(await this._canUseIndexedDBPromise){const t=await oc(this.app);return t!=null&&t.heartbeats?t:{heartbeats:[]}}else return{heartbeats:[]}}async overwrite(e){if(await this._canUseIndexedDBPromise){const r=await this.read();return io(this.app,{lastSentHeartbeatDate:e.lastSentHeartbeatDate??r.lastSentHeartbeatDate,heartbeats:e.heartbeats})}else return}async add(e){if(await this._canUseIndexedDBPromise){const r=await this.read();return io(this.app,{lastSentHeartbeatDate:e.lastSentHeartbeatDate??r.lastSentHeartbeatDate,heartbeats:[...r.heartbeats,...e.heartbeats]})}else return}}function ao(n){return ar(JSON.stringify({version:2,heartbeats:n})).length}function fc(n){if(n.length===0)return-1;let e=0,t=n[0].date;for(let r=1;r<n.length;r++)n[r].date<t&&(t=n[r].date,e=r);return e}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function dc(n){It(new ct("platform-logger",e=>new Al(e),"PRIVATE")),It(new ct("heartbeat",e=>new lc(e),"PRIVATE")),xe(fs,ro,n),xe(fs,ro,"esm2020"),xe("fire-js","")}dc("");var pc="firebase",gc="12.15.0";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */xe(pc,gc,"app");function oa(){return{"dependent-sdk-initialized-before-auth":"Another Firebase SDK was initialized and is trying to use Auth before Auth is initialized. Please be sure to call `initializeAuth` or `getAuth` before starting any other Firebase SDK."}}const mc=oa,aa=new bn("auth","Firebase",oa());/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ur=new Rs("@firebase/auth");function _c(n,...e){ur.logLevel<=j.WARN&&ur.warn(`Auth (${At}): ${n}`,...e)}function nr(n,...e){ur.logLevel<=j.ERROR&&ur.error(`Auth (${At}): ${n}`,...e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ge(n,...e){throw Ss(n,...e)}function Oe(n,...e){return Ss(n,...e)}function ua(n,e,t){const r={...mc(),[e]:t};return new bn("auth","Firebase",r).create(e,{appName:n.name})}function wt(n){return ua(n,"operation-not-supported-in-this-environment","Operations that alter the current user are not supported in conjunction with FirebaseServerApp")}function Ss(n,...e){if(typeof n!="string"){const t=e[0],r=[...e.slice(1)];return r[0]&&(r[0].appName=n.name),n._errorFactory.create(t,...r)}return aa.create(n,...e)}function N(n,e,...t){if(!n)throw Ss(e,...t)}function He(n){const e="INTERNAL ASSERTION FAILED: "+n;throw nr(e),new Error(e)}function Ke(n,e){n||He(e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function gs(){var n;return typeof self<"u"&&((n=self.location)==null?void 0:n.href)||""}function yc(){return uo()==="http:"||uo()==="https:"}function uo(){var n;return typeof self<"u"&&((n=self.location)==null?void 0:n.protocol)||null}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function wc(){return typeof navigator<"u"&&navigator&&"onLine"in navigator&&typeof navigator.onLine=="boolean"&&(yc()||sl()||"connection"in navigator)?navigator.onLine:!0}function vc(){if(typeof navigator>"u")return null;const n=navigator;return n.languages&&n.languages[0]||n.language||null}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Sn{constructor(e,t){this.shortDelay=e,this.longDelay=t,Ke(t>e,"Short delay should be less than long delay!"),this.isMobile=nl()||il()}get(){return wc()?this.isMobile?this.longDelay:this.shortDelay:Math.min(5e3,this.shortDelay)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Vs(n,e){Ke(n.emulator,"Emulator should always be set here");const{url:t}=n.emulator;return e?`${t}${e.startsWith("/")?e.slice(1):e}`:t}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class la{static initialize(e,t,r){this.fetchImpl=e,t&&(this.headersImpl=t),r&&(this.responseImpl=r)}static fetch(){if(this.fetchImpl)return this.fetchImpl;if(typeof self<"u"&&"fetch"in self)return self.fetch;if(typeof globalThis<"u"&&globalThis.fetch)return globalThis.fetch;if(typeof fetch<"u")return fetch;He("Could not find fetch implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}static headers(){if(this.headersImpl)return this.headersImpl;if(typeof self<"u"&&"Headers"in self)return self.Headers;if(typeof globalThis<"u"&&globalThis.Headers)return globalThis.Headers;if(typeof Headers<"u")return Headers;He("Could not find Headers implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}static response(){if(this.responseImpl)return this.responseImpl;if(typeof self<"u"&&"Response"in self)return self.Response;if(typeof globalThis<"u"&&globalThis.Response)return globalThis.Response;if(typeof Response<"u")return Response;He("Could not find Response implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ic={CREDENTIAL_MISMATCH:"custom-token-mismatch",MISSING_CUSTOM_TOKEN:"internal-error",INVALID_IDENTIFIER:"invalid-email",MISSING_CONTINUE_URI:"internal-error",INVALID_PASSWORD:"wrong-password",MISSING_PASSWORD:"missing-password",INVALID_LOGIN_CREDENTIALS:"invalid-credential",EMAIL_EXISTS:"email-already-in-use",PASSWORD_LOGIN_DISABLED:"operation-not-allowed",INVALID_IDP_RESPONSE:"invalid-credential",INVALID_PENDING_TOKEN:"invalid-credential",FEDERATED_USER_ID_ALREADY_LINKED:"credential-already-in-use",MISSING_REQ_TYPE:"internal-error",EMAIL_NOT_FOUND:"user-not-found",RESET_PASSWORD_EXCEED_LIMIT:"too-many-requests",EXPIRED_OOB_CODE:"expired-action-code",INVALID_OOB_CODE:"invalid-action-code",MISSING_OOB_CODE:"internal-error",CREDENTIAL_TOO_OLD_LOGIN_AGAIN:"requires-recent-login",INVALID_ID_TOKEN:"invalid-user-token",TOKEN_EXPIRED:"user-token-expired",USER_NOT_FOUND:"user-token-expired",TOO_MANY_ATTEMPTS_TRY_LATER:"too-many-requests",PASSWORD_DOES_NOT_MEET_REQUIREMENTS:"password-does-not-meet-requirements",INVALID_CODE:"invalid-verification-code",INVALID_SESSION_INFO:"invalid-verification-id",INVALID_TEMPORARY_PROOF:"invalid-credential",MISSING_SESSION_INFO:"missing-verification-id",SESSION_EXPIRED:"code-expired",MISSING_ANDROID_PACKAGE_NAME:"missing-android-pkg-name",UNAUTHORIZED_DOMAIN:"unauthorized-continue-uri",INVALID_OAUTH_CLIENT_ID:"invalid-oauth-client-id",ADMIN_ONLY_OPERATION:"admin-restricted-operation",INVALID_MFA_PENDING_CREDENTIAL:"invalid-multi-factor-session",MFA_ENROLLMENT_NOT_FOUND:"multi-factor-info-not-found",MISSING_MFA_ENROLLMENT_ID:"missing-multi-factor-info",MISSING_MFA_PENDING_CREDENTIAL:"missing-multi-factor-session",SECOND_FACTOR_EXISTS:"second-factor-already-in-use",SECOND_FACTOR_LIMIT_EXCEEDED:"maximum-second-factor-count-exceeded",BLOCKING_FUNCTION_ERROR_RESPONSE:"internal-error",RECAPTCHA_NOT_ENABLED:"recaptcha-not-enabled",MISSING_RECAPTCHA_TOKEN:"missing-recaptcha-token",INVALID_RECAPTCHA_TOKEN:"invalid-recaptcha-token",INVALID_RECAPTCHA_ACTION:"invalid-recaptcha-action",MISSING_CLIENT_TYPE:"missing-client-type",MISSING_RECAPTCHA_VERSION:"missing-recaptcha-version",INVALID_RECAPTCHA_VERSION:"invalid-recaptcha-version",INVALID_REQ_TYPE:"invalid-req-type"};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ec=["/v1/accounts:signInWithCustomToken","/v1/accounts:signInWithEmailLink","/v1/accounts:signInWithIdp","/v1/accounts:signInWithPassword","/v1/accounts:signInWithPhoneNumber","/v1/token"],Tc=new Sn(3e4,6e4);function ks(n,e){return n.tenantId&&!e.tenantId?{...e,tenantId:n.tenantId}:e}async function jt(n,e,t,r,i={}){return ca(n,i,async()=>{let a={},l={};r&&(e==="GET"?l=r:a={body:JSON.stringify(r)});const h=Rn({...l,key:n.config.apiKey}).slice(1),f=await n._getAdditionalHeaders();f["Content-Type"]="application/json",n.languageCode&&(f["X-Firebase-Locale"]=n.languageCode);const _={method:e,headers:f,...a};return rl()||(_.referrerPolicy="strict-origin-when-cross-origin"),n.emulatorConfig&&Pn(n.emulatorConfig.host)&&(_.credentials="include"),la.fetch()(await ha(n,n.config.apiHost,t,h),_)})}async function ca(n,e,t){n._canInitEmulator=!1;const r={...Ic,...e};try{const i=new bc(n),a=await Promise.race([t(),i.promise]);i.clearNetworkTimeout();const l=await a.json();if("needConfirmation"in l)throw Yn(n,"account-exists-with-different-credential",l);if(a.ok&&!("errorMessage"in l))return l;{const h=a.ok?l.errorMessage:l.error.message,[f,_]=h.split(" : ");if(f==="FEDERATED_USER_ID_ALREADY_LINKED")throw Yn(n,"credential-already-in-use",l);if(f==="EMAIL_EXISTS")throw Yn(n,"email-already-in-use",l);if(f==="USER_DISABLED")throw Yn(n,"user-disabled",l);const b=r[f]||f.toLowerCase().replace(/[_\s]+/g,"-");if(_)throw ua(n,b,_);Ge(n,b)}}catch(i){if(i instanceof Fe)throw i;Ge(n,"network-request-failed",{message:String(i)})}}async function Ac(n,e,t,r,i={}){const a=await jt(n,e,t,r,i);return"mfaPendingCredential"in a&&Ge(n,"multi-factor-auth-required",{_serverResponse:a}),a}async function ha(n,e,t,r){const i=`${e}${t}?${r}`,a=n,l=a.config.emulator?Vs(n.config,i):`${n.config.apiScheme}://${i}`;return Ec.includes(t)&&(await a._persistenceManagerAvailable,a._getPersistenceType()==="COOKIE")?a._getPersistence()._getFinalTarget(l).toString():l}class bc{clearNetworkTimeout(){clearTimeout(this.timer)}constructor(e){this.auth=e,this.timer=null,this.promise=new Promise((t,r)=>{this.timer=setTimeout(()=>r(Oe(this.auth,"network-request-failed")),Tc.get())})}}function Yn(n,e,t){const r={appName:n.name};t.email&&(r.email=t.email),t.phoneNumber&&(r.phoneNumber=t.phoneNumber);const i=Oe(n,e,r);return i.customData._tokenResponse=t,i}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Rc(n,e){return jt(n,"POST","/v1/accounts:delete",e)}async function lr(n,e){return jt(n,"POST","/v1/accounts:lookup",e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function un(n){if(n)try{const e=new Date(Number(n));if(!isNaN(e.getTime()))return e.toUTCString()}catch{}}async function Pc(n,e=!1){const t=Le(n),r=await t.getIdToken(e),i=Ns(r);N(i&&i.exp&&i.auth_time&&i.iat,t.auth,"internal-error");const a=typeof i.firebase=="object"?i.firebase:void 0,l=a==null?void 0:a.sign_in_provider;return{claims:i,token:r,authTime:un(is(i.auth_time)),issuedAtTime:un(is(i.iat)),expirationTime:un(is(i.exp)),signInProvider:l||null,signInSecondFactor:(a==null?void 0:a.sign_in_second_factor)||null}}function is(n){return Number(n)*1e3}function Ns(n){const[e,t,r]=n.split(".");if(e===void 0||t===void 0||r===void 0)return nr("JWT malformed, contained fewer than 3 sections"),null;try{const i=Qo(t);return i?JSON.parse(i):(nr("Failed to decode base64 JWT payload"),null)}catch(i){return nr("Caught error parsing JWT payload as JSON",i==null?void 0:i.toString()),null}}function lo(n){const e=Ns(n);return N(e,"internal-error"),N(typeof e.exp<"u","internal-error"),N(typeof e.iat<"u","internal-error"),Number(e.exp)-Number(e.iat)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function gn(n,e,t=!1){if(t)return e;try{return await e}catch(r){throw r instanceof Fe&&Sc(r)&&n.auth.currentUser===n&&await n.auth.signOut(),r}}function Sc({code:n}){return n==="auth/user-disabled"||n==="auth/user-token-expired"}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Vc{constructor(e){this.user=e,this.isRunning=!1,this.timerId=null,this.errorBackoff=3e4}_start(){this.isRunning||(this.isRunning=!0,this.schedule())}_stop(){this.isRunning&&(this.isRunning=!1,this.timerId!==null&&clearTimeout(this.timerId))}getInterval(e){if(e){const t=this.errorBackoff;return this.errorBackoff=Math.min(this.errorBackoff*2,96e4),t}else{this.errorBackoff=3e4;const r=(this.user.stsTokenManager.expirationTime??0)-Date.now()-3e5;return Math.max(0,r)}}schedule(e=!1){if(!this.isRunning)return;const t=this.getInterval(e);this.timerId=setTimeout(async()=>{await this.iteration()},t)}async iteration(){try{await this.user.getIdToken(!0)}catch(e){(e==null?void 0:e.code)==="auth/network-request-failed"&&this.schedule(!0);return}this.schedule()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ms{constructor(e,t){this.createdAt=e,this.lastLoginAt=t,this._initializeTime()}_initializeTime(){this.lastSignInTime=un(this.lastLoginAt),this.creationTime=un(this.createdAt)}_copy(e){this.createdAt=e.createdAt,this.lastLoginAt=e.lastLoginAt,this._initializeTime()}toJSON(){return{createdAt:this.createdAt,lastLoginAt:this.lastLoginAt}}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function cr(n){var R;const e=n.auth,t=await n.getIdToken(),r=await gn(n,lr(e,{idToken:t}));N(r==null?void 0:r.users.length,e,"internal-error");const i=r.users[0];n._notifyReloadListener(i);const a=(R=i.providerUserInfo)!=null&&R.length?fa(i.providerUserInfo):[],l=Nc(n.providerData,a),h=n.isAnonymous,f=!(n.email&&i.passwordHash)&&!(l!=null&&l.length),_=h?f:!1,b={uid:i.localId,displayName:i.displayName||null,photoURL:i.photoUrl||null,email:i.email||null,emailVerified:i.emailVerified||!1,phoneNumber:i.phoneNumber||null,tenantId:i.tenantId||null,providerData:l,metadata:new ms(i.createdAt,i.lastLoginAt),isAnonymous:_};Object.assign(n,b)}async function kc(n){const e=Le(n);await cr(e),await e.auth._persistUserIfCurrent(e),e.auth._notifyListenersIfCurrent(e)}function Nc(n,e){return[...n.filter(r=>!e.some(i=>i.providerId===r.providerId)),...e]}function fa(n){return n.map(({providerId:e,...t})=>({providerId:e,uid:t.rawId||"",displayName:t.displayName||null,email:t.email||null,phoneNumber:t.phoneNumber||null,photoURL:t.photoUrl||null}))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Cc(n,e){const t=await ca(n,{},async()=>{const r=Rn({grant_type:"refresh_token",refresh_token:e}).slice(1),{tokenApiHost:i,apiKey:a}=n.config,l=await ha(n,i,"/v1/token",`key=${a}`),h=await n._getAdditionalHeaders();h["Content-Type"]="application/x-www-form-urlencoded";const f={method:"POST",headers:h,body:r};return n.emulatorConfig&&Pn(n.emulatorConfig.host)&&(f.credentials="include"),la.fetch()(l,f)});return{accessToken:t.access_token,expiresIn:t.expires_in,refreshToken:t.refresh_token}}async function xc(n,e){return jt(n,"POST","/v2/accounts:revokeToken",ks(n,e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ct{constructor(){this.refreshToken=null,this.accessToken=null,this.expirationTime=null}get isExpired(){return!this.expirationTime||Date.now()>this.expirationTime-3e4}updateFromServerResponse(e){N(e.idToken,"internal-error"),N(typeof e.idToken<"u","internal-error"),N(typeof e.refreshToken<"u","internal-error");const t="expiresIn"in e&&typeof e.expiresIn<"u"?Number(e.expiresIn):lo(e.idToken);this.updateTokensAndExpiration(e.idToken,e.refreshToken,t)}updateFromIdToken(e){N(e.length!==0,"internal-error");const t=lo(e);this.updateTokensAndExpiration(e,null,t)}async getToken(e,t=!1){return!t&&this.accessToken&&!this.isExpired?this.accessToken:(N(this.refreshToken,e,"user-token-expired"),this.refreshToken?(await this.refresh(e,this.refreshToken),this.accessToken):null)}clearRefreshToken(){this.refreshToken=null}async refresh(e,t){const{accessToken:r,refreshToken:i,expiresIn:a}=await Cc(e,t);this.updateTokensAndExpiration(r,i,Number(a))}updateTokensAndExpiration(e,t,r){this.refreshToken=t||null,this.accessToken=e||null,this.expirationTime=Date.now()+r*1e3}static fromJSON(e,t){const{refreshToken:r,accessToken:i,expirationTime:a}=t,l=new Ct;return r&&(N(typeof r=="string","internal-error",{appName:e}),l.refreshToken=r),i&&(N(typeof i=="string","internal-error",{appName:e}),l.accessToken=i),a&&(N(typeof a=="number","internal-error",{appName:e}),l.expirationTime=a),l}toJSON(){return{refreshToken:this.refreshToken,accessToken:this.accessToken,expirationTime:this.expirationTime}}_assign(e){this.accessToken=e.accessToken,this.refreshToken=e.refreshToken,this.expirationTime=e.expirationTime}_clone(){return Object.assign(new Ct,this.toJSON())}_performRefresh(){return He("not implemented")}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function nt(n,e){N(typeof n=="string"||typeof n>"u","internal-error",{appName:e})}class Re{constructor({uid:e,auth:t,stsTokenManager:r,...i}){this.providerId="firebase",this.proactiveRefresh=new Vc(this),this.reloadUserInfo=null,this.reloadListener=null,this.uid=e,this.auth=t,this.stsTokenManager=r,this.accessToken=r.accessToken,this.displayName=i.displayName||null,this.email=i.email||null,this.emailVerified=i.emailVerified||!1,this.phoneNumber=i.phoneNumber||null,this.photoURL=i.photoURL||null,this.isAnonymous=i.isAnonymous||!1,this.tenantId=i.tenantId||null,this.providerData=i.providerData?[...i.providerData]:[],this.metadata=new ms(i.createdAt||void 0,i.lastLoginAt||void 0)}async getIdToken(e){const t=await gn(this,this.stsTokenManager.getToken(this.auth,e));return N(t,this.auth,"internal-error"),this.accessToken!==t&&(this.accessToken=t,await this.auth._persistUserIfCurrent(this),this.auth._notifyListenersIfCurrent(this)),t}getIdTokenResult(e){return Pc(this,e)}reload(){return kc(this)}_assign(e){this!==e&&(N(this.uid===e.uid,this.auth,"internal-error"),this.displayName=e.displayName,this.photoURL=e.photoURL,this.email=e.email,this.emailVerified=e.emailVerified,this.phoneNumber=e.phoneNumber,this.isAnonymous=e.isAnonymous,this.tenantId=e.tenantId,this.providerData=e.providerData.map(t=>({...t})),this.metadata._copy(e.metadata),this.stsTokenManager._assign(e.stsTokenManager))}_clone(e){const t=new Re({...this,auth:e,stsTokenManager:this.stsTokenManager._clone()});return t.metadata._copy(this.metadata),t}_onReload(e){N(!this.reloadListener,this.auth,"internal-error"),this.reloadListener=e,this.reloadUserInfo&&(this._notifyReloadListener(this.reloadUserInfo),this.reloadUserInfo=null)}_notifyReloadListener(e){this.reloadListener?this.reloadListener(e):this.reloadUserInfo=e}_startProactiveRefresh(){this.proactiveRefresh._start()}_stopProactiveRefresh(){this.proactiveRefresh._stop()}async _updateTokensIfNecessary(e,t=!1){let r=!1;e.idToken&&e.idToken!==this.stsTokenManager.accessToken&&(this.stsTokenManager.updateFromServerResponse(e),r=!0),t&&await cr(this),await this.auth._persistUserIfCurrent(this),r&&this.auth._notifyListenersIfCurrent(this)}async delete(){if(Ae(this.auth.app))return Promise.reject(wt(this.auth));const e=await this.getIdToken();return await gn(this,Rc(this.auth,{idToken:e})),this.stsTokenManager.clearRefreshToken(),this.auth.signOut()}toJSON(){return{uid:this.uid,email:this.email||void 0,emailVerified:this.emailVerified,displayName:this.displayName||void 0,isAnonymous:this.isAnonymous,photoURL:this.photoURL||void 0,phoneNumber:this.phoneNumber||void 0,tenantId:this.tenantId||void 0,providerData:this.providerData.map(e=>({...e})),stsTokenManager:this.stsTokenManager.toJSON(),_redirectEventId:this._redirectEventId,...this.metadata.toJSON(),apiKey:this.auth.config.apiKey,appName:this.auth.name}}get refreshToken(){return this.stsTokenManager.refreshToken||""}static _fromJSON(e,t){const r=t.displayName??void 0,i=t.email??void 0,a=t.phoneNumber??void 0,l=t.photoURL??void 0,h=t.tenantId??void 0,f=t._redirectEventId??void 0,_=t.createdAt??void 0,b=t.lastLoginAt??void 0,{uid:R,emailVerified:V,isAnonymous:x,providerData:O,stsTokenManager:B}=t;N(R&&B,e,"internal-error");const D=Ct.fromJSON(this.name,B);N(typeof R=="string",e,"internal-error"),nt(r,e.name),nt(i,e.name),N(typeof V=="boolean",e,"internal-error"),N(typeof x=="boolean",e,"internal-error"),nt(a,e.name),nt(l,e.name),nt(h,e.name),nt(f,e.name),nt(_,e.name),nt(b,e.name);const J=new Re({uid:R,auth:e,email:i,emailVerified:V,displayName:r,isAnonymous:x,photoURL:l,phoneNumber:a,tenantId:h,stsTokenManager:D,createdAt:_,lastLoginAt:b});return O&&Array.isArray(O)&&(J.providerData=O.map(ye=>({...ye}))),f&&(J._redirectEventId=f),J}static async _fromIdTokenResponse(e,t,r=!1){const i=new Ct;i.updateFromServerResponse(t);const a=new Re({uid:t.localId,auth:e,stsTokenManager:i,isAnonymous:r});return await cr(a),a}static async _fromGetAccountInfoResponse(e,t,r){const i=t.users[0];N(i.localId!==void 0,"internal-error");const a=i.providerUserInfo!==void 0?fa(i.providerUserInfo):[],l=!(i.email&&i.passwordHash)&&!(a!=null&&a.length),h=new Ct;h.updateFromIdToken(r);const f=new Re({uid:i.localId,auth:e,stsTokenManager:h,isAnonymous:l}),_={uid:i.localId,displayName:i.displayName||null,photoURL:i.photoUrl||null,email:i.email||null,emailVerified:i.emailVerified||!1,phoneNumber:i.phoneNumber||null,tenantId:i.tenantId||null,providerData:a,metadata:new ms(i.createdAt,i.lastLoginAt),isAnonymous:!(i.email&&i.passwordHash)&&!(a!=null&&a.length)};return Object.assign(f,_),f}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const co=new Map;function qe(n){Ke(n instanceof Function,"Expected a class definition");let e=co.get(n);return e?(Ke(e instanceof n,"Instance stored in cache mismatched with class"),e):(e=new n,co.set(n,e),e)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class da{constructor(){this.type="NONE",this.storage={}}async _isAvailable(){return!0}async _set(e,t){this.storage[e]=t}async _get(e){const t=this.storage[e];return t===void 0?null:t}async _remove(e){delete this.storage[e]}_addListener(e,t){}_removeListener(e,t){}}da.type="NONE";const ho=da;/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function rr(n,e,t){return`firebase:${n}:${e}:${t}`}class xt{constructor(e,t,r){this.persistence=e,this.auth=t,this.userKey=r;const{config:i,name:a}=this.auth;this.fullUserKey=rr(this.userKey,i.apiKey,a),this.fullPersistenceKey=rr("persistence",i.apiKey,a),this.boundEventHandler=t._onStorageEvent.bind(t),this.persistence._addListener(this.fullUserKey,this.boundEventHandler)}setCurrentUser(e){return this.persistence._set(this.fullUserKey,e.toJSON())}async getCurrentUser(){const e=await this.persistence._get(this.fullUserKey);if(!e)return null;if(typeof e=="string"){const t=await lr(this.auth,{idToken:e}).catch(()=>{});return t?Re._fromGetAccountInfoResponse(this.auth,t,e):null}return Re._fromJSON(this.auth,e)}removeCurrentUser(){return this.persistence._remove(this.fullUserKey)}savePersistenceForRedirect(){return this.persistence._set(this.fullPersistenceKey,this.persistence.type)}async setPersistence(e){if(this.persistence===e)return;const t=await this.getCurrentUser();if(await this.removeCurrentUser(),this.persistence=e,t)return this.setCurrentUser(t)}delete(){this.persistence._removeListener(this.fullUserKey,this.boundEventHandler)}static async create(e,t,r="authUser"){if(!t.length)return new xt(qe(ho),e,r);const i=(await Promise.all(t.map(async _=>{if(await _._isAvailable())return _}))).filter(_=>_);let a=i[0]||qe(ho);const l=rr(r,e.config.apiKey,e.name);let h=null;for(const _ of t)try{const b=await _._get(l);if(b){let R;if(typeof b=="string"){const V=await lr(e,{idToken:b}).catch(()=>{});if(!V)break;R=await Re._fromGetAccountInfoResponse(e,V,b)}else R=Re._fromJSON(e,b);_!==a&&(h=R),a=_;break}}catch{}const f=i.filter(_=>_._shouldAllowMigration);return!a._shouldAllowMigration||!f.length?new xt(a,e,r):(a=f[0],h&&await a._set(l,h.toJSON()),await Promise.all(t.map(async _=>{if(_!==a)try{await _._remove(l)}catch{}})),new xt(a,e,r))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function fo(n){const e=n.toLowerCase();if(e.includes("opera/")||e.includes("opr/")||e.includes("opios/"))return"Opera";if(_a(e))return"IEMobile";if(e.includes("msie")||e.includes("trident/"))return"IE";if(e.includes("edge/"))return"Edge";if(pa(e))return"Firefox";if(e.includes("silk/"))return"Silk";if(wa(e))return"Blackberry";if(va(e))return"Webos";if(ga(e))return"Safari";if((e.includes("chrome/")||ma(e))&&!e.includes("edge/"))return"Chrome";if(ya(e))return"Android";{const t=/([a-zA-Z\d\.]+)\/[a-zA-Z\d\.]*$/,r=n.match(t);if((r==null?void 0:r.length)===2)return r[1]}return"Other"}function pa(n=ce()){return/firefox\//i.test(n)}function ga(n=ce()){const e=n.toLowerCase();return e.includes("safari/")&&!e.includes("chrome/")&&!e.includes("crios/")&&!e.includes("android")}function ma(n=ce()){return/crios\//i.test(n)}function _a(n=ce()){return/iemobile/i.test(n)}function ya(n=ce()){return/android/i.test(n)}function wa(n=ce()){return/blackberry/i.test(n)}function va(n=ce()){return/webos/i.test(n)}function Cs(n=ce()){return/iphone|ipad|ipod/i.test(n)||/macintosh/i.test(n)&&/mobile/i.test(n)}function Oc(n=ce()){var e;return Cs(n)&&!!((e=window.navigator)!=null&&e.standalone)}function Dc(){return ol()&&document.documentMode===10}function Ia(n=ce()){return Cs(n)||ya(n)||va(n)||wa(n)||/windows phone/i.test(n)||_a(n)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ea(n,e=[]){let t;switch(n){case"Browser":t=fo(ce());break;case"Worker":t=`${fo(ce())}-${n}`;break;default:t=n}const r=e.length?e.join(","):"FirebaseCore-web";return`${t}/JsCore/${At}/${r}`}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Lc{constructor(e){this.auth=e,this.queue=[]}pushCallback(e,t){const r=a=>new Promise((l,h)=>{try{const f=e(a);l(f)}catch(f){h(f)}});r.onAbort=t,this.queue.push(r);const i=this.queue.length-1;return()=>{this.queue[i]=()=>Promise.resolve()}}async runMiddleware(e){if(this.auth.currentUser===e)return;const t=[];try{for(const r of this.queue)await r(e),r.onAbort&&t.push(r.onAbort)}catch(r){t.reverse();for(const i of t)try{i()}catch{}throw this.auth._errorFactory.create("login-blocked",{originalMessage:r==null?void 0:r.message})}}}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Uc(n,e={}){return jt(n,"GET","/v2/passwordPolicy",ks(n,e))}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Mc=6;class Fc{constructor(e){var r;const t=e.customStrengthOptions;this.customStrengthOptions={},this.customStrengthOptions.minPasswordLength=t.minPasswordLength??Mc,t.maxPasswordLength&&(this.customStrengthOptions.maxPasswordLength=t.maxPasswordLength),t.containsLowercaseCharacter!==void 0&&(this.customStrengthOptions.containsLowercaseLetter=t.containsLowercaseCharacter),t.containsUppercaseCharacter!==void 0&&(this.customStrengthOptions.containsUppercaseLetter=t.containsUppercaseCharacter),t.containsNumericCharacter!==void 0&&(this.customStrengthOptions.containsNumericCharacter=t.containsNumericCharacter),t.containsNonAlphanumericCharacter!==void 0&&(this.customStrengthOptions.containsNonAlphanumericCharacter=t.containsNonAlphanumericCharacter),this.enforcementState=e.enforcementState,this.enforcementState==="ENFORCEMENT_STATE_UNSPECIFIED"&&(this.enforcementState="OFF"),this.allowedNonAlphanumericCharacters=((r=e.allowedNonAlphanumericCharacters)==null?void 0:r.join(""))??"",this.forceUpgradeOnSignin=e.forceUpgradeOnSignin??!1,this.schemaVersion=e.schemaVersion}validatePassword(e){const t={isValid:!0,passwordPolicy:this};return this.validatePasswordLengthOptions(e,t),this.validatePasswordCharacterOptions(e,t),t.isValid&&(t.isValid=t.meetsMinPasswordLength??!0),t.isValid&&(t.isValid=t.meetsMaxPasswordLength??!0),t.isValid&&(t.isValid=t.containsLowercaseLetter??!0),t.isValid&&(t.isValid=t.containsUppercaseLetter??!0),t.isValid&&(t.isValid=t.containsNumericCharacter??!0),t.isValid&&(t.isValid=t.containsNonAlphanumericCharacter??!0),t}validatePasswordLengthOptions(e,t){const r=this.customStrengthOptions.minPasswordLength,i=this.customStrengthOptions.maxPasswordLength;r&&(t.meetsMinPasswordLength=e.length>=r),i&&(t.meetsMaxPasswordLength=e.length<=i)}validatePasswordCharacterOptions(e,t){this.updatePasswordCharacterOptionsStatuses(t,!1,!1,!1,!1);let r;for(let i=0;i<e.length;i++)r=e.charAt(i),this.updatePasswordCharacterOptionsStatuses(t,r>="a"&&r<="z",r>="A"&&r<="Z",r>="0"&&r<="9",this.allowedNonAlphanumericCharacters.includes(r))}updatePasswordCharacterOptionsStatuses(e,t,r,i,a){this.customStrengthOptions.containsLowercaseLetter&&(e.containsLowercaseLetter||(e.containsLowercaseLetter=t)),this.customStrengthOptions.containsUppercaseLetter&&(e.containsUppercaseLetter||(e.containsUppercaseLetter=r)),this.customStrengthOptions.containsNumericCharacter&&(e.containsNumericCharacter||(e.containsNumericCharacter=i)),this.customStrengthOptions.containsNonAlphanumericCharacter&&(e.containsNonAlphanumericCharacter||(e.containsNonAlphanumericCharacter=a))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Bc{constructor(e,t,r,i){this.app=e,this.heartbeatServiceProvider=t,this.appCheckServiceProvider=r,this.config=i,this.currentUser=null,this.emulatorConfig=null,this.operations=Promise.resolve(),this.authStateSubscription=new po(this),this.idTokenSubscription=new po(this),this.beforeStateQueue=new Lc(this),this.redirectUser=null,this.isProactiveRefreshEnabled=!1,this.EXPECTED_PASSWORD_POLICY_SCHEMA_VERSION=1,this._canInitEmulator=!0,this._isInitialized=!1,this._deleted=!1,this._initializationPromise=null,this._popupRedirectResolver=null,this._errorFactory=aa,this._agentRecaptchaConfig=null,this._tenantRecaptchaConfigs={},this._projectPasswordPolicy=null,this._tenantPasswordPolicies={},this._resolvePersistenceManagerAvailable=void 0,this.lastNotifiedUid=void 0,this.languageCode=null,this.tenantId=null,this.settings={appVerificationDisabledForTesting:!1},this.frameworks=[],this.name=e.name,this.clientVersion=i.sdkClientVersion,this._persistenceManagerAvailable=new Promise(a=>this._resolvePersistenceManagerAvailable=a)}_initializeWithPersistence(e,t){return t&&(this._popupRedirectResolver=qe(t)),this._initializationPromise=this.queue(async()=>{var r,i,a;if(!this._deleted&&(this.persistenceManager=await xt.create(this,e),(r=this._resolvePersistenceManagerAvailable)==null||r.call(this),!this._deleted)){if((i=this._popupRedirectResolver)!=null&&i._shouldInitProactively)try{await this._popupRedirectResolver._initialize(this)}catch{}await this.initializeCurrentUser(t),this.lastNotifiedUid=((a=this.currentUser)==null?void 0:a.uid)||null,!this._deleted&&(this._isInitialized=!0)}}),this._initializationPromise}async _onStorageEvent(){if(this._deleted)return;const e=await this.assertedPersistence.getCurrentUser();if(!(!this.currentUser&&!e)){if(this.currentUser&&e&&this.currentUser.uid===e.uid){this._currentUser._assign(e),await this.currentUser.getIdToken();return}await this._updateCurrentUser(e,!0)}}async initializeCurrentUserFromIdToken(e){try{const t=await lr(this,{idToken:e}),r=await Re._fromGetAccountInfoResponse(this,t,e);await this.directlySetCurrentUser(r)}catch(t){console.warn("FirebaseServerApp could not login user with provided authIdToken: ",t),await this.directlySetCurrentUser(null)}}async initializeCurrentUser(e){var a;if(Ae(this.app)){const l=this.app.settings.authIdToken;return l?new Promise(h=>{setTimeout(()=>this.initializeCurrentUserFromIdToken(l).then(h,h))}):this.directlySetCurrentUser(null)}const t=await this.assertedPersistence.getCurrentUser();let r=t,i=!1;if(e&&this.config.authDomain){await this.getOrInitRedirectPersistenceManager();const l=(a=this.redirectUser)==null?void 0:a._redirectEventId,h=r==null?void 0:r._redirectEventId,f=await this.tryRedirectSignIn(e);(!l||l===h)&&(f!=null&&f.user)&&(r=f.user,i=!0)}if(!r)return this.directlySetCurrentUser(null);if(!r._redirectEventId){if(i)try{await this.beforeStateQueue.runMiddleware(r)}catch(l){r=t,this._popupRedirectResolver._overrideRedirectResult(this,()=>Promise.reject(l))}return r?this.reloadAndSetCurrentUserOrClear(r):this.directlySetCurrentUser(null)}return N(this._popupRedirectResolver,this,"argument-error"),await this.getOrInitRedirectPersistenceManager(),this.redirectUser&&this.redirectUser._redirectEventId===r._redirectEventId?this.directlySetCurrentUser(r):this.reloadAndSetCurrentUserOrClear(r)}async tryRedirectSignIn(e){let t=null;try{t=await this._popupRedirectResolver._completeRedirectFn(this,e,!0)}catch{await this._setRedirectUser(null)}return t}async reloadAndSetCurrentUserOrClear(e){try{await cr(e)}catch(t){if((t==null?void 0:t.code)!=="auth/network-request-failed")return this.directlySetCurrentUser(null)}return this.directlySetCurrentUser(e)}useDeviceLanguage(){this.languageCode=vc()}async _delete(){this._deleted=!0}async updateCurrentUser(e){if(Ae(this.app))return Promise.reject(wt(this));const t=e?Le(e):null;return t&&N(t.auth.config.apiKey===this.config.apiKey,this,"invalid-user-token"),this._updateCurrentUser(t&&t._clone(this))}async _updateCurrentUser(e,t=!1){if(!this._deleted)return e&&N(this.tenantId===e.tenantId,this,"tenant-id-mismatch"),t||await this.beforeStateQueue.runMiddleware(e),this.queue(async()=>{await this.directlySetCurrentUser(e),this.notifyAuthListeners()})}async signOut(){return Ae(this.app)?Promise.reject(wt(this)):(await this.beforeStateQueue.runMiddleware(null),(this.redirectPersistenceManager||this._popupRedirectResolver)&&await this._setRedirectUser(null),this._updateCurrentUser(null,!0))}setPersistence(e){return Ae(this.app)?Promise.reject(wt(this)):this.queue(async()=>{await this.assertedPersistence.setPersistence(qe(e))})}_getRecaptchaConfig(){return this.tenantId==null?this._agentRecaptchaConfig:this._tenantRecaptchaConfigs[this.tenantId]}async validatePassword(e){this._getPasswordPolicyInternal()||await this._updatePasswordPolicy();const t=this._getPasswordPolicyInternal();return t.schemaVersion!==this.EXPECTED_PASSWORD_POLICY_SCHEMA_VERSION?Promise.reject(this._errorFactory.create("unsupported-password-policy-schema-version",{})):t.validatePassword(e)}_getPasswordPolicyInternal(){return this.tenantId===null?this._projectPasswordPolicy:this._tenantPasswordPolicies[this.tenantId]}async _updatePasswordPolicy(){const e=await Uc(this),t=new Fc(e);this.tenantId===null?this._projectPasswordPolicy=t:this._tenantPasswordPolicies[this.tenantId]=t}_getPersistenceType(){return this.assertedPersistence.persistence.type}_getPersistence(){return this.assertedPersistence.persistence}_updateErrorMap(e){this._errorFactory=new bn("auth","Firebase",e())}onAuthStateChanged(e,t,r){return this.registerStateListener(this.authStateSubscription,e,t,r)}beforeAuthStateChanged(e,t){return this.beforeStateQueue.pushCallback(e,t)}onIdTokenChanged(e,t,r){return this.registerStateListener(this.idTokenSubscription,e,t,r)}authStateReady(){return new Promise((e,t)=>{if(this.currentUser)e();else{const r=this.onAuthStateChanged(()=>{r(),e()},t)}})}async revokeAccessToken(e){if(this.currentUser){const t=await this.currentUser.getIdToken(),r={providerId:"apple.com",tokenType:"ACCESS_TOKEN",token:e,idToken:t};this.tenantId!=null&&(r.tenantId=this.tenantId),await xc(this,r)}}toJSON(){var e;return{apiKey:this.config.apiKey,authDomain:this.config.authDomain,appName:this.name,currentUser:(e=this._currentUser)==null?void 0:e.toJSON()}}async _setRedirectUser(e,t){const r=await this.getOrInitRedirectPersistenceManager(t);return e===null?r.removeCurrentUser():r.setCurrentUser(e)}async getOrInitRedirectPersistenceManager(e){if(!this.redirectPersistenceManager){const t=e&&qe(e)||this._popupRedirectResolver;N(t,this,"argument-error"),this.redirectPersistenceManager=await xt.create(this,[qe(t._redirectPersistence)],"redirectUser"),this.redirectUser=await this.redirectPersistenceManager.getCurrentUser()}return this.redirectPersistenceManager}async _redirectUserForId(e){var t,r;return this._isInitialized&&await this.queue(async()=>{}),((t=this._currentUser)==null?void 0:t._redirectEventId)===e?this._currentUser:((r=this.redirectUser)==null?void 0:r._redirectEventId)===e?this.redirectUser:null}async _persistUserIfCurrent(e){if(e===this.currentUser)return this.queue(async()=>this.directlySetCurrentUser(e))}_notifyListenersIfCurrent(e){e===this.currentUser&&this.notifyAuthListeners()}_key(){return`${this.config.authDomain}:${this.config.apiKey}:${this.name}`}_startProactiveRefresh(){this.isProactiveRefreshEnabled=!0,this.currentUser&&this._currentUser._startProactiveRefresh()}_stopProactiveRefresh(){this.isProactiveRefreshEnabled=!1,this.currentUser&&this._currentUser._stopProactiveRefresh()}get _currentUser(){return this.currentUser}notifyAuthListeners(){var t;if(!this._isInitialized)return;this.idTokenSubscription.next(this.currentUser);const e=((t=this.currentUser)==null?void 0:t.uid)??null;this.lastNotifiedUid!==e&&(this.lastNotifiedUid=e,this.authStateSubscription.next(this.currentUser))}registerStateListener(e,t,r,i){if(this._deleted)return()=>{};const a=typeof t=="function"?t:t.next.bind(t);let l=!1;const h=this._isInitialized?Promise.resolve():this._initializationPromise;if(N(h,this,"internal-error"),h.then(()=>{l||a(this.currentUser)}),typeof t=="function"){const f=e.addObserver(t,r,i);return()=>{l=!0,f()}}else{const f=e.addObserver(t);return()=>{l=!0,f()}}}async directlySetCurrentUser(e){this.currentUser&&this.currentUser!==e&&this._currentUser._stopProactiveRefresh(),e&&this.isProactiveRefreshEnabled&&e._startProactiveRefresh(),this.currentUser=e,e?await this.assertedPersistence.setCurrentUser(e):await this.assertedPersistence.removeCurrentUser()}queue(e){return this.operations=this.operations.then(e,e),this.operations}get assertedPersistence(){return N(this.persistenceManager,this,"internal-error"),this.persistenceManager}_logFramework(e){!e||this.frameworks.includes(e)||(this.frameworks.push(e),this.frameworks.sort(),this.clientVersion=Ea(this.config.clientPlatform,this._getFrameworks()))}_getFrameworks(){return this.frameworks}async _getAdditionalHeaders(){var i;const e={"X-Client-Version":this.clientVersion};this.app.options.appId&&(e["X-Firebase-gmpid"]=this.app.options.appId);const t=await((i=this.heartbeatServiceProvider.getImmediate({optional:!0}))==null?void 0:i.getHeartbeatsHeader());t&&(e["X-Firebase-Client"]=t);const r=await this._getAppCheckToken();return r&&(e["X-Firebase-AppCheck"]=r),e}async _getAppCheckToken(){var t;if(Ae(this.app)&&this.app.settings.appCheckToken)return this.app.settings.appCheckToken;const e=await((t=this.appCheckServiceProvider.getImmediate({optional:!0}))==null?void 0:t.getToken());return e!=null&&e.error&&_c(`Error while retrieving App Check token: ${e.error}`),e==null?void 0:e.token}}function xs(n){return Le(n)}class po{constructor(e){this.auth=e,this.observer=null,this.addObserver=dl(t=>this.observer=t)}get next(){return N(this.observer,this.auth,"internal-error"),this.observer.next.bind(this.observer)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Os={async loadJS(){throw new Error("Unable to load external scripts")},recaptchaV2Script:"",recaptchaEnterpriseScript:"",gapiScript:""};function jc(n){Os=n}function $c(n){return Os.loadJS(n)}function Hc(){return Os.gapiScript}function qc(n){return`__${n}${Math.floor(Math.random()*1e6)}`}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function zc(n,e){const t=Pr(n,"auth");if(t.isInitialized()){const i=t.getImmediate(),a=t.getOptions();if(vt(a,e??{}))return i;Ge(i,"already-initialized")}return t.initialize({options:e})}function Wc(n,e){const t=(e==null?void 0:e.persistence)||[],r=(Array.isArray(t)?t:[t]).map(qe);e!=null&&e.errorMap&&n._updateErrorMap(e.errorMap),n._initializeWithPersistence(r,e==null?void 0:e.popupRedirectResolver)}function Gc(n,e,t){const r=xs(n);N(/^https?:\/\//.test(e),r,"invalid-emulator-scheme");const i=!1,a=Ta(e),{host:l,port:h}=Kc(e),f=h===null?"":`:${h}`,_={url:`${a}//${l}${f}/`},b=Object.freeze({host:l,port:h,protocol:a.replace(":",""),options:Object.freeze({disableWarnings:i})});if(!r._canInitEmulator){N(r.config.emulator&&r.emulatorConfig,r,"emulator-config-failed"),N(vt(_,r.config.emulator)&&vt(b,r.emulatorConfig),r,"emulator-config-failed");return}r.config.emulator=_,r.emulatorConfig=b,r.settings.appVerificationDisabledForTesting=!0,Pn(l)?bs(`${a}//${l}${f}`):Jc()}function Ta(n){const e=n.indexOf(":");return e<0?"":n.substr(0,e+1)}function Kc(n){const e=Ta(n),t=/(\/\/)?([^?#/]+)/.exec(n.substr(e.length));if(!t)return{host:"",port:null};const r=t[2].split("@").pop()||"",i=/^(\[[^\]]+\])(:|$)/.exec(r);if(i){const a=i[1];return{host:a,port:go(r.substr(a.length+1))}}else{const[a,l]=r.split(":");return{host:a,port:go(l)}}}function go(n){if(!n)return null;const e=Number(n);return isNaN(e)?null:e}function Jc(){function n(){const e=document.createElement("p"),t=e.style;e.innerText="Running in emulator mode. Do not use with production credentials.",t.position="fixed",t.width="100%",t.backgroundColor="#ffffff",t.border=".1em solid #000000",t.color="#b50000",t.bottom="0px",t.left="0px",t.margin="0px",t.zIndex="10000",t.textAlign="center",e.classList.add("firebase-emulator-warning"),document.body.appendChild(e)}typeof console<"u"&&typeof console.info=="function"&&console.info("WARNING: You are using the Auth Emulator, which is intended for local testing only.  Do not use with production credentials."),typeof window<"u"&&typeof document<"u"&&(document.readyState==="loading"?window.addEventListener("DOMContentLoaded",n):n())}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Aa{constructor(e,t){this.providerId=e,this.signInMethod=t}toJSON(){return He("not implemented")}_getIdTokenResponse(e){return He("not implemented")}_linkToIdToken(e,t){return He("not implemented")}_getReauthenticationResolver(e){return He("not implemented")}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Ot(n,e){return Ac(n,"POST","/v1/accounts:signInWithIdp",ks(n,e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Yc="http://localhost";class Et extends Aa{constructor(){super(...arguments),this.pendingToken=null}static _fromParams(e){const t=new Et(e.providerId,e.signInMethod);return e.idToken||e.accessToken?(e.idToken&&(t.idToken=e.idToken),e.accessToken&&(t.accessToken=e.accessToken),e.nonce&&!e.pendingToken&&(t.nonce=e.nonce),e.pendingToken&&(t.pendingToken=e.pendingToken)):e.oauthToken&&e.oauthTokenSecret?(t.accessToken=e.oauthToken,t.secret=e.oauthTokenSecret):Ge("argument-error"),t}toJSON(){return{idToken:this.idToken,accessToken:this.accessToken,secret:this.secret,nonce:this.nonce,pendingToken:this.pendingToken,providerId:this.providerId,signInMethod:this.signInMethod}}static fromJSON(e){const t=typeof e=="string"?JSON.parse(e):e,{providerId:r,signInMethod:i,...a}=t;if(!r||!i)return null;const l=new Et(r,i);return l.idToken=a.idToken||void 0,l.accessToken=a.accessToken||void 0,l.secret=a.secret,l.nonce=a.nonce,l.pendingToken=a.pendingToken||null,l}_getIdTokenResponse(e){const t=this.buildRequest();return Ot(e,t)}_linkToIdToken(e,t){const r=this.buildRequest();return r.idToken=t,Ot(e,r)}_getReauthenticationResolver(e){const t=this.buildRequest();return t.autoCreate=!1,Ot(e,t)}buildRequest(){const e={requestUri:Yc,returnSecureToken:!0};if(this.pendingToken)e.pendingToken=this.pendingToken;else{const t={};this.idToken&&(t.id_token=this.idToken),this.accessToken&&(t.access_token=this.accessToken),this.secret&&(t.oauth_token_secret=this.secret),t.providerId=this.providerId,this.nonce&&!this.pendingToken&&(t.nonce=this.nonce),e.postBody=Rn(t)}return e}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ba{constructor(e){this.providerId=e,this.defaultLanguageCode=null,this.customParameters={}}setDefaultLanguage(e){this.defaultLanguageCode=e}setCustomParameters(e){return this.customParameters=e,this}getCustomParameters(){return this.customParameters}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Vn extends ba{constructor(){super(...arguments),this.scopes=[]}addScope(e){return this.scopes.includes(e)||this.scopes.push(e),this}getScopes(){return[...this.scopes]}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class rt extends Vn{constructor(){super("facebook.com")}static credential(e){return Et._fromParams({providerId:rt.PROVIDER_ID,signInMethod:rt.FACEBOOK_SIGN_IN_METHOD,accessToken:e})}static credentialFromResult(e){return rt.credentialFromTaggedObject(e)}static credentialFromError(e){return rt.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e||!("oauthAccessToken"in e)||!e.oauthAccessToken)return null;try{return rt.credential(e.oauthAccessToken)}catch{return null}}}rt.FACEBOOK_SIGN_IN_METHOD="facebook.com";rt.PROVIDER_ID="facebook.com";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class st extends Vn{constructor(){super("google.com"),this.addScope("profile")}static credential(e,t){return Et._fromParams({providerId:st.PROVIDER_ID,signInMethod:st.GOOGLE_SIGN_IN_METHOD,idToken:e,accessToken:t})}static credentialFromResult(e){return st.credentialFromTaggedObject(e)}static credentialFromError(e){return st.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e)return null;const{oauthIdToken:t,oauthAccessToken:r}=e;if(!t&&!r)return null;try{return st.credential(t,r)}catch{return null}}}st.GOOGLE_SIGN_IN_METHOD="google.com";st.PROVIDER_ID="google.com";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class it extends Vn{constructor(){super("github.com")}static credential(e){return Et._fromParams({providerId:it.PROVIDER_ID,signInMethod:it.GITHUB_SIGN_IN_METHOD,accessToken:e})}static credentialFromResult(e){return it.credentialFromTaggedObject(e)}static credentialFromError(e){return it.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e||!("oauthAccessToken"in e)||!e.oauthAccessToken)return null;try{return it.credential(e.oauthAccessToken)}catch{return null}}}it.GITHUB_SIGN_IN_METHOD="github.com";it.PROVIDER_ID="github.com";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ot extends Vn{constructor(){super("twitter.com")}static credential(e,t){return Et._fromParams({providerId:ot.PROVIDER_ID,signInMethod:ot.TWITTER_SIGN_IN_METHOD,oauthToken:e,oauthTokenSecret:t})}static credentialFromResult(e){return ot.credentialFromTaggedObject(e)}static credentialFromError(e){return ot.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e)return null;const{oauthAccessToken:t,oauthTokenSecret:r}=e;if(!t||!r)return null;try{return ot.credential(t,r)}catch{return null}}}ot.TWITTER_SIGN_IN_METHOD="twitter.com";ot.PROVIDER_ID="twitter.com";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ut{constructor(e){this.user=e.user,this.providerId=e.providerId,this._tokenResponse=e._tokenResponse,this.operationType=e.operationType}static async _fromIdTokenResponse(e,t,r,i=!1){const a=await Re._fromIdTokenResponse(e,r,i),l=mo(r);return new Ut({user:a,providerId:l,_tokenResponse:r,operationType:t})}static async _forOperation(e,t,r){await e._updateTokensIfNecessary(r,!0);const i=mo(r);return new Ut({user:e,providerId:i,_tokenResponse:r,operationType:t})}}function mo(n){return n.providerId?n.providerId:"phoneNumber"in n?"phone":null}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class hr extends Fe{constructor(e,t,r,i){super(t.code,t.message),this.operationType=r,this.user=i,Object.setPrototypeOf(this,hr.prototype),this.customData={appName:e.name,tenantId:e.tenantId??void 0,_serverResponse:t.customData._serverResponse,operationType:r}}static _fromErrorAndOperation(e,t,r,i){return new hr(e,t,r,i)}}function Ra(n,e,t,r){return(e==="reauthenticate"?t._getReauthenticationResolver(n):t._getIdTokenResponse(n)).catch(a=>{throw a.code==="auth/multi-factor-auth-required"?hr._fromErrorAndOperation(n,a,e,r):a})}async function Xc(n,e,t=!1){const r=await gn(n,e._linkToIdToken(n.auth,await n.getIdToken()),t);return Ut._forOperation(n,"link",r)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Qc(n,e,t=!1){const{auth:r}=n;if(Ae(r.app))return Promise.reject(wt(r));const i="reauthenticate";try{const a=await gn(n,Ra(r,i,e,n),t);N(a.idToken,r,"internal-error");const l=Ns(a.idToken);N(l,r,"internal-error");const{sub:h}=l;return N(n.uid===h,r,"user-mismatch"),Ut._forOperation(n,i,a)}catch(a){throw(a==null?void 0:a.code)==="auth/user-not-found"&&Ge(r,"user-mismatch"),a}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Zc(n,e,t=!1){if(Ae(n.app))return Promise.reject(wt(n));const r="signIn",i=await Ra(n,r,e),a=await Ut._fromIdTokenResponse(n,r,i);return t||await n._updateCurrentUser(a.user),a}function eh(n,e,t,r){return Le(n).onIdTokenChanged(e,t,r)}function th(n,e,t){return Le(n).beforeAuthStateChanged(e,t)}const fr="__sak";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Pa{constructor(e,t){this.storageRetriever=e,this.type=t}_isAvailable(){try{return this.storage?(this.storage.setItem(fr,"1"),this.storage.removeItem(fr),Promise.resolve(!0)):Promise.resolve(!1)}catch{return Promise.resolve(!1)}}_set(e,t){return this.storage.setItem(e,JSON.stringify(t)),Promise.resolve()}_get(e){const t=this.storage.getItem(e);return Promise.resolve(t?JSON.parse(t):null)}_remove(e){return this.storage.removeItem(e),Promise.resolve()}get storage(){return this.storageRetriever()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const nh=1e3,rh=10;class Sa extends Pa{constructor(){super(()=>window.localStorage,"LOCAL"),this.boundEventHandler=(e,t)=>this.onStorageEvent(e,t),this.listeners={},this.localCache={},this.pollTimer=null,this.fallbackToPolling=Ia(),this._shouldAllowMigration=!0}forAllChangedKeys(e){for(const t of Object.keys(this.listeners)){const r=this.storage.getItem(t),i=this.localCache[t];r!==i&&e(t,i,r)}}onStorageEvent(e,t=!1){if(!e.key){this.forAllChangedKeys((l,h,f)=>{this.notifyListeners(l,f)});return}const r=e.key;t?this.detachListener():this.stopPolling();const i=()=>{const l=this.storage.getItem(r);!t&&this.localCache[r]===l||this.notifyListeners(r,l)},a=this.storage.getItem(r);Dc()&&a!==e.newValue&&e.newValue!==e.oldValue?setTimeout(i,rh):i()}notifyListeners(e,t){this.localCache[e]=t;const r=this.listeners[e];if(r)for(const i of Array.from(r))i(t&&JSON.parse(t))}startPolling(){this.stopPolling(),this.pollTimer=setInterval(()=>{this.forAllChangedKeys((e,t,r)=>{this.onStorageEvent(new StorageEvent("storage",{key:e,oldValue:t,newValue:r}),!0)})},nh)}stopPolling(){this.pollTimer&&(clearInterval(this.pollTimer),this.pollTimer=null)}attachListener(){window.addEventListener("storage",this.boundEventHandler)}detachListener(){window.removeEventListener("storage",this.boundEventHandler)}_addListener(e,t){Object.keys(this.listeners).length===0&&(this.fallbackToPolling?this.startPolling():this.attachListener()),this.listeners[e]||(this.listeners[e]=new Set,this.localCache[e]=this.storage.getItem(e)),this.listeners[e].add(t)}_removeListener(e,t){this.listeners[e]&&(this.listeners[e].delete(t),this.listeners[e].size===0&&delete this.listeners[e]),Object.keys(this.listeners).length===0&&(this.detachListener(),this.stopPolling())}async _set(e,t){await super._set(e,t),this.localCache[e]=JSON.stringify(t)}async _get(e){const t=await super._get(e);return this.localCache[e]=JSON.stringify(t),t}async _remove(e){await super._remove(e),delete this.localCache[e]}}Sa.type="LOCAL";const sh=Sa;/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Va extends Pa{constructor(){super(()=>window.sessionStorage,"SESSION")}_addListener(e,t){}_removeListener(e,t){}}Va.type="SESSION";const ka=Va;/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ih(n){return Promise.all(n.map(async e=>{try{return{fulfilled:!0,value:await e}}catch(t){return{fulfilled:!1,reason:t}}}))}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Sr{constructor(e){this.eventTarget=e,this.handlersMap={},this.boundEventHandler=this.handleEvent.bind(this)}static _getInstance(e){const t=this.receivers.find(i=>i.isListeningto(e));if(t)return t;const r=new Sr(e);return this.receivers.push(r),r}isListeningto(e){return this.eventTarget===e}async handleEvent(e){const t=e,{eventId:r,eventType:i,data:a}=t.data,l=this.handlersMap[i];if(!(l!=null&&l.size))return;t.ports[0].postMessage({status:"ack",eventId:r,eventType:i});const h=Array.from(l).map(async _=>_(t.origin,a)),f=await ih(h);t.ports[0].postMessage({status:"done",eventId:r,eventType:i,response:f})}_subscribe(e,t){Object.keys(this.handlersMap).length===0&&this.eventTarget.addEventListener("message",this.boundEventHandler),this.handlersMap[e]||(this.handlersMap[e]=new Set),this.handlersMap[e].add(t)}_unsubscribe(e,t){this.handlersMap[e]&&t&&this.handlersMap[e].delete(t),(!t||this.handlersMap[e].size===0)&&delete this.handlersMap[e],Object.keys(this.handlersMap).length===0&&this.eventTarget.removeEventListener("message",this.boundEventHandler)}}Sr.receivers=[];/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ds(n="",e=10){let t="";for(let r=0;r<e;r++)t+=Math.floor(Math.random()*10);return n+t}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class oh{constructor(e){this.target=e,this.handlers=new Set}removeMessageHandler(e){e.messageChannel&&(e.messageChannel.port1.removeEventListener("message",e.onMessage),e.messageChannel.port1.close()),this.handlers.delete(e)}async _send(e,t,r=50){const i=typeof MessageChannel<"u"?new MessageChannel:null;if(!i)throw new Error("connection_unavailable");let a,l;return new Promise((h,f)=>{const _=Ds("",20);i.port1.start();const b=setTimeout(()=>{f(new Error("unsupported_event"))},r);l={messageChannel:i,onMessage(R){const V=R;if(V.data.eventId===_)switch(V.data.status){case"ack":clearTimeout(b),a=setTimeout(()=>{f(new Error("timeout"))},3e3);break;case"done":clearTimeout(a),h(V.data.response);break;default:clearTimeout(b),clearTimeout(a),f(new Error("invalid_response"));break}}},this.handlers.add(l),i.port1.addEventListener("message",l.onMessage),this.target.postMessage({eventType:e,eventId:_,data:t},[i.port2])}).finally(()=>{l&&this.removeMessageHandler(l)})}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function De(){return window}function ah(n){De().location.href=n}/**
 * @license
 * Copyright 2020 Google LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Na(){return typeof De().WorkerGlobalScope<"u"&&typeof De().importScripts=="function"}async function uh(){if(!(navigator!=null&&navigator.serviceWorker))return null;try{return(await navigator.serviceWorker.ready).active}catch{return null}}function lh(){var n;return((n=navigator==null?void 0:navigator.serviceWorker)==null?void 0:n.controller)||null}function ch(){return Na()?self:null}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ca="firebaseLocalStorageDb",hh=1,dr="firebaseLocalStorage",xa="fbase_key";class kn{constructor(e){this.request=e}toPromise(){return new Promise((e,t)=>{this.request.addEventListener("success",()=>{e(this.request.result)}),this.request.addEventListener("error",()=>{t(this.request.error)})})}}function Vr(n,e){return n.transaction([dr],e?"readwrite":"readonly").objectStore(dr)}function fh(){const n=indexedDB.deleteDatabase(Ca);return new kn(n).toPromise()}function Oa(){const n=indexedDB.open(Ca,hh);return new Promise((e,t)=>{n.addEventListener("error",()=>{t(n.error)}),n.addEventListener("upgradeneeded",()=>{const r=n.result;try{r.createObjectStore(dr,{keyPath:xa})}catch(i){t(i)}}),n.addEventListener("success",async()=>{const r=n.result;r.objectStoreNames.contains(dr)?e(r):(r.close(),await fh(),e(await Oa()))})})}async function _o(n,e,t){const r=Vr(n,!0).put({[xa]:e,value:t});return new kn(r).toPromise()}async function dh(n,e){const t=Vr(n,!1).get(e),r=await new kn(t).toPromise();return r===void 0?null:r.value}function yo(n,e){const t=Vr(n,!0).delete(e);return new kn(t).toPromise()}const ph=800,gh=3;class Da{constructor(){this.type="LOCAL",this.dbPromise=null,this._shouldAllowMigration=!0,this.listeners={},this.localCache={},this.pollTimer=null,this.pendingWrites=0,this.receiver=null,this.sender=null,this.serviceWorkerReceiverAvailable=!1,this.activeServiceWorker=null,this._workerInitializationPromise=this.initializeServiceWorkerMessaging().then(()=>{},()=>{})}async _openDb(){return this.dbPromise?this.dbPromise:(this.dbPromise=Oa(),this.dbPromise.catch(()=>{this.dbPromise=null}),this.dbPromise)}async _withRetries(e){let t=0;for(;;)try{const r=await this._openDb();return await e(r)}catch(r){if(t++>gh)throw r;this.dbPromise&&((await this.dbPromise).close(),this.dbPromise=null)}}async initializeServiceWorkerMessaging(){return Na()?this.initializeReceiver():this.initializeSender()}async initializeReceiver(){this.receiver=Sr._getInstance(ch()),this.receiver._subscribe("keyChanged",async(e,t)=>({keyProcessed:(await this._poll()).includes(t.key)})),this.receiver._subscribe("ping",async(e,t)=>["keyChanged"])}async initializeSender(){var t,r;if(this.activeServiceWorker=await uh(),!this.activeServiceWorker)return;this.sender=new oh(this.activeServiceWorker);const e=await this.sender._send("ping",{},800);e&&(t=e[0])!=null&&t.fulfilled&&(r=e[0])!=null&&r.value.includes("keyChanged")&&(this.serviceWorkerReceiverAvailable=!0)}async notifyServiceWorker(e){if(!(!this.sender||!this.activeServiceWorker||lh()!==this.activeServiceWorker))try{await this.sender._send("keyChanged",{key:e},this.serviceWorkerReceiverAvailable?800:50)}catch{}}async _isAvailable(){try{return indexedDB?(await this._withRetries(async e=>{await _o(e,fr,"1"),await yo(e,fr)}),!0):!1}catch{}return!1}async _withPendingWrite(e){this.pendingWrites++;try{await e()}finally{this.pendingWrites--}}async _set(e,t){return this._withPendingWrite(async()=>(await this._withRetries(r=>_o(r,e,t)),this.localCache[e]=t,this.notifyServiceWorker(e)))}async _get(e){const t=await this._withRetries(r=>dh(r,e));return this.localCache[e]=t,t}async _remove(e){return this._withPendingWrite(async()=>(await this._withRetries(t=>yo(t,e)),delete this.localCache[e],this.notifyServiceWorker(e)))}async _poll(){const e=await this._withRetries(i=>{const a=Vr(i,!1).getAll();return new kn(a).toPromise()});if(!e)return[];if(this.pendingWrites!==0)return[];const t=[],r=new Set;if(e.length!==0)for(const{fbase_key:i,value:a}of e)r.add(i),JSON.stringify(this.localCache[i])!==JSON.stringify(a)&&(this.notifyListeners(i,a),t.push(i));for(const i of Object.keys(this.localCache))this.localCache[i]&&!r.has(i)&&(this.notifyListeners(i,null),t.push(i));return t}notifyListeners(e,t){this.localCache[e]=t;const r=this.listeners[e];if(r)for(const i of Array.from(r))i(t)}startPolling(){this.stopPolling(),this.pollTimer=setInterval(async()=>this._poll(),ph)}stopPolling(){this.pollTimer&&(clearInterval(this.pollTimer),this.pollTimer=null)}_addListener(e,t){Object.keys(this.listeners).length===0&&this.startPolling(),this.listeners[e]||(this.listeners[e]=new Set,this._get(e)),this.listeners[e].add(t)}_removeListener(e,t){this.listeners[e]&&(this.listeners[e].delete(t),this.listeners[e].size===0&&delete this.listeners[e]),Object.keys(this.listeners).length===0&&this.stopPolling()}}Da.type="LOCAL";const mh=Da;new Sn(3e4,6e4);/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function _h(n,e){return e?qe(e):(N(n._popupRedirectResolver,n,"argument-error"),n._popupRedirectResolver)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ls extends Aa{constructor(e){super("custom","custom"),this.params=e}_getIdTokenResponse(e){return Ot(e,this._buildIdpRequest())}_linkToIdToken(e,t){return Ot(e,this._buildIdpRequest(t))}_getReauthenticationResolver(e){return Ot(e,this._buildIdpRequest())}_buildIdpRequest(e){const t={requestUri:this.params.requestUri,sessionId:this.params.sessionId,postBody:this.params.postBody,tenantId:this.params.tenantId,pendingToken:this.params.pendingToken,returnSecureToken:!0,returnIdpCredential:!0};return e&&(t.idToken=e),t}}function yh(n){return Zc(n.auth,new Ls(n),n.bypassAuthState)}function wh(n){const{auth:e,user:t}=n;return N(t,e,"internal-error"),Qc(t,new Ls(n),n.bypassAuthState)}async function vh(n){const{auth:e,user:t}=n;return N(t,e,"internal-error"),Xc(t,new Ls(n),n.bypassAuthState)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class La{constructor(e,t,r,i,a=!1){this.auth=e,this.resolver=r,this.user=i,this.bypassAuthState=a,this.pendingPromise=null,this.eventManager=null,this.filter=Array.isArray(t)?t:[t]}execute(){return new Promise(async(e,t)=>{this.pendingPromise={resolve:e,reject:t};try{this.eventManager=await this.resolver._initialize(this.auth),await this.onExecution(),this.eventManager.registerConsumer(this)}catch(r){this.reject(r)}})}async onAuthEvent(e){const{urlResponse:t,sessionId:r,postBody:i,tenantId:a,error:l,type:h}=e;if(l){this.reject(l);return}const f={auth:this.auth,requestUri:t,sessionId:r,tenantId:a||void 0,postBody:i||void 0,user:this.user,bypassAuthState:this.bypassAuthState};try{this.resolve(await this.getIdpTask(h)(f))}catch(_){this.reject(_)}}onError(e){this.reject(e)}getIdpTask(e){switch(e){case"signInViaPopup":case"signInViaRedirect":return yh;case"linkViaPopup":case"linkViaRedirect":return vh;case"reauthViaPopup":case"reauthViaRedirect":return wh;default:Ge(this.auth,"internal-error")}}resolve(e){Ke(this.pendingPromise,"Pending promise was never set"),this.pendingPromise.resolve(e),this.unregisterAndCleanUp()}reject(e){Ke(this.pendingPromise,"Pending promise was never set"),this.pendingPromise.reject(e),this.unregisterAndCleanUp()}unregisterAndCleanUp(){this.eventManager&&this.eventManager.unregisterConsumer(this),this.pendingPromise=null,this.cleanUp()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ih=new Sn(2e3,1e4);class kt extends La{constructor(e,t,r,i,a){super(e,t,i,a),this.provider=r,this.authWindow=null,this.pollId=null,kt.currentPopupAction&&kt.currentPopupAction.cancel(),kt.currentPopupAction=this}async executeNotNull(){const e=await this.execute();return N(e,this.auth,"internal-error"),e}async onExecution(){Ke(this.filter.length===1,"Popup operations only handle one event");const e=Ds();this.authWindow=await this.resolver._openPopup(this.auth,this.provider,this.filter[0],e),this.authWindow.associatedEvent=e,this.resolver._originValidation(this.auth).catch(t=>{this.reject(t)}),this.resolver._isIframeWebStorageSupported(this.auth,t=>{t||this.reject(Oe(this.auth,"web-storage-unsupported"))}),this.pollUserCancellation()}get eventId(){var e;return((e=this.authWindow)==null?void 0:e.associatedEvent)||null}cancel(){this.reject(Oe(this.auth,"cancelled-popup-request"))}cleanUp(){this.authWindow&&this.authWindow.close(),this.pollId&&window.clearTimeout(this.pollId),this.authWindow=null,this.pollId=null,kt.currentPopupAction=null}pollUserCancellation(){const e=()=>{var t,r;if((r=(t=this.authWindow)==null?void 0:t.window)!=null&&r.closed){this.pollId=window.setTimeout(()=>{this.pollId=null,this.reject(Oe(this.auth,"popup-closed-by-user"))},8e3);return}this.pollId=window.setTimeout(e,Ih.get())};e()}}kt.currentPopupAction=null;/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Eh="pendingRedirect",sr=new Map;class Th extends La{constructor(e,t,r=!1){super(e,["signInViaRedirect","linkViaRedirect","reauthViaRedirect","unknown"],t,void 0,r),this.eventId=null}async execute(){let e=sr.get(this.auth._key());if(!e){try{const r=await Ah(this.resolver,this.auth)?await super.execute():null;e=()=>Promise.resolve(r)}catch(t){e=()=>Promise.reject(t)}sr.set(this.auth._key(),e)}return this.bypassAuthState||sr.set(this.auth._key(),()=>Promise.resolve(null)),e()}async onAuthEvent(e){if(e.type==="signInViaRedirect")return super.onAuthEvent(e);if(e.type==="unknown"){this.resolve(null);return}if(e.eventId){const t=await this.auth._redirectUserForId(e.eventId);if(t)return this.user=t,super.onAuthEvent(e);this.resolve(null)}}async onExecution(){}cleanUp(){}}async function Ah(n,e){const t=Ph(e),r=Rh(n);if(!await r._isAvailable())return!1;const i=await r._get(t)==="true";return await r._remove(t),i}function bh(n,e){sr.set(n._key(),e)}function Rh(n){return qe(n._redirectPersistence)}function Ph(n){return rr(Eh,n.config.apiKey,n.name)}async function Sh(n,e,t=!1){if(Ae(n.app))return Promise.reject(wt(n));const r=xs(n),i=_h(r,e),l=await new Th(r,i,t).execute();return l&&!t&&(delete l.user._redirectEventId,await r._persistUserIfCurrent(l.user),await r._setRedirectUser(null,e)),l}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Vh=600*1e3;class kh{constructor(e){this.auth=e,this.cachedEventUids=new Set,this.consumers=new Set,this.queuedRedirectEvent=null,this.hasHandledPotentialRedirect=!1,this.lastProcessedEventTime=Date.now()}registerConsumer(e){this.consumers.add(e),this.queuedRedirectEvent&&this.isEventForConsumer(this.queuedRedirectEvent,e)&&(this.sendToConsumer(this.queuedRedirectEvent,e),this.saveEventToCache(this.queuedRedirectEvent),this.queuedRedirectEvent=null)}unregisterConsumer(e){this.consumers.delete(e)}onEvent(e){if(this.hasEventBeenHandled(e))return!1;let t=!1;return this.consumers.forEach(r=>{this.isEventForConsumer(e,r)&&(t=!0,this.sendToConsumer(e,r),this.saveEventToCache(e))}),this.hasHandledPotentialRedirect||!Nh(e)||(this.hasHandledPotentialRedirect=!0,t||(this.queuedRedirectEvent=e,t=!0)),t}sendToConsumer(e,t){var r;if(e.error&&!Ua(e)){const i=((r=e.error.code)==null?void 0:r.split("auth/")[1])||"internal-error";t.onError(Oe(this.auth,i))}else t.onAuthEvent(e)}isEventForConsumer(e,t){const r=t.eventId===null||!!e.eventId&&e.eventId===t.eventId;return t.filter.includes(e.type)&&r}hasEventBeenHandled(e){return Date.now()-this.lastProcessedEventTime>=Vh&&this.cachedEventUids.clear(),this.cachedEventUids.has(wo(e))}saveEventToCache(e){this.cachedEventUids.add(wo(e)),this.lastProcessedEventTime=Date.now()}}function wo(n){return[n.type,n.eventId,n.sessionId,n.tenantId].filter(e=>e).join("-")}function Ua({type:n,error:e}){return n==="unknown"&&(e==null?void 0:e.code)==="auth/no-auth-event"}function Nh(n){switch(n.type){case"signInViaRedirect":case"linkViaRedirect":case"reauthViaRedirect":return!0;case"unknown":return Ua(n);default:return!1}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Ch(n,e={}){return jt(n,"GET","/v1/projects",e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const xh=/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,Oh=/^https?/;async function Dh(n){if(n.config.emulator)return;const{authorizedDomains:e}=await Ch(n);for(const t of e)try{if(Lh(t))return}catch{}Ge(n,"unauthorized-domain")}function Lh(n){const e=gs(),{protocol:t,hostname:r}=new URL(e);if(n.startsWith("chrome-extension://")){const l=new URL(n);return l.hostname===""&&r===""?t==="chrome-extension:"&&n.replace("chrome-extension://","")===e.replace("chrome-extension://",""):t==="chrome-extension:"&&l.hostname===r}if(!Oh.test(t))return!1;if(xh.test(n))return r===n;const i=n.replace(/\./g,"\\.");return new RegExp("^(.+\\."+i+"|"+i+")$","i").test(r)}/**
 * @license
 * Copyright 2020 Google LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Uh=new Sn(3e4,6e4);function vo(){const n=De().___jsl;if(n!=null&&n.H){for(const e of Object.keys(n.H))if(n.H[e].r=n.H[e].r||[],n.H[e].L=n.H[e].L||[],n.H[e].r=[...n.H[e].L],n.CP)for(let t=0;t<n.CP.length;t++)n.CP[t]=null}}function Mh(n){return new Promise((e,t)=>{var i,a,l;function r(){vo(),gapi.load("gapi.iframes",{callback:()=>{e(gapi.iframes.getContext())},ontimeout:()=>{vo(),t(Oe(n,"network-request-failed"))},timeout:Uh.get()})}if((a=(i=De().gapi)==null?void 0:i.iframes)!=null&&a.Iframe)e(gapi.iframes.getContext());else if((l=De().gapi)!=null&&l.load)r();else{const h=qc("iframefcb");return De()[h]=()=>{gapi.load?r():t(Oe(n,"network-request-failed"))},$c(`${Hc()}?onload=${h}`).catch(f=>t(f))}}).catch(e=>{throw ir=null,e})}let ir=null;function Fh(n){return ir=ir||Mh(n),ir}/**
 * @license
 * Copyright 2020 Google LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Bh=new Sn(5e3,15e3),jh="__/auth/iframe",$h="emulator/auth/iframe",Hh={style:{position:"absolute",top:"-100px",width:"1px",height:"1px"},"aria-hidden":"true",tabindex:"-1"},qh=new Map([["identitytoolkit.googleapis.com","p"],["staging-identitytoolkit.sandbox.googleapis.com","s"],["test-identitytoolkit.sandbox.googleapis.com","t"]]);function zh(n){const e=n.config;N(e.authDomain,n,"auth-domain-config-required");const t=e.emulator?Vs(e,$h):`https://${n.config.authDomain}/${jh}`,r={apiKey:e.apiKey,appName:n.name,v:At},i=qh.get(n.config.apiHost);i&&(r.eid=i);const a=n._getFrameworks();return a.length&&(r.fw=a.join(",")),`${t}?${Rn(r).slice(1)}`}async function Wh(n){const e=await Fh(n),t=De().gapi;return N(t,n,"internal-error"),e.open({where:document.body,url:zh(n),messageHandlersFilter:t.iframes.CROSS_ORIGIN_IFRAMES_FILTER,attributes:Hh,dontclear:!0},r=>new Promise(async(i,a)=>{await r.restyle({setHideOnLeave:!1});const l=Oe(n,"network-request-failed"),h=De().setTimeout(()=>{a(l)},Bh.get());function f(){De().clearTimeout(h),i(r)}r.ping(f).then(f,()=>{a(l)})}))}/**
 * @license
 * Copyright 2020 Google LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Gh={location:"yes",resizable:"yes",statusbar:"yes",toolbar:"no"},Kh=500,Jh=600,Yh="_blank",Xh="http://localhost";class Io{constructor(e){this.window=e,this.associatedEvent=null}close(){if(this.window)try{this.window.close()}catch{}}}function Qh(n,e,t,r=Kh,i=Jh){const a=Math.max((window.screen.availHeight-i)/2,0).toString(),l=Math.max((window.screen.availWidth-r)/2,0).toString();let h="";const f={...Gh,width:r.toString(),height:i.toString(),top:a,left:l},_=ce().toLowerCase();t&&(h=ma(_)?Yh:t),pa(_)&&(e=e||Xh,f.scrollbars="yes");const b=Object.entries(f).reduce((V,[x,O])=>`${V}${x}=${O},`,"");if(Oc(_)&&h!=="_self")return Zh(e||"",h),new Io(null);const R=window.open(e||"",h,b);N(R,n,"popup-blocked");try{R.focus()}catch{}return new Io(R)}function Zh(n,e){const t=document.createElement("a");t.href=n,t.target=e;const r=document.createEvent("MouseEvent");r.initMouseEvent("click",!0,!0,window,1,0,0,0,0,!1,!1,!1,!1,1,null),t.dispatchEvent(r)}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ef="__/auth/handler",tf="emulator/auth/handler",nf=encodeURIComponent("fac");async function Eo(n,e,t,r,i,a){N(n.config.authDomain,n,"auth-domain-config-required"),N(n.config.apiKey,n,"invalid-api-key");const l={apiKey:n.config.apiKey,appName:n.name,authType:t,redirectUrl:r,v:At,eventId:i};if(e instanceof ba){e.setDefaultLanguage(n.languageCode),l.providerId=e.providerId||"",fl(e.getCustomParameters())||(l.customParameters=JSON.stringify(e.getCustomParameters()));for(const[b,R]of Object.entries({}))l[b]=R}if(e instanceof Vn){const b=e.getScopes().filter(R=>R!=="");b.length>0&&(l.scopes=b.join(","))}n.tenantId&&(l.tid=n.tenantId);const h=l;for(const b of Object.keys(h))h[b]===void 0&&delete h[b];const f=await n._getAppCheckToken(),_=f?`#${nf}=${encodeURIComponent(f)}`:"";return`${rf(n)}?${Rn(h).slice(1)}${_}`}function rf({config:n}){return n.emulator?Vs(n,tf):`https://${n.authDomain}/${ef}`}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const os="webStorageSupport";class sf{constructor(){this.eventManagers={},this.iframes={},this.originValidationPromises={},this._redirectPersistence=ka,this._completeRedirectFn=Sh,this._overrideRedirectResult=bh}async _openPopup(e,t,r,i){var l;Ke((l=this.eventManagers[e._key()])==null?void 0:l.manager,"_initialize() not called before _openPopup()");const a=await Eo(e,t,r,gs(),i);return Qh(e,a,Ds())}async _openRedirect(e,t,r,i){await this._originValidation(e);const a=await Eo(e,t,r,gs(),i);return ah(a),new Promise(()=>{})}_initialize(e){const t=e._key();if(this.eventManagers[t]){const{manager:i,promise:a}=this.eventManagers[t];return i?Promise.resolve(i):(Ke(a,"If manager is not set, promise should be"),a)}const r=this.initAndGetManager(e);return this.eventManagers[t]={promise:r},r.catch(()=>{delete this.eventManagers[t]}),r}async initAndGetManager(e){const t=await Wh(e),r=new kh(e);return t.register("authEvent",i=>(N(i==null?void 0:i.authEvent,e,"invalid-auth-event"),{status:r.onEvent(i.authEvent)?"ACK":"ERROR"}),gapi.iframes.CROSS_ORIGIN_IFRAMES_FILTER),this.eventManagers[e._key()]={manager:r},this.iframes[e._key()]=t,r}_isIframeWebStorageSupported(e,t){this.iframes[e._key()].send(os,{type:os},i=>{var l;const a=(l=i==null?void 0:i[0])==null?void 0:l[os];a!==void 0&&t(!!a),Ge(e,"internal-error")},gapi.iframes.CROSS_ORIGIN_IFRAMES_FILTER)}_originValidation(e){const t=e._key();return this.originValidationPromises[t]||(this.originValidationPromises[t]=Dh(e)),this.originValidationPromises[t]}get _shouldInitProactively(){return Ia()||ga()||Cs()}}const of=sf;var To="@firebase/auth",Ao="1.13.3";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class af{constructor(e){this.auth=e,this.internalListeners=new Map}getUid(){var e;return this.assertAuthConfigured(),((e=this.auth.currentUser)==null?void 0:e.uid)||null}async getToken(e){return this.assertAuthConfigured(),await this.auth._initializationPromise,this.auth.currentUser?{accessToken:await this.auth.currentUser.getIdToken(e)}:null}addAuthTokenListener(e){if(this.assertAuthConfigured(),this.internalListeners.has(e))return;const t=this.auth.onIdTokenChanged(r=>{e((r==null?void 0:r.stsTokenManager.accessToken)||null)});this.internalListeners.set(e,t),this.updateProactiveRefresh()}removeAuthTokenListener(e){this.assertAuthConfigured();const t=this.internalListeners.get(e);t&&(this.internalListeners.delete(e),t(),this.updateProactiveRefresh())}assertAuthConfigured(){N(this.auth._initializationPromise,"dependent-sdk-initialized-before-auth")}updateProactiveRefresh(){this.internalListeners.size>0?this.auth._startProactiveRefresh():this.auth._stopProactiveRefresh()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function uf(n){switch(n){case"Node":return"node";case"ReactNative":return"rn";case"Worker":return"webworker";case"Cordova":return"cordova";case"WebExtension":return"web-extension";default:return}}function lf(n){It(new ct("auth",(e,{options:t})=>{const r=e.getProvider("app").getImmediate(),i=e.getProvider("heartbeat"),a=e.getProvider("app-check-internal"),{apiKey:l,authDomain:h}=r.options;N(l&&!l.includes(":"),"invalid-api-key",{appName:r.name});const f={apiKey:l,authDomain:h,clientPlatform:n,apiHost:"identitytoolkit.googleapis.com",tokenApiHost:"securetoken.googleapis.com",apiScheme:"https",sdkClientVersion:Ea(n)},_=new Bc(r,i,a,f);return Wc(_,t),_},"PUBLIC").setInstantiationMode("EXPLICIT").setInstanceCreatedCallback((e,t,r)=>{e.getProvider("auth-internal").initialize()})),It(new ct("auth-internal",e=>{const t=xs(e.getProvider("auth").getImmediate());return(r=>new af(r))(t)},"PRIVATE").setInstantiationMode("EXPLICIT")),xe(To,Ao,uf(n)),xe(To,Ao,"esm2020")}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const cf=300,hf=na("authIdTokenMaxAge")||cf;let bo=null;const ff=n=>async e=>{const t=e&&await e.getIdTokenResult(),r=t&&(new Date().getTime()-Date.parse(t.issuedAtTime))/1e3;if(r&&r>hf)return;const i=t==null?void 0:t.token;bo!==i&&(bo=i,await fetch(n,{method:i?"POST":"DELETE",headers:i?{Authorization:`Bearer ${i}`}:{}}))};function Cg(n=Ps()){const e=Pr(n,"auth");if(e.isInitialized())return e.getImmediate();const t=zc(n,{popupRedirectResolver:of,persistence:[mh,sh,ka]}),r=na("authTokenSyncURL");if(r&&typeof isSecureContext=="boolean"&&isSecureContext){const a=new URL(r,location.origin);if(location.origin===a.origin){const l=ff(a.toString());th(t,l,()=>l(t.currentUser)),eh(t,h=>l(h))}}const i=Zo("auth");return i&&Gc(t,`http://${i}`),t}function df(){var n;return((n=document.getElementsByTagName("head"))==null?void 0:n[0])??document}jc({loadJS(n){return new Promise((e,t)=>{const r=document.createElement("script");r.setAttribute("src",n),r.onload=e,r.onerror=i=>{const a=Oe("internal-error");a.customData=i,t(a)},r.type="text/javascript",r.charset="UTF-8",df().appendChild(r)})},gapiScript:"https://apis.google.com/js/api.js",recaptchaV2Script:"https://www.google.com/recaptcha/api.js",recaptchaEnterpriseScript:"https://www.google.com/recaptcha/enterprise.js?render="});lf("Browser");var Ro=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};/** @license
Copyright The Closure Library Authors.
SPDX-License-Identifier: Apache-2.0
*/var Us;(function(){var n;/** @license

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/function e(w,d){function g(){}g.prototype=d.prototype,w.F=d.prototype,w.prototype=new g,w.prototype.constructor=w,w.D=function(v,y,E){for(var p=Array(arguments.length-2),he=2;he<arguments.length;he++)p[he-2]=arguments[he];return d.prototype[y].apply(v,p)}}function t(){this.blockSize=-1}function r(){this.blockSize=-1,this.blockSize=64,this.g=Array(4),this.C=Array(this.blockSize),this.o=this.h=0,this.u()}e(r,t),r.prototype.u=function(){this.g[0]=1732584193,this.g[1]=4023233417,this.g[2]=2562383102,this.g[3]=271733878,this.o=this.h=0};function i(w,d,g){g||(g=0);const v=Array(16);if(typeof d=="string")for(var y=0;y<16;++y)v[y]=d.charCodeAt(g++)|d.charCodeAt(g++)<<8|d.charCodeAt(g++)<<16|d.charCodeAt(g++)<<24;else for(y=0;y<16;++y)v[y]=d[g++]|d[g++]<<8|d[g++]<<16|d[g++]<<24;d=w.g[0],g=w.g[1],y=w.g[2];let E=w.g[3],p;p=d+(E^g&(y^E))+v[0]+3614090360&4294967295,d=g+(p<<7&4294967295|p>>>25),p=E+(y^d&(g^y))+v[1]+3905402710&4294967295,E=d+(p<<12&4294967295|p>>>20),p=y+(g^E&(d^g))+v[2]+606105819&4294967295,y=E+(p<<17&4294967295|p>>>15),p=g+(d^y&(E^d))+v[3]+3250441966&4294967295,g=y+(p<<22&4294967295|p>>>10),p=d+(E^g&(y^E))+v[4]+4118548399&4294967295,d=g+(p<<7&4294967295|p>>>25),p=E+(y^d&(g^y))+v[5]+1200080426&4294967295,E=d+(p<<12&4294967295|p>>>20),p=y+(g^E&(d^g))+v[6]+2821735955&4294967295,y=E+(p<<17&4294967295|p>>>15),p=g+(d^y&(E^d))+v[7]+4249261313&4294967295,g=y+(p<<22&4294967295|p>>>10),p=d+(E^g&(y^E))+v[8]+1770035416&4294967295,d=g+(p<<7&4294967295|p>>>25),p=E+(y^d&(g^y))+v[9]+2336552879&4294967295,E=d+(p<<12&4294967295|p>>>20),p=y+(g^E&(d^g))+v[10]+4294925233&4294967295,y=E+(p<<17&4294967295|p>>>15),p=g+(d^y&(E^d))+v[11]+2304563134&4294967295,g=y+(p<<22&4294967295|p>>>10),p=d+(E^g&(y^E))+v[12]+1804603682&4294967295,d=g+(p<<7&4294967295|p>>>25),p=E+(y^d&(g^y))+v[13]+4254626195&4294967295,E=d+(p<<12&4294967295|p>>>20),p=y+(g^E&(d^g))+v[14]+2792965006&4294967295,y=E+(p<<17&4294967295|p>>>15),p=g+(d^y&(E^d))+v[15]+1236535329&4294967295,g=y+(p<<22&4294967295|p>>>10),p=d+(y^E&(g^y))+v[1]+4129170786&4294967295,d=g+(p<<5&4294967295|p>>>27),p=E+(g^y&(d^g))+v[6]+3225465664&4294967295,E=d+(p<<9&4294967295|p>>>23),p=y+(d^g&(E^d))+v[11]+643717713&4294967295,y=E+(p<<14&4294967295|p>>>18),p=g+(E^d&(y^E))+v[0]+3921069994&4294967295,g=y+(p<<20&4294967295|p>>>12),p=d+(y^E&(g^y))+v[5]+3593408605&4294967295,d=g+(p<<5&4294967295|p>>>27),p=E+(g^y&(d^g))+v[10]+38016083&4294967295,E=d+(p<<9&4294967295|p>>>23),p=y+(d^g&(E^d))+v[15]+3634488961&4294967295,y=E+(p<<14&4294967295|p>>>18),p=g+(E^d&(y^E))+v[4]+3889429448&4294967295,g=y+(p<<20&4294967295|p>>>12),p=d+(y^E&(g^y))+v[9]+568446438&4294967295,d=g+(p<<5&4294967295|p>>>27),p=E+(g^y&(d^g))+v[14]+3275163606&4294967295,E=d+(p<<9&4294967295|p>>>23),p=y+(d^g&(E^d))+v[3]+4107603335&4294967295,y=E+(p<<14&4294967295|p>>>18),p=g+(E^d&(y^E))+v[8]+1163531501&4294967295,g=y+(p<<20&4294967295|p>>>12),p=d+(y^E&(g^y))+v[13]+2850285829&4294967295,d=g+(p<<5&4294967295|p>>>27),p=E+(g^y&(d^g))+v[2]+4243563512&4294967295,E=d+(p<<9&4294967295|p>>>23),p=y+(d^g&(E^d))+v[7]+1735328473&4294967295,y=E+(p<<14&4294967295|p>>>18),p=g+(E^d&(y^E))+v[12]+2368359562&4294967295,g=y+(p<<20&4294967295|p>>>12),p=d+(g^y^E)+v[5]+4294588738&4294967295,d=g+(p<<4&4294967295|p>>>28),p=E+(d^g^y)+v[8]+2272392833&4294967295,E=d+(p<<11&4294967295|p>>>21),p=y+(E^d^g)+v[11]+1839030562&4294967295,y=E+(p<<16&4294967295|p>>>16),p=g+(y^E^d)+v[14]+4259657740&4294967295,g=y+(p<<23&4294967295|p>>>9),p=d+(g^y^E)+v[1]+2763975236&4294967295,d=g+(p<<4&4294967295|p>>>28),p=E+(d^g^y)+v[4]+1272893353&4294967295,E=d+(p<<11&4294967295|p>>>21),p=y+(E^d^g)+v[7]+4139469664&4294967295,y=E+(p<<16&4294967295|p>>>16),p=g+(y^E^d)+v[10]+3200236656&4294967295,g=y+(p<<23&4294967295|p>>>9),p=d+(g^y^E)+v[13]+681279174&4294967295,d=g+(p<<4&4294967295|p>>>28),p=E+(d^g^y)+v[0]+3936430074&4294967295,E=d+(p<<11&4294967295|p>>>21),p=y+(E^d^g)+v[3]+3572445317&4294967295,y=E+(p<<16&4294967295|p>>>16),p=g+(y^E^d)+v[6]+76029189&4294967295,g=y+(p<<23&4294967295|p>>>9),p=d+(g^y^E)+v[9]+3654602809&4294967295,d=g+(p<<4&4294967295|p>>>28),p=E+(d^g^y)+v[12]+3873151461&4294967295,E=d+(p<<11&4294967295|p>>>21),p=y+(E^d^g)+v[15]+530742520&4294967295,y=E+(p<<16&4294967295|p>>>16),p=g+(y^E^d)+v[2]+3299628645&4294967295,g=y+(p<<23&4294967295|p>>>9),p=d+(y^(g|~E))+v[0]+4096336452&4294967295,d=g+(p<<6&4294967295|p>>>26),p=E+(g^(d|~y))+v[7]+1126891415&4294967295,E=d+(p<<10&4294967295|p>>>22),p=y+(d^(E|~g))+v[14]+2878612391&4294967295,y=E+(p<<15&4294967295|p>>>17),p=g+(E^(y|~d))+v[5]+4237533241&4294967295,g=y+(p<<21&4294967295|p>>>11),p=d+(y^(g|~E))+v[12]+1700485571&4294967295,d=g+(p<<6&4294967295|p>>>26),p=E+(g^(d|~y))+v[3]+2399980690&4294967295,E=d+(p<<10&4294967295|p>>>22),p=y+(d^(E|~g))+v[10]+4293915773&4294967295,y=E+(p<<15&4294967295|p>>>17),p=g+(E^(y|~d))+v[1]+2240044497&4294967295,g=y+(p<<21&4294967295|p>>>11),p=d+(y^(g|~E))+v[8]+1873313359&4294967295,d=g+(p<<6&4294967295|p>>>26),p=E+(g^(d|~y))+v[15]+4264355552&4294967295,E=d+(p<<10&4294967295|p>>>22),p=y+(d^(E|~g))+v[6]+2734768916&4294967295,y=E+(p<<15&4294967295|p>>>17),p=g+(E^(y|~d))+v[13]+1309151649&4294967295,g=y+(p<<21&4294967295|p>>>11),p=d+(y^(g|~E))+v[4]+4149444226&4294967295,d=g+(p<<6&4294967295|p>>>26),p=E+(g^(d|~y))+v[11]+3174756917&4294967295,E=d+(p<<10&4294967295|p>>>22),p=y+(d^(E|~g))+v[2]+718787259&4294967295,y=E+(p<<15&4294967295|p>>>17),p=g+(E^(y|~d))+v[9]+3951481745&4294967295,w.g[0]=w.g[0]+d&4294967295,w.g[1]=w.g[1]+(y+(p<<21&4294967295|p>>>11))&4294967295,w.g[2]=w.g[2]+y&4294967295,w.g[3]=w.g[3]+E&4294967295}r.prototype.v=function(w,d){d===void 0&&(d=w.length);const g=d-this.blockSize,v=this.C;let y=this.h,E=0;for(;E<d;){if(y==0)for(;E<=g;)i(this,w,E),E+=this.blockSize;if(typeof w=="string"){for(;E<d;)if(v[y++]=w.charCodeAt(E++),y==this.blockSize){i(this,v),y=0;break}}else for(;E<d;)if(v[y++]=w[E++],y==this.blockSize){i(this,v),y=0;break}}this.h=y,this.o+=d},r.prototype.A=function(){var w=Array((this.h<56?this.blockSize:this.blockSize*2)-this.h);w[0]=128;for(var d=1;d<w.length-8;++d)w[d]=0;d=this.o*8;for(var g=w.length-8;g<w.length;++g)w[g]=d&255,d/=256;for(this.v(w),w=Array(16),d=0,g=0;g<4;++g)for(let v=0;v<32;v+=8)w[d++]=this.g[g]>>>v&255;return w};function a(w,d){var g=h;return Object.prototype.hasOwnProperty.call(g,w)?g[w]:g[w]=d(w)}function l(w,d){this.h=d;const g=[];let v=!0;for(let y=w.length-1;y>=0;y--){const E=w[y]|0;v&&E==d||(g[y]=E,v=!1)}this.g=g}var h={};function f(w){return-128<=w&&w<128?a(w,function(d){return new l([d|0],d<0?-1:0)}):new l([w|0],w<0?-1:0)}function _(w){if(isNaN(w)||!isFinite(w))return R;if(w<0)return D(_(-w));const d=[];let g=1;for(let v=0;w>=g;v++)d[v]=w/g|0,g*=4294967296;return new l(d,0)}function b(w,d){if(w.length==0)throw Error("number format error: empty string");if(d=d||10,d<2||36<d)throw Error("radix out of range: "+d);if(w.charAt(0)=="-")return D(b(w.substring(1),d));if(w.indexOf("-")>=0)throw Error('number format error: interior "-" character');const g=_(Math.pow(d,8));let v=R;for(let E=0;E<w.length;E+=8){var y=Math.min(8,w.length-E);const p=parseInt(w.substring(E,E+y),d);y<8?(y=_(Math.pow(d,y)),v=v.j(y).add(_(p))):(v=v.j(g),v=v.add(_(p)))}return v}var R=f(0),V=f(1),x=f(16777216);n=l.prototype,n.m=function(){if(B(this))return-D(this).m();let w=0,d=1;for(let g=0;g<this.g.length;g++){const v=this.i(g);w+=(v>=0?v:4294967296+v)*d,d*=4294967296}return w},n.toString=function(w){if(w=w||10,w<2||36<w)throw Error("radix out of range: "+w);if(O(this))return"0";if(B(this))return"-"+D(this).toString(w);const d=_(Math.pow(w,6));var g=this;let v="";for(;;){const y=Y(g,d).g;g=J(g,y.j(d));let E=((g.g.length>0?g.g[0]:g.h)>>>0).toString(w);if(g=y,O(g))return E+v;for(;E.length<6;)E="0"+E;v=E+v}},n.i=function(w){return w<0?0:w<this.g.length?this.g[w]:this.h};function O(w){if(w.h!=0)return!1;for(let d=0;d<w.g.length;d++)if(w.g[d]!=0)return!1;return!0}function B(w){return w.h==-1}n.l=function(w){return w=J(this,w),B(w)?-1:O(w)?0:1};function D(w){const d=w.g.length,g=[];for(let v=0;v<d;v++)g[v]=~w.g[v];return new l(g,~w.h).add(V)}n.abs=function(){return B(this)?D(this):this},n.add=function(w){const d=Math.max(this.g.length,w.g.length),g=[];let v=0;for(let y=0;y<=d;y++){let E=v+(this.i(y)&65535)+(w.i(y)&65535),p=(E>>>16)+(this.i(y)>>>16)+(w.i(y)>>>16);v=p>>>16,E&=65535,p&=65535,g[y]=p<<16|E}return new l(g,g[g.length-1]&-2147483648?-1:0)};function J(w,d){return w.add(D(d))}n.j=function(w){if(O(this)||O(w))return R;if(B(this))return B(w)?D(this).j(D(w)):D(D(this).j(w));if(B(w))return D(this.j(D(w)));if(this.l(x)<0&&w.l(x)<0)return _(this.m()*w.m());const d=this.g.length+w.g.length,g=[];for(var v=0;v<2*d;v++)g[v]=0;for(v=0;v<this.g.length;v++)for(let y=0;y<w.g.length;y++){const E=this.i(v)>>>16,p=this.i(v)&65535,he=w.i(y)>>>16,ft=w.i(y)&65535;g[2*v+2*y]+=p*ft,ye(g,2*v+2*y),g[2*v+2*y+1]+=E*ft,ye(g,2*v+2*y+1),g[2*v+2*y+1]+=p*he,ye(g,2*v+2*y+1),g[2*v+2*y+2]+=E*he,ye(g,2*v+2*y+2)}for(w=0;w<d;w++)g[w]=g[2*w+1]<<16|g[2*w];for(w=d;w<2*d;w++)g[w]=0;return new l(g,0)};function ye(w,d){for(;(w[d]&65535)!=w[d];)w[d+1]+=w[d]>>>16,w[d]&=65535,d++}function oe(w,d){this.g=w,this.h=d}function Y(w,d){if(O(d))throw Error("division by zero");if(O(w))return new oe(R,R);if(B(w))return d=Y(D(w),d),new oe(D(d.g),D(d.h));if(B(d))return d=Y(w,D(d)),new oe(D(d.g),d.h);if(w.g.length>30){if(B(w)||B(d))throw Error("slowDivide_ only works with positive integers.");for(var g=V,v=d;v.l(w)<=0;)g=fe(g),v=fe(v);var y=re(g,1),E=re(v,1);for(v=re(v,2),g=re(g,2);!O(v);){var p=E.add(v);p.l(w)<=0&&(y=y.add(g),E=p),v=re(v,1),g=re(g,1)}return d=J(w,y.j(d)),new oe(y,d)}for(y=R;w.l(d)>=0;){for(g=Math.max(1,Math.floor(w.m()/d.m())),v=Math.ceil(Math.log(g)/Math.LN2),v=v<=48?1:Math.pow(2,v-48),E=_(g),p=E.j(d);B(p)||p.l(w)>0;)g-=v,E=_(g),p=E.j(d);O(E)&&(E=V),y=y.add(E),w=J(w,p)}return new oe(y,w)}n.B=function(w){return Y(this,w).h},n.and=function(w){const d=Math.max(this.g.length,w.g.length),g=[];for(let v=0;v<d;v++)g[v]=this.i(v)&w.i(v);return new l(g,this.h&w.h)},n.or=function(w){const d=Math.max(this.g.length,w.g.length),g=[];for(let v=0;v<d;v++)g[v]=this.i(v)|w.i(v);return new l(g,this.h|w.h)},n.xor=function(w){const d=Math.max(this.g.length,w.g.length),g=[];for(let v=0;v<d;v++)g[v]=this.i(v)^w.i(v);return new l(g,this.h^w.h)};function fe(w){const d=w.g.length+1,g=[];for(let v=0;v<d;v++)g[v]=w.i(v)<<1|w.i(v-1)>>>31;return new l(g,w.h)}function re(w,d){const g=d>>5;d%=32;const v=w.g.length-g,y=[];for(let E=0;E<v;E++)y[E]=d>0?w.i(E+g)>>>d|w.i(E+g+1)<<32-d:w.i(E+g);return new l(y,w.h)}r.prototype.digest=r.prototype.A,r.prototype.reset=r.prototype.u,r.prototype.update=r.prototype.v,l.prototype.add=l.prototype.add,l.prototype.multiply=l.prototype.j,l.prototype.modulo=l.prototype.B,l.prototype.compare=l.prototype.l,l.prototype.toNumber=l.prototype.m,l.prototype.toString=l.prototype.toString,l.prototype.getBits=l.prototype.i,l.fromNumber=_,l.fromString=b,Us=l}).apply(typeof Ro<"u"?Ro:typeof self<"u"?self:typeof window<"u"?window:{});var Xn=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};(function(){var n,e=Object.defineProperty;function t(s){s=[typeof globalThis=="object"&&globalThis,s,typeof window=="object"&&window,typeof self=="object"&&self,typeof Xn=="object"&&Xn];for(var o=0;o<s.length;++o){var u=s[o];if(u&&u.Math==Math)return u}throw Error("Cannot find global object")}var r=t(this);function i(s,o){if(o)e:{var u=r;s=s.split(".");for(var c=0;c<s.length-1;c++){var I=s[c];if(!(I in u))break e;u=u[I]}s=s[s.length-1],c=u[s],o=o(c),o!=c&&o!=null&&e(u,s,{configurable:!0,writable:!0,value:o})}}i("Symbol.dispose",function(s){return s||Symbol("Symbol.dispose")}),i("Array.prototype.values",function(s){return s||function(){return this[Symbol.iterator]()}}),i("Object.entries",function(s){return s||function(o){var u=[],c;for(c in o)Object.prototype.hasOwnProperty.call(o,c)&&u.push([c,o[c]]);return u}});/** @license

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/var a=a||{},l=this||self;function h(s){var o=typeof s;return o=="object"&&s!=null||o=="function"}function f(s,o,u){return s.call.apply(s.bind,arguments)}function _(s,o,u){return _=f,_.apply(null,arguments)}function b(s,o){var u=Array.prototype.slice.call(arguments,1);return function(){var c=u.slice();return c.push.apply(c,arguments),s.apply(this,c)}}function R(s,o){function u(){}u.prototype=o.prototype,s.Z=o.prototype,s.prototype=new u,s.prototype.constructor=s,s.Ob=function(c,I,T){for(var S=Array(arguments.length-2),C=2;C<arguments.length;C++)S[C-2]=arguments[C];return o.prototype[I].apply(c,S)}}var V=typeof AsyncContext<"u"&&typeof AsyncContext.Snapshot=="function"?s=>s&&AsyncContext.Snapshot.wrap(s):s=>s;function x(s){const o=s.length;if(o>0){const u=Array(o);for(let c=0;c<o;c++)u[c]=s[c];return u}return[]}function O(s,o){for(let c=1;c<arguments.length;c++){const I=arguments[c];var u=typeof I;if(u=u!="object"?u:I?Array.isArray(I)?"array":u:"null",u=="array"||u=="object"&&typeof I.length=="number"){u=s.length||0;const T=I.length||0;s.length=u+T;for(let S=0;S<T;S++)s[u+S]=I[S]}else s.push(I)}}class B{constructor(o,u){this.i=o,this.j=u,this.h=0,this.g=null}get(){let o;return this.h>0?(this.h--,o=this.g,this.g=o.next,o.next=null):o=this.i(),o}}function D(s){l.setTimeout(()=>{throw s},0)}function J(){var s=w;let o=null;return s.g&&(o=s.g,s.g=s.g.next,s.g||(s.h=null),o.next=null),o}class ye{constructor(){this.h=this.g=null}add(o,u){const c=oe.get();c.set(o,u),this.h?this.h.next=c:this.g=c,this.h=c}}var oe=new B(()=>new Y,s=>s.reset());class Y{constructor(){this.next=this.g=this.h=null}set(o,u){this.h=o,this.g=u,this.next=null}reset(){this.next=this.g=this.h=null}}let fe,re=!1,w=new ye,d=()=>{const s=Promise.resolve(void 0);fe=()=>{s.then(g)}};function g(){for(var s;s=J();){try{s.h.call(s.g)}catch(u){D(u)}var o=oe;o.j(s),o.h<100&&(o.h++,s.next=o.g,o.g=s)}re=!1}function v(){this.u=this.u,this.C=this.C}v.prototype.u=!1,v.prototype.dispose=function(){this.u||(this.u=!0,this.N())},v.prototype[Symbol.dispose]=function(){this.dispose()},v.prototype.N=function(){if(this.C)for(;this.C.length;)this.C.shift()()};function y(s,o){this.type=s,this.g=this.target=o,this.defaultPrevented=!1}y.prototype.h=function(){this.defaultPrevented=!0};var E=(function(){if(!l.addEventListener||!Object.defineProperty)return!1;var s=!1,o=Object.defineProperty({},"passive",{get:function(){s=!0}});try{const u=()=>{};l.addEventListener("test",u,o),l.removeEventListener("test",u,o)}catch{}return s})();function p(s){return/^[\s\xa0]*$/.test(s)}function he(s,o){y.call(this,s?s.type:""),this.relatedTarget=this.g=this.target=null,this.button=this.screenY=this.screenX=this.clientY=this.clientX=0,this.key="",this.metaKey=this.shiftKey=this.altKey=this.ctrlKey=!1,this.state=null,this.pointerId=0,this.pointerType="",this.i=null,s&&this.init(s,o)}R(he,y),he.prototype.init=function(s,o){const u=this.type=s.type,c=s.changedTouches&&s.changedTouches.length?s.changedTouches[0]:null;this.target=s.target||s.srcElement,this.g=o,o=s.relatedTarget,o||(u=="mouseover"?o=s.fromElement:u=="mouseout"&&(o=s.toElement)),this.relatedTarget=o,c?(this.clientX=c.clientX!==void 0?c.clientX:c.pageX,this.clientY=c.clientY!==void 0?c.clientY:c.pageY,this.screenX=c.screenX||0,this.screenY=c.screenY||0):(this.clientX=s.clientX!==void 0?s.clientX:s.pageX,this.clientY=s.clientY!==void 0?s.clientY:s.pageY,this.screenX=s.screenX||0,this.screenY=s.screenY||0),this.button=s.button,this.key=s.key||"",this.ctrlKey=s.ctrlKey,this.altKey=s.altKey,this.shiftKey=s.shiftKey,this.metaKey=s.metaKey,this.pointerId=s.pointerId||0,this.pointerType=s.pointerType,this.state=s.state,this.i=s,s.defaultPrevented&&he.Z.h.call(this)},he.prototype.h=function(){he.Z.h.call(this);const s=this.i;s.preventDefault?s.preventDefault():s.returnValue=!1};var ft="closure_listenable_"+(Math.random()*1e6|0),fu=0;function du(s,o,u,c,I){this.listener=s,this.proxy=null,this.src=o,this.type=u,this.capture=!!c,this.ha=I,this.key=++fu,this.da=this.fa=!1}function Mn(s){s.da=!0,s.listener=null,s.proxy=null,s.src=null,s.ha=null}function Fn(s,o,u){for(const c in s)o.call(u,s[c],c,s)}function pu(s,o){for(const u in s)o.call(void 0,s[u],u,s)}function ni(s){const o={};for(const u in s)o[u]=s[u];return o}const ri="constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" ");function si(s,o){let u,c;for(let I=1;I<arguments.length;I++){c=arguments[I];for(u in c)s[u]=c[u];for(let T=0;T<ri.length;T++)u=ri[T],Object.prototype.hasOwnProperty.call(c,u)&&(s[u]=c[u])}}function Bn(s){this.src=s,this.g={},this.h=0}Bn.prototype.add=function(s,o,u,c,I){const T=s.toString();s=this.g[T],s||(s=this.g[T]=[],this.h++);const S=Cr(s,o,c,I);return S>-1?(o=s[S],u||(o.fa=!1)):(o=new du(o,this.src,T,!!c,I),o.fa=u,s.push(o)),o};function Nr(s,o){const u=o.type;if(u in s.g){var c=s.g[u],I=Array.prototype.indexOf.call(c,o,void 0),T;(T=I>=0)&&Array.prototype.splice.call(c,I,1),T&&(Mn(o),s.g[u].length==0&&(delete s.g[u],s.h--))}}function Cr(s,o,u,c){for(let I=0;I<s.length;++I){const T=s[I];if(!T.da&&T.listener==o&&T.capture==!!u&&T.ha==c)return I}return-1}var xr="closure_lm_"+(Math.random()*1e6|0),Or={};function ii(s,o,u,c,I){if(Array.isArray(o)){for(let T=0;T<o.length;T++)ii(s,o[T],u,c,I);return null}return u=ui(u),s&&s[ft]?s.J(o,u,h(c)?!!c.capture:!1,I):gu(s,o,u,!1,c,I)}function gu(s,o,u,c,I,T){if(!o)throw Error("Invalid event type");const S=h(I)?!!I.capture:!!I;let C=Lr(s);if(C||(s[xr]=C=new Bn(s)),u=C.add(o,u,c,S,T),u.proxy)return u;if(c=mu(),u.proxy=c,c.src=s,c.listener=u,s.addEventListener)E||(I=S),I===void 0&&(I=!1),s.addEventListener(o.toString(),c,I);else if(s.attachEvent)s.attachEvent(ai(o.toString()),c);else if(s.addListener&&s.removeListener)s.addListener(c);else throw Error("addEventListener and attachEvent are unavailable.");return u}function mu(){function s(u){return o.call(s.src,s.listener,u)}const o=_u;return s}function oi(s,o,u,c,I){if(Array.isArray(o))for(var T=0;T<o.length;T++)oi(s,o[T],u,c,I);else c=h(c)?!!c.capture:!!c,u=ui(u),s&&s[ft]?(s=s.i,T=String(o).toString(),T in s.g&&(o=s.g[T],u=Cr(o,u,c,I),u>-1&&(Mn(o[u]),Array.prototype.splice.call(o,u,1),o.length==0&&(delete s.g[T],s.h--)))):s&&(s=Lr(s))&&(o=s.g[o.toString()],s=-1,o&&(s=Cr(o,u,c,I)),(u=s>-1?o[s]:null)&&Dr(u))}function Dr(s){if(typeof s!="number"&&s&&!s.da){var o=s.src;if(o&&o[ft])Nr(o.i,s);else{var u=s.type,c=s.proxy;o.removeEventListener?o.removeEventListener(u,c,s.capture):o.detachEvent?o.detachEvent(ai(u),c):o.addListener&&o.removeListener&&o.removeListener(c),(u=Lr(o))?(Nr(u,s),u.h==0&&(u.src=null,o[xr]=null)):Mn(s)}}}function ai(s){return s in Or?Or[s]:Or[s]="on"+s}function _u(s,o){if(s.da)s=!0;else{o=new he(o,this);const u=s.listener,c=s.ha||s.src;s.fa&&Dr(s),s=u.call(c,o)}return s}function Lr(s){return s=s[xr],s instanceof Bn?s:null}var Ur="__closure_events_fn_"+(Math.random()*1e9>>>0);function ui(s){return typeof s=="function"?s:(s[Ur]||(s[Ur]=function(o){return s.handleEvent(o)}),s[Ur])}function se(){v.call(this),this.i=new Bn(this),this.M=this,this.G=null}R(se,v),se.prototype[ft]=!0,se.prototype.removeEventListener=function(s,o,u,c){oi(this,s,o,u,c)};function ae(s,o){var u,c=s.G;if(c)for(u=[];c;c=c.G)u.push(c);if(s=s.M,c=o.type||o,typeof o=="string")o=new y(o,s);else if(o instanceof y)o.target=o.target||s;else{var I=o;o=new y(c,s),si(o,I)}I=!0;let T,S;if(u)for(S=u.length-1;S>=0;S--)T=o.g=u[S],I=jn(T,c,!0,o)&&I;if(T=o.g=s,I=jn(T,c,!0,o)&&I,I=jn(T,c,!1,o)&&I,u)for(S=0;S<u.length;S++)T=o.g=u[S],I=jn(T,c,!1,o)&&I}se.prototype.N=function(){if(se.Z.N.call(this),this.i){var s=this.i;for(const o in s.g){const u=s.g[o];for(let c=0;c<u.length;c++)Mn(u[c]);delete s.g[o],s.h--}}this.G=null},se.prototype.J=function(s,o,u,c){return this.i.add(String(s),o,!1,u,c)},se.prototype.K=function(s,o,u,c){return this.i.add(String(s),o,!0,u,c)};function jn(s,o,u,c){if(o=s.i.g[String(o)],!o)return!0;o=o.concat();let I=!0;for(let T=0;T<o.length;++T){const S=o[T];if(S&&!S.da&&S.capture==u){const C=S.listener,K=S.ha||S.src;S.fa&&Nr(s.i,S),I=C.call(K,c)!==!1&&I}}return I&&!c.defaultPrevented}function yu(s,o){if(typeof s!="function")if(s&&typeof s.handleEvent=="function")s=_(s.handleEvent,s);else throw Error("Invalid listener argument");return Number(o)>2147483647?-1:l.setTimeout(s,o||0)}function li(s){s.g=yu(()=>{s.g=null,s.i&&(s.i=!1,li(s))},s.l);const o=s.h;s.h=null,s.m.apply(null,o)}class wu extends v{constructor(o,u){super(),this.m=o,this.l=u,this.h=null,this.i=!1,this.g=null}j(o){this.h=arguments,this.g?this.i=!0:li(this)}N(){super.N(),this.g&&(l.clearTimeout(this.g),this.g=null,this.i=!1,this.h=null)}}function qt(s){v.call(this),this.h=s,this.g={}}R(qt,v);var ci=[];function hi(s){Fn(s.g,function(o,u){this.g.hasOwnProperty(u)&&Dr(o)},s),s.g={}}qt.prototype.N=function(){qt.Z.N.call(this),hi(this)},qt.prototype.handleEvent=function(){throw Error("EventHandler.handleEvent not implemented")};var Mr=l.JSON.stringify,vu=l.JSON.parse,Iu=class{stringify(s){return l.JSON.stringify(s,void 0)}parse(s){return l.JSON.parse(s,void 0)}};function fi(){}function Eu(){}var zt={OPEN:"a",hb:"b",ERROR:"c",tb:"d"};function Fr(){y.call(this,"d")}R(Fr,y);function Br(){y.call(this,"c")}R(Br,y);var Rt={},di=null;function jr(){return di=di||new se}Rt.Ia="serverreachability";function pi(s){y.call(this,Rt.Ia,s)}R(pi,y);function Wt(s){const o=jr();ae(o,new pi(o))}Rt.STAT_EVENT="statevent";function gi(s,o){y.call(this,Rt.STAT_EVENT,s),this.stat=o}R(gi,y);function ue(s){const o=jr();ae(o,new gi(o,s))}Rt.Ja="timingevent";function mi(s,o){y.call(this,Rt.Ja,s),this.size=o}R(mi,y);function Gt(s,o){if(typeof s!="function")throw Error("Fn must not be null and must be a function");return l.setTimeout(function(){s()},o)}function Kt(){this.g=!0}Kt.prototype.ua=function(){this.g=!1};function Tu(s,o,u,c,I,T){s.info(function(){if(s.g)if(T){var S="",C=T.split("&");for(let $=0;$<C.length;$++){var K=C[$].split("=");if(K.length>1){const X=K[0];K=K[1];const Ne=X.split("_");S=Ne.length>=2&&Ne[1]=="type"?S+(X+"="+K+"&"):S+(X+"=redacted&")}}}else S=null;else S=T;return"XMLHTTP REQ ("+c+") [attempt "+I+"]: "+o+`
`+u+`
`+S})}function Au(s,o,u,c,I,T,S){s.info(function(){return"XMLHTTP RESP ("+c+") [ attempt "+I+"]: "+o+`
`+u+`
`+T+" "+S})}function Pt(s,o,u,c){s.info(function(){return"XMLHTTP TEXT ("+o+"): "+Ru(s,u)+(c?" "+c:"")})}function bu(s,o){s.info(function(){return"TIMEOUT: "+o})}Kt.prototype.info=function(){};function Ru(s,o){if(!s.g)return o;if(!o)return null;try{const T=JSON.parse(o);if(T){for(s=0;s<T.length;s++)if(Array.isArray(T[s])){var u=T[s];if(!(u.length<2)){var c=u[1];if(Array.isArray(c)&&!(c.length<1)){var I=c[0];if(I!="noop"&&I!="stop"&&I!="close")for(let S=1;S<c.length;S++)c[S]=""}}}}return Mr(T)}catch{return o}}var $r={NO_ERROR:0,TIMEOUT:8},Pu={},_i;function Hr(){}R(Hr,fi),Hr.prototype.g=function(){return new XMLHttpRequest},_i=new Hr;function Jt(s){return encodeURIComponent(String(s))}function Su(s){var o=1;s=s.split(":");const u=[];for(;o>0&&s.length;)u.push(s.shift()),o--;return s.length&&u.push(s.join(":")),u}function Ye(s,o,u,c){this.j=s,this.i=o,this.l=u,this.S=c||1,this.V=new qt(this),this.H=45e3,this.J=null,this.o=!1,this.u=this.B=this.A=this.M=this.F=this.T=this.D=null,this.G=[],this.g=null,this.C=0,this.m=this.v=null,this.X=-1,this.K=!1,this.P=0,this.O=null,this.W=this.L=this.U=this.R=!1,this.h=new yi}function yi(){this.i=null,this.g="",this.h=!1}var wi={},qr={};function zr(s,o,u){s.M=1,s.A=Hn(ke(o)),s.u=u,s.R=!0,vi(s,null)}function vi(s,o){s.F=Date.now(),$n(s),s.B=ke(s.A);var u=s.B,c=s.S;Array.isArray(c)||(c=[String(c)]),xi(u.i,"t",c),s.C=0,u=s.j.L,s.h=new yi,s.g=Xi(s.j,u?o:null,!s.u),s.P>0&&(s.O=new wu(_(s.Y,s,s.g),s.P)),o=s.V,u=s.g,c=s.ba;var I="readystatechange";Array.isArray(I)||(I&&(ci[0]=I.toString()),I=ci);for(let T=0;T<I.length;T++){const S=ii(u,I[T],c||o.handleEvent,!1,o.h||o);if(!S)break;o.g[S.key]=S}o=s.J?ni(s.J):{},s.u?(s.v||(s.v="POST"),o["Content-Type"]="application/x-www-form-urlencoded",s.g.ea(s.B,s.v,s.u,o)):(s.v="GET",s.g.ea(s.B,s.v,null,o)),Wt(),Tu(s.i,s.v,s.B,s.l,s.S,s.u)}Ye.prototype.ba=function(s){s=s.target;const o=this.O;o&&Ze(s)==3?o.j():this.Y(s)},Ye.prototype.Y=function(s){try{if(s==this.g)e:{const C=Ze(this.g),K=this.g.ya(),$=this.g.ca();if(!(C<3)&&(C!=3||this.g&&(this.h.h||this.g.la()||Bi(this.g)))){this.K||C!=4||K==7||(K==8||$<=0?Wt(3):Wt(2)),Wr(this);var o=this.g.ca();this.X=o;var u=Vu(this);if(this.o=o==200,Au(this.i,this.v,this.B,this.l,this.S,C,o),this.o){if(this.U&&!this.L){t:{if(this.g){var c,I=this.g;if((c=I.g?I.g.getResponseHeader("X-HTTP-Initial-Response"):null)&&!p(c)){var T=c;break t}}T=null}if(s=T)Pt(this.i,this.l,s,"Initial handshake response via X-HTTP-Initial-Response"),this.L=!0,Gr(this,s);else{this.o=!1,this.m=3,ue(12),dt(this),Yt(this);break e}}if(this.R){s=!0;let X;for(;!this.K&&this.C<u.length;)if(X=ku(this,u),X==qr){C==4&&(this.m=4,ue(14),s=!1),Pt(this.i,this.l,null,"[Incomplete Response]");break}else if(X==wi){this.m=4,ue(15),Pt(this.i,this.l,u,"[Invalid Chunk]"),s=!1;break}else Pt(this.i,this.l,X,null),Gr(this,X);if(Ii(this)&&this.C!=0&&(this.h.g=this.h.g.slice(this.C),this.C=0),C!=4||u.length!=0||this.h.h||(this.m=1,ue(16),s=!1),this.o=this.o&&s,!s)Pt(this.i,this.l,u,"[Invalid Chunked Response]"),dt(this),Yt(this);else if(u.length>0&&!this.W){this.W=!0;var S=this.j;S.g==this&&S.aa&&!S.P&&(S.j.info("Great, no buffering proxy detected. Bytes received: "+u.length),ts(S),S.P=!0,ue(11))}}else Pt(this.i,this.l,u,null),Gr(this,u);C==4&&dt(this),this.o&&!this.K&&(C==4?Gi(this.j,this):(this.o=!1,$n(this)))}else qu(this.g),o==400&&u.indexOf("Unknown SID")>0?(this.m=3,ue(12)):(this.m=0,ue(13)),dt(this),Yt(this)}}}catch{}finally{}};function Vu(s){if(!Ii(s))return s.g.la();const o=Bi(s.g);if(o==="")return"";let u="";const c=o.length,I=Ze(s.g)==4;if(!s.h.i){if(typeof TextDecoder>"u")return dt(s),Yt(s),"";s.h.i=new l.TextDecoder}for(let T=0;T<c;T++)s.h.h=!0,u+=s.h.i.decode(o[T],{stream:!(I&&T==c-1)});return o.length=0,s.h.g+=u,s.C=0,s.h.g}function Ii(s){return s.g?s.v=="GET"&&s.M!=2&&s.j.Aa:!1}function ku(s,o){var u=s.C,c=o.indexOf(`
`,u);return c==-1?qr:(u=Number(o.substring(u,c)),isNaN(u)?wi:(c+=1,c+u>o.length?qr:(o=o.slice(c,c+u),s.C=c+u,o)))}Ye.prototype.cancel=function(){this.K=!0,dt(this)};function $n(s){s.T=Date.now()+s.H,Ei(s,s.H)}function Ei(s,o){if(s.D!=null)throw Error("WatchDog timer not null");s.D=Gt(_(s.aa,s),o)}function Wr(s){s.D&&(l.clearTimeout(s.D),s.D=null)}Ye.prototype.aa=function(){this.D=null;const s=Date.now();s-this.T>=0?(bu(this.i,this.B),this.M!=2&&(Wt(),ue(17)),dt(this),this.m=2,Yt(this)):Ei(this,this.T-s)};function Yt(s){s.j.I==0||s.K||Gi(s.j,s)}function dt(s){Wr(s);var o=s.O;o&&typeof o.dispose=="function"&&o.dispose(),s.O=null,hi(s.V),s.g&&(o=s.g,s.g=null,o.abort(),o.dispose())}function Gr(s,o){try{var u=s.j;if(u.I!=0&&(u.g==s||Kr(u.h,s))){if(!s.L&&Kr(u.h,s)&&u.I==3){try{var c=u.Ba.g.parse(o)}catch{c=null}if(Array.isArray(c)&&c.length==3){var I=c;if(I[0]==0){e:if(!u.v){if(u.g)if(u.g.F+3e3<s.F)Kn(u),Wn(u);else break e;es(u),ue(18)}}else u.xa=I[1],0<u.xa-u.K&&I[2]<37500&&u.F&&u.A==0&&!u.C&&(u.C=Gt(_(u.Va,u),6e3));bi(u.h)<=1&&u.ta&&(u.ta=void 0)}else gt(u,11)}else if((s.L||u.g==s)&&Kn(u),!p(o))for(I=u.Ba.g.parse(o),o=0;o<I.length;o++){let $=I[o];const X=$[0];if(!(X<=u.K))if(u.K=X,$=$[1],u.I==2)if($[0]=="c"){u.M=$[1],u.ba=$[2];const Ne=$[3];Ne!=null&&(u.ka=Ne,u.j.info("VER="+u.ka));const mt=$[4];mt!=null&&(u.za=mt,u.j.info("SVER="+u.za));const et=$[5];et!=null&&typeof et=="number"&&et>0&&(c=1.5*et,u.O=c,u.j.info("backChannelRequestTimeoutMs_="+c)),c=u;const tt=s.g;if(tt){const Jn=tt.g?tt.g.getResponseHeader("X-Client-Wire-Protocol"):null;if(Jn){var T=c.h;T.g||Jn.indexOf("spdy")==-1&&Jn.indexOf("quic")==-1&&Jn.indexOf("h2")==-1||(T.j=T.l,T.g=new Set,T.h&&(Jr(T,T.h),T.h=null))}if(c.G){const ns=tt.g?tt.g.getResponseHeader("X-HTTP-Session-Id"):null;ns&&(c.wa=ns,H(c.J,c.G,ns))}}u.I=3,u.l&&u.l.ra(),u.aa&&(u.T=Date.now()-s.F,u.j.info("Handshake RTT: "+u.T+"ms")),c=u;var S=s;if(c.na=Yi(c,c.L?c.ba:null,c.W),S.L){Ri(c.h,S);var C=S,K=c.O;K&&(C.H=K),C.D&&(Wr(C),$n(C)),c.g=S}else zi(c);u.i.length>0&&Gn(u)}else $[0]!="stop"&&$[0]!="close"||gt(u,7);else u.I==3&&($[0]=="stop"||$[0]=="close"?$[0]=="stop"?gt(u,7):Zr(u):$[0]!="noop"&&u.l&&u.l.qa($),u.A=0)}}Wt(4)}catch{}}var Nu=class{constructor(s,o){this.g=s,this.map=o}};function Ti(s){this.l=s||10,l.PerformanceNavigationTiming?(s=l.performance.getEntriesByType("navigation"),s=s.length>0&&(s[0].nextHopProtocol=="hq"||s[0].nextHopProtocol=="h2")):s=!!(l.chrome&&l.chrome.loadTimes&&l.chrome.loadTimes()&&l.chrome.loadTimes().wasFetchedViaSpdy),this.j=s?this.l:1,this.g=null,this.j>1&&(this.g=new Set),this.h=null,this.i=[]}function Ai(s){return s.h?!0:s.g?s.g.size>=s.j:!1}function bi(s){return s.h?1:s.g?s.g.size:0}function Kr(s,o){return s.h?s.h==o:s.g?s.g.has(o):!1}function Jr(s,o){s.g?s.g.add(o):s.h=o}function Ri(s,o){s.h&&s.h==o?s.h=null:s.g&&s.g.has(o)&&s.g.delete(o)}Ti.prototype.cancel=function(){if(this.i=Pi(this),this.h)this.h.cancel(),this.h=null;else if(this.g&&this.g.size!==0){for(const s of this.g.values())s.cancel();this.g.clear()}};function Pi(s){if(s.h!=null)return s.i.concat(s.h.G);if(s.g!=null&&s.g.size!==0){let o=s.i;for(const u of s.g.values())o=o.concat(u.G);return o}return x(s.i)}var Si=RegExp("^(?:([^:/?#.]+):)?(?://(?:([^\\\\/?#]*)@)?([^\\\\/?#]*?)(?::([0-9]+))?(?=[\\\\/?#]|$))?([^?#]+)?(?:\\?([^#]*))?(?:#([\\s\\S]*))?$");function Cu(s,o){if(s){s=s.split("&");for(let u=0;u<s.length;u++){const c=s[u].indexOf("=");let I,T=null;c>=0?(I=s[u].substring(0,c),T=s[u].substring(c+1)):I=s[u],o(I,T?decodeURIComponent(T.replace(/\+/g," ")):"")}}}function Xe(s){this.g=this.o=this.j="",this.u=null,this.m=this.h="",this.l=!1;let o;s instanceof Xe?(this.l=s.l,Xt(this,s.j),this.o=s.o,this.g=s.g,Qt(this,s.u),this.h=s.h,Yr(this,Oi(s.i)),this.m=s.m):s&&(o=String(s).match(Si))?(this.l=!1,Xt(this,o[1]||"",!0),this.o=Zt(o[2]||""),this.g=Zt(o[3]||"",!0),Qt(this,o[4]),this.h=Zt(o[5]||"",!0),Yr(this,o[6]||"",!0),this.m=Zt(o[7]||"")):(this.l=!1,this.i=new tn(null,this.l))}Xe.prototype.toString=function(){const s=[];var o=this.j;o&&s.push(en(o,Vi,!0),":");var u=this.g;return(u||o=="file")&&(s.push("//"),(o=this.o)&&s.push(en(o,Vi,!0),"@"),s.push(Jt(u).replace(/%25([0-9a-fA-F]{2})/g,"%$1")),u=this.u,u!=null&&s.push(":",String(u))),(u=this.h)&&(this.g&&u.charAt(0)!="/"&&s.push("/"),s.push(en(u,u.charAt(0)=="/"?Du:Ou,!0))),(u=this.i.toString())&&s.push("?",u),(u=this.m)&&s.push("#",en(u,Uu)),s.join("")},Xe.prototype.resolve=function(s){const o=ke(this);let u=!!s.j;u?Xt(o,s.j):u=!!s.o,u?o.o=s.o:u=!!s.g,u?o.g=s.g:u=s.u!=null;var c=s.h;if(u)Qt(o,s.u);else if(u=!!s.h){if(c.charAt(0)!="/")if(this.g&&!this.h)c="/"+c;else{var I=o.h.lastIndexOf("/");I!=-1&&(c=o.h.slice(0,I+1)+c)}if(I=c,I==".."||I==".")c="";else if(I.indexOf("./")!=-1||I.indexOf("/.")!=-1){c=I.lastIndexOf("/",0)==0,I=I.split("/");const T=[];for(let S=0;S<I.length;){const C=I[S++];C=="."?c&&S==I.length&&T.push(""):C==".."?((T.length>1||T.length==1&&T[0]!="")&&T.pop(),c&&S==I.length&&T.push("")):(T.push(C),c=!0)}c=T.join("/")}else c=I}return u?o.h=c:u=s.i.toString()!=="",u?Yr(o,Oi(s.i)):u=!!s.m,u&&(o.m=s.m),o};function ke(s){return new Xe(s)}function Xt(s,o,u){s.j=u?Zt(o,!0):o,s.j&&(s.j=s.j.replace(/:$/,""))}function Qt(s,o){if(o){if(o=Number(o),isNaN(o)||o<0)throw Error("Bad port number "+o);s.u=o}else s.u=null}function Yr(s,o,u){o instanceof tn?(s.i=o,Mu(s.i,s.l)):(u||(o=en(o,Lu)),s.i=new tn(o,s.l))}function H(s,o,u){s.i.set(o,u)}function Hn(s){return H(s,"zx",Math.floor(Math.random()*2147483648).toString(36)+Math.abs(Math.floor(Math.random()*2147483648)^Date.now()).toString(36)),s}function Zt(s,o){return s?o?decodeURI(s.replace(/%25/g,"%2525")):decodeURIComponent(s):""}function en(s,o,u){return typeof s=="string"?(s=encodeURI(s).replace(o,xu),u&&(s=s.replace(/%25([0-9a-fA-F]{2})/g,"%$1")),s):null}function xu(s){return s=s.charCodeAt(0),"%"+(s>>4&15).toString(16)+(s&15).toString(16)}var Vi=/[#\/\?@]/g,Ou=/[#\?:]/g,Du=/[#\?]/g,Lu=/[#\?@]/g,Uu=/#/g;function tn(s,o){this.h=this.g=null,this.i=s||null,this.j=!!o}function pt(s){s.g||(s.g=new Map,s.h=0,s.i&&Cu(s.i,function(o,u){s.add(decodeURIComponent(o.replace(/\+/g," ")),u)}))}n=tn.prototype,n.add=function(s,o){pt(this),this.i=null,s=St(this,s);let u=this.g.get(s);return u||this.g.set(s,u=[]),u.push(o),this.h+=1,this};function ki(s,o){pt(s),o=St(s,o),s.g.has(o)&&(s.i=null,s.h-=s.g.get(o).length,s.g.delete(o))}function Ni(s,o){return pt(s),o=St(s,o),s.g.has(o)}n.forEach=function(s,o){pt(this),this.g.forEach(function(u,c){u.forEach(function(I){s.call(o,I,c,this)},this)},this)};function Ci(s,o){pt(s);let u=[];if(typeof o=="string")Ni(s,o)&&(u=u.concat(s.g.get(St(s,o))));else for(s=Array.from(s.g.values()),o=0;o<s.length;o++)u=u.concat(s[o]);return u}n.set=function(s,o){return pt(this),this.i=null,s=St(this,s),Ni(this,s)&&(this.h-=this.g.get(s).length),this.g.set(s,[o]),this.h+=1,this},n.get=function(s,o){return s?(s=Ci(this,s),s.length>0?String(s[0]):o):o};function xi(s,o,u){ki(s,o),u.length>0&&(s.i=null,s.g.set(St(s,o),x(u)),s.h+=u.length)}n.toString=function(){if(this.i)return this.i;if(!this.g)return"";const s=[],o=Array.from(this.g.keys());for(let c=0;c<o.length;c++){var u=o[c];const I=Jt(u);u=Ci(this,u);for(let T=0;T<u.length;T++){let S=I;u[T]!==""&&(S+="="+Jt(u[T])),s.push(S)}}return this.i=s.join("&")};function Oi(s){const o=new tn;return o.i=s.i,s.g&&(o.g=new Map(s.g),o.h=s.h),o}function St(s,o){return o=String(o),s.j&&(o=o.toLowerCase()),o}function Mu(s,o){o&&!s.j&&(pt(s),s.i=null,s.g.forEach(function(u,c){const I=c.toLowerCase();c!=I&&(ki(this,c),xi(this,I,u))},s)),s.j=o}function Fu(s,o){const u=new Kt;if(l.Image){const c=new Image;c.onload=b(Qe,u,"TestLoadImage: loaded",!0,o,c),c.onerror=b(Qe,u,"TestLoadImage: error",!1,o,c),c.onabort=b(Qe,u,"TestLoadImage: abort",!1,o,c),c.ontimeout=b(Qe,u,"TestLoadImage: timeout",!1,o,c),l.setTimeout(function(){c.ontimeout&&c.ontimeout()},1e4),c.src=s}else o(!1)}function Bu(s,o){const u=new Kt,c=new AbortController,I=setTimeout(()=>{c.abort(),Qe(u,"TestPingServer: timeout",!1,o)},1e4);fetch(s,{signal:c.signal}).then(T=>{clearTimeout(I),T.ok?Qe(u,"TestPingServer: ok",!0,o):Qe(u,"TestPingServer: server error",!1,o)}).catch(()=>{clearTimeout(I),Qe(u,"TestPingServer: error",!1,o)})}function Qe(s,o,u,c,I){try{I&&(I.onload=null,I.onerror=null,I.onabort=null,I.ontimeout=null),c(u)}catch{}}function ju(){this.g=new Iu}function Xr(s){this.i=s.Sb||null,this.h=s.ab||!1}R(Xr,fi),Xr.prototype.g=function(){return new qn(this.i,this.h)};function qn(s,o){se.call(this),this.H=s,this.o=o,this.m=void 0,this.status=this.readyState=0,this.responseType=this.responseText=this.response=this.statusText="",this.onreadystatechange=null,this.A=new Headers,this.h=null,this.F="GET",this.D="",this.g=!1,this.B=this.j=this.l=null,this.v=new AbortController}R(qn,se),n=qn.prototype,n.open=function(s,o){if(this.readyState!=0)throw this.abort(),Error("Error reopening a connection");this.F=s,this.D=o,this.readyState=1,rn(this)},n.send=function(s){if(this.readyState!=1)throw this.abort(),Error("need to call open() first. ");if(this.v.signal.aborted)throw this.abort(),Error("Request was aborted.");this.g=!0;const o={headers:this.A,method:this.F,credentials:this.m,cache:void 0,signal:this.v.signal};s&&(o.body=s),(this.H||l).fetch(new Request(this.D,o)).then(this.Pa.bind(this),this.ga.bind(this))},n.abort=function(){this.response=this.responseText="",this.A=new Headers,this.status=0,this.v.abort(),this.j&&this.j.cancel("Request was aborted.").catch(()=>{}),this.readyState>=1&&this.g&&this.readyState!=4&&(this.g=!1,nn(this)),this.readyState=0},n.Pa=function(s){if(this.g&&(this.l=s,this.h||(this.status=this.l.status,this.statusText=this.l.statusText,this.h=s.headers,this.readyState=2,rn(this)),this.g&&(this.readyState=3,rn(this),this.g)))if(this.responseType==="arraybuffer")s.arrayBuffer().then(this.Na.bind(this),this.ga.bind(this));else if(typeof l.ReadableStream<"u"&&"body"in s){if(this.j=s.body.getReader(),this.o){if(this.responseType)throw Error('responseType must be empty for "streamBinaryChunks" mode responses.');this.response=[]}else this.response=this.responseText="",this.B=new TextDecoder;Di(this)}else s.text().then(this.Oa.bind(this),this.ga.bind(this))};function Di(s){s.j.read().then(s.Ma.bind(s)).catch(s.ga.bind(s))}n.Ma=function(s){if(this.g){if(this.o&&s.value)this.response.push(s.value);else if(!this.o){var o=s.value?s.value:new Uint8Array(0);(o=this.B.decode(o,{stream:!s.done}))&&(this.response=this.responseText+=o)}s.done?nn(this):rn(this),this.readyState==3&&Di(this)}},n.Oa=function(s){this.g&&(this.response=this.responseText=s,nn(this))},n.Na=function(s){this.g&&(this.response=s,nn(this))},n.ga=function(){this.g&&nn(this)};function nn(s){s.readyState=4,s.l=null,s.j=null,s.B=null,rn(s)}n.setRequestHeader=function(s,o){this.A.append(s,o)},n.getResponseHeader=function(s){return this.h&&this.h.get(s.toLowerCase())||""},n.getAllResponseHeaders=function(){if(!this.h)return"";const s=[],o=this.h.entries();for(var u=o.next();!u.done;)u=u.value,s.push(u[0]+": "+u[1]),u=o.next();return s.join(`\r
`)};function rn(s){s.onreadystatechange&&s.onreadystatechange.call(s)}Object.defineProperty(qn.prototype,"withCredentials",{get:function(){return this.m==="include"},set:function(s){this.m=s?"include":"same-origin"}});function Li(s){let o="";return Fn(s,function(u,c){o+=c,o+=":",o+=u,o+=`\r
`}),o}function Qr(s,o,u){e:{for(c in u){var c=!1;break e}c=!0}c||(u=Li(u),typeof s=="string"?u!=null&&Jt(u):H(s,o,u))}function z(s){se.call(this),this.headers=new Map,this.L=s||null,this.h=!1,this.g=null,this.D="",this.o=0,this.l="",this.j=this.B=this.v=this.A=!1,this.m=null,this.F="",this.H=!1}R(z,se);var $u=/^https?$/i,Hu=["POST","PUT"];n=z.prototype,n.Fa=function(s){this.H=s},n.ea=function(s,o,u,c){if(this.g)throw Error("[goog.net.XhrIo] Object is active with another request="+this.D+"; newUri="+s);o=o?o.toUpperCase():"GET",this.D=s,this.l="",this.o=0,this.A=!1,this.h=!0,this.g=this.L?this.L.g():_i.g(),this.g.onreadystatechange=V(_(this.Ca,this));try{this.B=!0,this.g.open(o,String(s),!0),this.B=!1}catch(T){Ui(this,T);return}if(s=u||"",u=new Map(this.headers),c)if(Object.getPrototypeOf(c)===Object.prototype)for(var I in c)u.set(I,c[I]);else if(typeof c.keys=="function"&&typeof c.get=="function")for(const T of c.keys())u.set(T,c.get(T));else throw Error("Unknown input type for opt_headers: "+String(c));c=Array.from(u.keys()).find(T=>T.toLowerCase()=="content-type"),I=l.FormData&&s instanceof l.FormData,!(Array.prototype.indexOf.call(Hu,o,void 0)>=0)||c||I||u.set("Content-Type","application/x-www-form-urlencoded;charset=utf-8");for(const[T,S]of u)this.g.setRequestHeader(T,S);this.F&&(this.g.responseType=this.F),"withCredentials"in this.g&&this.g.withCredentials!==this.H&&(this.g.withCredentials=this.H);try{this.m&&(clearTimeout(this.m),this.m=null),this.v=!0,this.g.send(s),this.v=!1}catch(T){Ui(this,T)}};function Ui(s,o){s.h=!1,s.g&&(s.j=!0,s.g.abort(),s.j=!1),s.l=o,s.o=5,Mi(s),zn(s)}function Mi(s){s.A||(s.A=!0,ae(s,"complete"),ae(s,"error"))}n.abort=function(s){this.g&&this.h&&(this.h=!1,this.j=!0,this.g.abort(),this.j=!1,this.o=s||7,ae(this,"complete"),ae(this,"abort"),zn(this))},n.N=function(){this.g&&(this.h&&(this.h=!1,this.j=!0,this.g.abort(),this.j=!1),zn(this,!0)),z.Z.N.call(this)},n.Ca=function(){this.u||(this.B||this.v||this.j?Fi(this):this.Xa())},n.Xa=function(){Fi(this)};function Fi(s){if(s.h&&typeof a<"u"){if(s.v&&Ze(s)==4)setTimeout(s.Ca.bind(s),0);else if(ae(s,"readystatechange"),Ze(s)==4){s.h=!1;try{const T=s.ca();e:switch(T){case 200:case 201:case 202:case 204:case 206:case 304:case 1223:var o=!0;break e;default:o=!1}var u;if(!(u=o)){var c;if(c=T===0){let S=String(s.D).match(Si)[1]||null;!S&&l.self&&l.self.location&&(S=l.self.location.protocol.slice(0,-1)),c=!$u.test(S?S.toLowerCase():"")}u=c}if(u)ae(s,"complete"),ae(s,"success");else{s.o=6;try{var I=Ze(s)>2?s.g.statusText:""}catch{I=""}s.l=I+" ["+s.ca()+"]",Mi(s)}}finally{zn(s)}}}}function zn(s,o){if(s.g){s.m&&(clearTimeout(s.m),s.m=null);const u=s.g;s.g=null,o||ae(s,"ready");try{u.onreadystatechange=null}catch{}}}n.isActive=function(){return!!this.g};function Ze(s){return s.g?s.g.readyState:0}n.ca=function(){try{return Ze(this)>2?this.g.status:-1}catch{return-1}},n.la=function(){try{return this.g?this.g.responseText:""}catch{return""}},n.La=function(s){if(this.g){var o=this.g.responseText;return s&&o.indexOf(s)==0&&(o=o.substring(s.length)),vu(o)}};function Bi(s){try{if(!s.g)return null;if("response"in s.g)return s.g.response;switch(s.F){case"":case"text":return s.g.responseText;case"arraybuffer":if("mozResponseArrayBuffer"in s.g)return s.g.mozResponseArrayBuffer}return null}catch{return null}}function qu(s){const o={};s=(s.g&&Ze(s)>=2&&s.g.getAllResponseHeaders()||"").split(`\r
`);for(let c=0;c<s.length;c++){if(p(s[c]))continue;var u=Su(s[c]);const I=u[0];if(u=u[1],typeof u!="string")continue;u=u.trim();const T=o[I]||[];o[I]=T,T.push(u)}pu(o,function(c){return c.join(", ")})}n.ya=function(){return this.o},n.Ha=function(){return typeof this.l=="string"?this.l:String(this.l)};function sn(s,o,u){return u&&u.internalChannelParams&&u.internalChannelParams[s]||o}function ji(s){this.za=0,this.i=[],this.j=new Kt,this.ba=this.na=this.J=this.W=this.g=this.wa=this.G=this.H=this.u=this.U=this.o=null,this.Ya=this.V=0,this.Sa=sn("failFast",!1,s),this.F=this.C=this.v=this.m=this.l=null,this.X=!0,this.xa=this.K=-1,this.Y=this.A=this.D=0,this.Qa=sn("baseRetryDelayMs",5e3,s),this.Za=sn("retryDelaySeedMs",1e4,s),this.Ta=sn("forwardChannelMaxRetries",2,s),this.va=sn("forwardChannelRequestTimeoutMs",2e4,s),this.ma=s&&s.xmlHttpFactory||void 0,this.Ua=s&&s.Rb||void 0,this.Aa=s&&s.useFetchStreams||!1,this.O=void 0,this.L=s&&s.supportsCrossDomainXhr||!1,this.M="",this.h=new Ti(s&&s.concurrentRequestLimit),this.Ba=new ju,this.S=s&&s.fastHandshake||!1,this.R=s&&s.encodeInitMessageHeaders||!1,this.S&&this.R&&(this.R=!1),this.Ra=s&&s.Pb||!1,s&&s.ua&&this.j.ua(),s&&s.forceLongPolling&&(this.X=!1),this.aa=!this.S&&this.X&&s&&s.detectBufferingProxy||!1,this.ia=void 0,s&&s.longPollingTimeout&&s.longPollingTimeout>0&&(this.ia=s.longPollingTimeout),this.ta=void 0,this.T=0,this.P=!1,this.ja=this.B=null}n=ji.prototype,n.ka=8,n.I=1,n.connect=function(s,o,u,c){ue(0),this.W=s,this.H=o||{},u&&c!==void 0&&(this.H.OSID=u,this.H.OAID=c),this.F=this.X,this.J=Yi(this,null,this.W),Gn(this)};function Zr(s){if($i(s),s.I==3){var o=s.V++,u=ke(s.J);if(H(u,"SID",s.M),H(u,"RID",o),H(u,"TYPE","terminate"),on(s,u),o=new Ye(s,s.j,o),o.M=2,o.A=Hn(ke(u)),u=!1,l.navigator&&l.navigator.sendBeacon)try{u=l.navigator.sendBeacon(o.A.toString(),"")}catch{}!u&&l.Image&&(new Image().src=o.A,u=!0),u||(o.g=Xi(o.j,null),o.g.ea(o.A)),o.F=Date.now(),$n(o)}Ji(s)}function Wn(s){s.g&&(ts(s),s.g.cancel(),s.g=null)}function $i(s){Wn(s),s.v&&(l.clearTimeout(s.v),s.v=null),Kn(s),s.h.cancel(),s.m&&(typeof s.m=="number"&&l.clearTimeout(s.m),s.m=null)}function Gn(s){if(!Ai(s.h)&&!s.m){s.m=!0;var o=s.Ea;fe||d(),re||(fe(),re=!0),w.add(o,s),s.D=0}}function zu(s,o){return bi(s.h)>=s.h.j-(s.m?1:0)?!1:s.m?(s.i=o.G.concat(s.i),!0):s.I==1||s.I==2||s.D>=(s.Sa?0:s.Ta)?!1:(s.m=Gt(_(s.Ea,s,o),Ki(s,s.D)),s.D++,!0)}n.Ea=function(s){if(this.m)if(this.m=null,this.I==1){if(!s){this.V=Math.floor(Math.random()*1e5),s=this.V++;const I=new Ye(this,this.j,s);let T=this.o;if(this.U&&(T?(T=ni(T),si(T,this.U)):T=this.U),this.u!==null||this.R||(I.J=T,T=null),this.S)e:{for(var o=0,u=0;u<this.i.length;u++){t:{var c=this.i[u];if("__data__"in c.map&&(c=c.map.__data__,typeof c=="string")){c=c.length;break t}c=void 0}if(c===void 0)break;if(o+=c,o>4096){o=u;break e}if(o===4096||u===this.i.length-1){o=u+1;break e}}o=1e3}else o=1e3;o=qi(this,I,o),u=ke(this.J),H(u,"RID",s),H(u,"CVER",22),this.G&&H(u,"X-HTTP-Session-Id",this.G),on(this,u),T&&(this.R?o="headers="+Jt(Li(T))+"&"+o:this.u&&Qr(u,this.u,T)),Jr(this.h,I),this.Ra&&H(u,"TYPE","init"),this.S?(H(u,"$req",o),H(u,"SID","null"),I.U=!0,zr(I,u,null)):zr(I,u,o),this.I=2}}else this.I==3&&(s?Hi(this,s):this.i.length==0||Ai(this.h)||Hi(this))};function Hi(s,o){var u;o?u=o.l:u=s.V++;const c=ke(s.J);H(c,"SID",s.M),H(c,"RID",u),H(c,"AID",s.K),on(s,c),s.u&&s.o&&Qr(c,s.u,s.o),u=new Ye(s,s.j,u,s.D+1),s.u===null&&(u.J=s.o),o&&(s.i=o.G.concat(s.i)),o=qi(s,u,1e3),u.H=Math.round(s.va*.5)+Math.round(s.va*.5*Math.random()),Jr(s.h,u),zr(u,c,o)}function on(s,o){s.H&&Fn(s.H,function(u,c){H(o,c,u)}),s.l&&Fn({},function(u,c){H(o,c,u)})}function qi(s,o,u){u=Math.min(s.i.length,u);const c=s.l?_(s.l.Ka,s.l,s):null;e:{var I=s.i;let C=-1;for(;;){const K=["count="+u];C==-1?u>0?(C=I[0].g,K.push("ofs="+C)):C=0:K.push("ofs="+C);let $=!0;for(let X=0;X<u;X++){var T=I[X].g;const Ne=I[X].map;if(T-=C,T<0)C=Math.max(0,I[X].g-100),$=!1;else try{T="req"+T+"_"||"";try{var S=Ne instanceof Map?Ne:Object.entries(Ne);for(const[mt,et]of S){let tt=et;h(et)&&(tt=Mr(et)),K.push(T+mt+"="+encodeURIComponent(tt))}}catch(mt){throw K.push(T+"type="+encodeURIComponent("_badmap")),mt}}catch{c&&c(Ne)}}if($){S=K.join("&");break e}}S=void 0}return s=s.i.splice(0,u),o.G=s,S}function zi(s){if(!s.g&&!s.v){s.Y=1;var o=s.Da;fe||d(),re||(fe(),re=!0),w.add(o,s),s.A=0}}function es(s){return s.g||s.v||s.A>=3?!1:(s.Y++,s.v=Gt(_(s.Da,s),Ki(s,s.A)),s.A++,!0)}n.Da=function(){if(this.v=null,Wi(this),this.aa&&!(this.P||this.g==null||this.T<=0)){var s=4*this.T;this.j.info("BP detection timer enabled: "+s),this.B=Gt(_(this.Wa,this),s)}},n.Wa=function(){this.B&&(this.B=null,this.j.info("BP detection timeout reached."),this.j.info("Buffering proxy detected and switch to long-polling!"),this.F=!1,this.P=!0,ue(10),Wn(this),Wi(this))};function ts(s){s.B!=null&&(l.clearTimeout(s.B),s.B=null)}function Wi(s){s.g=new Ye(s,s.j,"rpc",s.Y),s.u===null&&(s.g.J=s.o),s.g.P=0;var o=ke(s.na);H(o,"RID","rpc"),H(o,"SID",s.M),H(o,"AID",s.K),H(o,"CI",s.F?"0":"1"),!s.F&&s.ia&&H(o,"TO",s.ia),H(o,"TYPE","xmlhttp"),on(s,o),s.u&&s.o&&Qr(o,s.u,s.o),s.O&&(s.g.H=s.O);var u=s.g;s=s.ba,u.M=1,u.A=Hn(ke(o)),u.u=null,u.R=!0,vi(u,s)}n.Va=function(){this.C!=null&&(this.C=null,Wn(this),es(this),ue(19))};function Kn(s){s.C!=null&&(l.clearTimeout(s.C),s.C=null)}function Gi(s,o){var u=null;if(s.g==o){Kn(s),ts(s),s.g=null;var c=2}else if(Kr(s.h,o))u=o.G,Ri(s.h,o),c=1;else return;if(s.I!=0){if(o.o)if(c==1){u=o.u?o.u.length:0,o=Date.now()-o.F;var I=s.D;c=jr(),ae(c,new mi(c,u)),Gn(s)}else zi(s);else if(I=o.m,I==3||I==0&&o.X>0||!(c==1&&zu(s,o)||c==2&&es(s)))switch(u&&u.length>0&&(o=s.h,o.i=o.i.concat(u)),I){case 1:gt(s,5);break;case 4:gt(s,10);break;case 3:gt(s,6);break;default:gt(s,2)}}}function Ki(s,o){let u=s.Qa+Math.floor(Math.random()*s.Za);return s.isActive()||(u*=2),u*o}function gt(s,o){if(s.j.info("Error code "+o),o==2){var u=_(s.bb,s),c=s.Ua;const I=!c;c=new Xe(c||"//www.google.com/images/cleardot.gif"),l.location&&l.location.protocol=="http"||Xt(c,"https"),Hn(c),I?Fu(c.toString(),u):Bu(c.toString(),u)}else ue(2);s.I=0,s.l&&s.l.pa(o),Ji(s),$i(s)}n.bb=function(s){s?(this.j.info("Successfully pinged google.com"),ue(2)):(this.j.info("Failed to ping google.com"),ue(1))};function Ji(s){if(s.I=0,s.ja=[],s.l){const o=Pi(s.h);(o.length!=0||s.i.length!=0)&&(O(s.ja,o),O(s.ja,s.i),s.h.i.length=0,x(s.i),s.i.length=0),s.l.oa()}}function Yi(s,o,u){var c=u instanceof Xe?ke(u):new Xe(u);if(c.g!="")o&&(c.g=o+"."+c.g),Qt(c,c.u);else{var I=l.location;c=I.protocol,o=o?o+"."+I.hostname:I.hostname,I=+I.port;const T=new Xe(null);c&&Xt(T,c),o&&(T.g=o),I&&Qt(T,I),u&&(T.h=u),c=T}return u=s.G,o=s.wa,u&&o&&H(c,u,o),H(c,"VER",s.ka),on(s,c),c}function Xi(s,o,u){if(o&&!s.L)throw Error("Can't create secondary domain capable XhrIo object.");return o=s.Aa&&!s.ma?new z(new Xr({ab:u})):new z(s.ma),o.Fa(s.L),o}n.isActive=function(){return!!this.l&&this.l.isActive(this)};function Qi(){}n=Qi.prototype,n.ra=function(){},n.qa=function(){},n.pa=function(){},n.oa=function(){},n.isActive=function(){return!0},n.Ka=function(){};function we(s,o){se.call(this),this.g=new ji(o),this.l=s,this.h=o&&o.messageUrlParams||null,s=o&&o.messageHeaders||null,o&&o.clientProtocolHeaderRequired&&(s?s["X-Client-Protocol"]="webchannel":s={"X-Client-Protocol":"webchannel"}),this.g.o=s,s=o&&o.initMessageHeaders||null,o&&o.messageContentType&&(s?s["X-WebChannel-Content-Type"]=o.messageContentType:s={"X-WebChannel-Content-Type":o.messageContentType}),o&&o.sa&&(s?s["X-WebChannel-Client-Profile"]=o.sa:s={"X-WebChannel-Client-Profile":o.sa}),this.g.U=s,(s=o&&o.Qb)&&!p(s)&&(this.g.u=s),this.A=o&&o.supportsCrossDomainXhr||!1,this.v=o&&o.sendRawJson||!1,(o=o&&o.httpSessionIdParam)&&!p(o)&&(this.g.G=o,s=this.h,s!==null&&o in s&&(s=this.h,o in s&&delete s[o])),this.j=new Vt(this)}R(we,se),we.prototype.m=function(){this.g.l=this.j,this.A&&(this.g.L=!0),this.g.connect(this.l,this.h||void 0)},we.prototype.close=function(){Zr(this.g)},we.prototype.o=function(s){var o=this.g;if(typeof s=="string"){var u={};u.__data__=s,s=u}else this.v&&(u={},u.__data__=Mr(s),s=u);o.i.push(new Nu(o.Ya++,s)),o.I==3&&Gn(o)},we.prototype.N=function(){this.g.l=null,delete this.j,Zr(this.g),delete this.g,we.Z.N.call(this)};function Zi(s){Fr.call(this),s.__headers__&&(this.headers=s.__headers__,this.statusCode=s.__status__,delete s.__headers__,delete s.__status__);var o=s.__sm__;if(o){e:{for(const u in o){s=u;break e}s=void 0}(this.i=s)&&(s=this.i,o=o!==null&&s in o?o[s]:void 0),this.data=o}else this.data=s}R(Zi,Fr);function eo(){Br.call(this),this.status=1}R(eo,Br);function Vt(s){this.g=s}R(Vt,Qi),Vt.prototype.ra=function(){ae(this.g,"a")},Vt.prototype.qa=function(s){ae(this.g,new Zi(s))},Vt.prototype.pa=function(s){ae(this.g,new eo)},Vt.prototype.oa=function(){ae(this.g,"b")},we.prototype.send=we.prototype.o,we.prototype.open=we.prototype.m,we.prototype.close=we.prototype.close,$r.NO_ERROR=0,$r.TIMEOUT=8,$r.HTTP_ERROR=6,Pu.COMPLETE="complete",Eu.EventType=zt,zt.OPEN="a",zt.CLOSE="b",zt.ERROR="c",zt.MESSAGE="d",se.prototype.listen=se.prototype.J,z.prototype.listenOnce=z.prototype.K,z.prototype.getLastError=z.prototype.Ha,z.prototype.getLastErrorCode=z.prototype.ya,z.prototype.getStatus=z.prototype.ca,z.prototype.getResponseJson=z.prototype.La,z.prototype.getResponseText=z.prototype.la,z.prototype.send=z.prototype.ea,z.prototype.setWithCredentials=z.prototype.Fa}).apply(typeof Xn<"u"?Xn:typeof self<"u"?self:typeof window<"u"?window:{});/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class le{constructor(e){this.uid=e}isAuthenticated(){return this.uid!=null}toKey(){return this.isAuthenticated()?"uid:"+this.uid:"anonymous-user"}isEqual(e){return e.uid===this.uid}}le.UNAUTHENTICATED=new le(null),le.GOOGLE_CREDENTIALS=new le("google-credentials-uid"),le.FIRST_PARTY=new le("first-party-uid"),le.MOCK_USER=new le("mock-user");/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Nn="12.15.0";function pf(n){Nn=n}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Mt=new Rs("@firebase/firestore");function Pe(n,...e){if(Mt.logLevel<=j.DEBUG){const t=e.map(Ms);Mt.debug(`Firestore (${Nn}): ${n}`,...t)}}function Ma(n,...e){if(Mt.logLevel<=j.ERROR){const t=e.map(Ms);Mt.error(`Firestore (${Nn}): ${n}`,...t)}}function Cn(n,...e){if(Mt.logLevel<=j.WARN){const t=e.map(Ms);Mt.warn(`Firestore (${Nn}): ${n}`,...t)}}function Ms(n){if(typeof n=="string")return n;try{return(function(t){return JSON.stringify(t)})(n)}catch{return n}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function q(n,e,t){let r="Unexpected state";typeof e=="string"?r=e:t=e,Fa(n,r,t)}function Fa(n,e,t){let r=`FIRESTORE (${Nn}) INTERNAL ASSERTION FAILED: ${e} (ID: ${n.toString(16)})`;if(t!==void 0)try{r+=" CONTEXT: "+JSON.stringify(t)}catch{r+=" CONTEXT: "+t}throw Ma(r),new Error(r)}function U(n,e,t,r){let i="Unexpected state";typeof t=="string"?i=t:r=t,n||Fa(e,i,r)}function gf(n,e){return n}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const M={CANCELLED:"cancelled",INVALID_ARGUMENT:"invalid-argument",FAILED_PRECONDITION:"failed-precondition"};class L extends Fe{constructor(e,t){super(e,t),this.code=e,this.message=t,this.toString=()=>`${this.name}: [code=${this.code}]: ${this.message}`}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ln{constructor(){this.promise=new Promise(((e,t)=>{this.resolve=e,this.reject=t}))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ba{constructor(e,t){this.user=t,this.type="OAuth",this.headers=new Map,this.headers.set("Authorization",`Bearer ${e}`)}}class mf{getToken(){return Promise.resolve(null)}invalidateToken(){}start(e,t){e.enqueueRetryable((()=>t(le.UNAUTHENTICATED)))}shutdown(){}}class _f{constructor(e){this.token=e,this.changeListener=null}getToken(){return Promise.resolve(this.token)}invalidateToken(){}start(e,t){this.changeListener=t,e.enqueueRetryable((()=>t(this.token.user)))}shutdown(){this.changeListener=null}}class yf{constructor(e){this.t=e,this.currentUser=le.UNAUTHENTICATED,this.i=0,this.forceRefresh=!1,this.auth=null}start(e,t){U(this.o===void 0,42304);let r=this.i;const i=f=>this.i!==r?(r=this.i,t(f)):Promise.resolve();let a=new ln;this.o=()=>{this.i++,this.currentUser=this.u(),a.resolve(),a=new ln,e.enqueueRetryable((()=>i(this.currentUser)))};const l=()=>{const f=a;e.enqueueRetryable((async()=>{await f.promise,await i(this.currentUser)}))},h=f=>{Pe("FirebaseAuthCredentialsProvider","Auth detected"),this.auth=f,this.o&&(this.auth.addAuthTokenListener(this.o),l())};this.t.onInit((f=>h(f))),setTimeout((()=>{if(!this.auth){const f=this.t.getImmediate({optional:!0});f?h(f):(Pe("FirebaseAuthCredentialsProvider","Auth not yet detected"),a.resolve(),a=new ln)}}),0),l()}getToken(){const e=this.i,t=this.forceRefresh;return this.forceRefresh=!1,this.auth?this.auth.getToken(t).then((r=>this.i!==e?(Pe("FirebaseAuthCredentialsProvider","getToken aborted due to token change."),this.getToken()):r?(U(typeof r.accessToken=="string",31837,{l:r}),new Ba(r.accessToken,this.currentUser)):null)):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.auth&&this.o&&this.auth.removeAuthTokenListener(this.o),this.o=void 0}u(){const e=this.auth&&this.auth.getUid();return U(e===null||typeof e=="string",2055,{h:e}),new le(e)}}class wf{constructor(e,t,r){this.T=e,this.P=t,this.R=r,this.type="FirstParty",this.user=le.FIRST_PARTY,this.I=new Map}A(){return this.R?this.R():null}get headers(){this.I.set("X-Goog-AuthUser",this.T);const e=this.A();return e&&this.I.set("Authorization",e),this.P&&this.I.set("X-Goog-Iam-Authorization-Token",this.P),this.I}}class vf{constructor(e,t,r){this.T=e,this.P=t,this.R=r}getToken(){return Promise.resolve(new wf(this.T,this.P,this.R))}start(e,t){e.enqueueRetryable((()=>t(le.FIRST_PARTY)))}shutdown(){}invalidateToken(){}}class Po{constructor(e){this.value=e,this.type="AppCheck",this.headers=new Map,e&&e.length>0&&this.headers.set("x-firebase-appcheck",this.value)}}class If{constructor(e,t){this.V=t,this.forceRefresh=!1,this.appCheck=null,this.m=null,this.p=null,Ae(e)&&e.settings.appCheckToken&&(this.p=e.settings.appCheckToken)}start(e,t){U(this.o===void 0,3512);const r=a=>{a.error!=null&&Pe("FirebaseAppCheckTokenProvider",`Error getting App Check token; using placeholder token instead. Error: ${a.error.message}`);const l=a.token!==this.m;return this.m=a.token,Pe("FirebaseAppCheckTokenProvider",`Received ${l?"new":"existing"} token.`),l?t(a.token):Promise.resolve()};this.o=a=>{e.enqueueRetryable((()=>r(a)))};const i=a=>{Pe("FirebaseAppCheckTokenProvider","AppCheck detected"),this.appCheck=a,this.o&&this.appCheck.addTokenListener(this.o)};this.V.onInit((a=>i(a))),setTimeout((()=>{if(!this.appCheck){const a=this.V.getImmediate({optional:!0});a?i(a):Pe("FirebaseAppCheckTokenProvider","AppCheck not yet detected")}}),0)}getToken(){if(this.p)return Promise.resolve(new Po(this.p));const e=this.forceRefresh;return this.forceRefresh=!1,this.appCheck?this.appCheck.getToken(e).then((t=>t?(U(typeof t.token=="string",44558,{tokenResult:t}),this.m=t.token,new Po(t.token)):null)):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.appCheck&&this.o&&this.appCheck.removeTokenListener(this.o),this.o=void 0}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ef(n){const e=typeof self<"u"&&(self.crypto||self.msCrypto),t=new Uint8Array(n);if(e&&typeof e.getRandomValues=="function")e.getRandomValues(t);else for(let r=0;r<n;r++)t[r]=Math.floor(256*Math.random());return t}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Tf{static newId(){const e="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",t=62*Math.floor(4.129032258064516);let r="";for(;r.length<20;){const i=Ef(40);for(let a=0;a<i.length;++a)r.length<20&&i[a]<t&&(r+=e.charAt(i[a]%62))}return r}}function W(n,e){return n<e?-1:n>e?1:0}function _s(n,e){const t=Math.min(n.length,e.length);for(let r=0;r<t;r++){const i=n.charAt(r),a=e.charAt(r);if(i!==a)return as(i)===as(a)?W(i,a):as(i)?1:-1}return W(n.length,e.length)}const Af=55296,bf=57343;function as(n){const e=n.charCodeAt(0);return e>=Af&&e<=bf}function Rf(n,e,t){return n.length===e.length&&n.every(((r,i)=>t(r,e[i])))}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const mn="__name__";class Ce{constructor(e,t,r){t===void 0?t=0:t>e.length&&q(637,{offset:t,range:e.length}),r===void 0?r=e.length-t:r>e.length-t&&q(1746,{length:r,range:e.length-t}),this.segments=e,this.offset=t,this.len=r}get length(){return this.len}isEqual(e){return Ce.comparator(this,e)===0}child(e){const t=this.segments.slice(this.offset,this.limit());return e instanceof Ce?e.forEach((r=>{t.push(r)})):t.push(e),this.construct(t)}limit(){return this.offset+this.length}popFirst(e){return e=e===void 0?1:e,this.construct(this.segments,this.offset+e,this.length-e)}popLast(){return this.construct(this.segments,this.offset,this.length-1)}firstSegment(){return this.segments[this.offset]}lastSegment(){return this.get(this.length-1)}get(e){return this.segments[this.offset+e]}isEmpty(){return this.length===0}isPrefixOf(e){if(e.length<this.length)return!1;for(let t=0;t<this.length;t++)if(this.get(t)!==e.get(t))return!1;return!0}isImmediateParentOf(e){if(this.length+1!==e.length)return!1;for(let t=0;t<this.length;t++)if(this.get(t)!==e.get(t))return!1;return!0}forEach(e){for(let t=this.offset,r=this.limit();t<r;t++)e(this.segments[t])}toArray(){return this.segments.slice(this.offset,this.limit())}static comparator(e,t){const r=Math.min(e.length,t.length);for(let i=0;i<r;i++){const a=Ce.compareSegments(e.get(i),t.get(i));if(a!==0)return a}return W(e.length,t.length)}static compareSegments(e,t){const r=Ce.isNumericId(e),i=Ce.isNumericId(t);return r&&!i?-1:!r&&i?1:r&&i?Ce.extractNumericId(e).compare(Ce.extractNumericId(t)):_s(e,t)}static isNumericId(e){return e.startsWith("__id")&&e.endsWith("__")}static extractNumericId(e){return Us.fromString(e.substring(4,e.length-2))}}class pe extends Ce{construct(e,t,r){return new pe(e,t,r)}canonicalString(){return this.toArray().join("/")}toString(){return this.canonicalString()}toStringWithLeadingSlash(){return`/${this.canonicalString()}`}toUriEncodedString(){return this.toArray().map(encodeURIComponent).join("/")}static fromString(...e){const t=[];for(const r of e){if(r.indexOf("//")>=0)throw new L(M.INVALID_ARGUMENT,`Invalid segment (${r}). Paths must not contain // in them.`);t.push(...r.split("/").filter((i=>i.length>0)))}return new pe(t)}static emptyPath(){return new pe([])}}const Pf=/^[_a-zA-Z][_a-zA-Z0-9]*$/;class ge extends Ce{construct(e,t,r){return new ge(e,t,r)}static isValidIdentifier(e){return Pf.test(e)}canonicalString(){return this.toArray().map((e=>(e=e.replace(/\\/g,"\\\\").replace(/`/g,"\\`"),ge.isValidIdentifier(e)||(e="`"+e+"`"),e))).join(".")}toString(){return this.canonicalString()}isKeyField(){return this.length===1&&this.get(0)===mn}static keyField(){return new ge([mn])}static fromServerFormat(e){const t=[];let r="",i=0;const a=()=>{if(r.length===0)throw new L(M.INVALID_ARGUMENT,`Invalid field path (${e}). Paths must not be empty, begin with '.', end with '.', or contain '..'`);t.push(r),r=""};let l=!1;for(;i<e.length;){const h=e[i];if(h==="\\"){if(i+1===e.length)throw new L(M.INVALID_ARGUMENT,"Path has trailing escape character: "+e);const f=e[i+1];if(f!=="\\"&&f!=="."&&f!=="`")throw new L(M.INVALID_ARGUMENT,"Path has invalid escape sequence: "+e);r+=f,i+=2}else h==="`"?(l=!l,i++):h!=="."||l?(r+=h,i++):(a(),i++)}if(a(),l)throw new L(M.INVALID_ARGUMENT,"Unterminated ` in path: "+e);return new ge(t)}static emptyPath(){return new ge([])}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class at{constructor(e){this.path=e}static fromPath(e){return new at(pe.fromString(e))}static fromName(e){return new at(pe.fromString(e).popFirst(5))}static empty(){return new at(pe.emptyPath())}get collectionGroup(){return this.path.popLast().lastSegment()}hasCollectionId(e){return this.path.length>=2&&this.path.get(this.path.length-2)===e}getCollectionGroup(){return this.path.get(this.path.length-2)}getCollectionPath(){return this.path.popLast()}isEqual(e){return e!==null&&pe.comparator(this.path,e.path)===0}toString(){return this.path.toString()}static comparator(e,t){return pe.comparator(e.path,t.path)}static isDocumentKey(e){return e.length%2==0}static fromSegments(e){return new at(new pe(e.slice()))}}function Sf(n,e,t,r){if(e===!0&&r===!0)throw new L(M.INVALID_ARGUMENT,`${n} and ${t} cannot be used together.`)}function xn(n){return typeof n=="object"&&n!==null&&(Object.getPrototypeOf(n)===Object.prototype||Object.getPrototypeOf(n)===null)}function Fs(n){if(n===void 0)return"undefined";if(n===null)return"null";if(typeof n=="string")return n.length>20&&(n=`${n.substring(0,20)}...`),JSON.stringify(n);if(typeof n=="number"||typeof n=="boolean")return""+n;if(typeof n=="object"){if(n instanceof Array)return"an array";{const e=(function(r){return r.constructor?r.constructor.name:null})(n);return e?`a custom ${e} object`:"an object"}}return typeof n=="function"?"a function":q(12329,{type:typeof n})}function Vf(n,e){if("_delegate"in n&&(n=n._delegate),!(n instanceof e)){if(e.name===n.constructor.name)throw new L(M.INVALID_ARGUMENT,"Type does not match the expected instance. Did you pass a reference from a different Firestore SDK?");{const t=Fs(n);throw new L(M.INVALID_ARGUMENT,`Expected type '${e.name}', but it was: ${t}`)}}return n}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function G(n,e){const t={typeString:n};return e&&(t.value=e),t}function On(n,e){if(!xn(n))throw new L(M.INVALID_ARGUMENT,"JSON must be an object");let t;for(const r in e)if(e[r]){const i=e[r].typeString,a="value"in e[r]?{value:e[r].value}:void 0;if(!(r in n)){t=`JSON missing required field: '${r}'`;break}const l=n[r];if(i&&typeof l!==i){t=`JSON field '${r}' must be a ${i}.`;break}if(a!==void 0&&l!==a.value){t=`Expected '${r}' field to equal '${a.value}'`;break}}if(t)throw new L(M.INVALID_ARGUMENT,t);return!0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const So=-62135596800,Vo=1e6;class Z{static now(){return Z.fromMillis(Date.now())}static fromDate(e){return Z.fromMillis(e.getTime())}static fromMillis(e){const t=Math.floor(e/1e3),r=Math.floor((e-1e3*t)*Vo);return new Z(t,r)}constructor(e,t){if(this.seconds=e,this.nanoseconds=t,t<0)throw new L(M.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+t);if(t>=1e9)throw new L(M.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+t);if(e<So)throw new L(M.INVALID_ARGUMENT,"Timestamp seconds out of range: "+e);if(e>=253402300800)throw new L(M.INVALID_ARGUMENT,"Timestamp seconds out of range: "+e)}toDate(){return new Date(this.toMillis())}toMillis(){return 1e3*this.seconds+this.nanoseconds/Vo}_compareTo(e){return this.seconds===e.seconds?W(this.nanoseconds,e.nanoseconds):W(this.seconds,e.seconds)}isEqual(e){return e.seconds===this.seconds&&e.nanoseconds===this.nanoseconds}toString(){return"Timestamp(seconds="+this.seconds+", nanoseconds="+this.nanoseconds+")"}toJSON(){return{type:Z._jsonSchemaVersion,seconds:this.seconds,nanoseconds:this.nanoseconds}}static fromJSON(e){if(On(e,Z._jsonSchema))return new Z(e.seconds,e.nanoseconds)}valueOf(){const e=this.seconds-So;return String(e).padStart(12,"0")+"."+String(this.nanoseconds).padStart(9,"0")}}Z._jsonSchemaVersion="firestore/timestamp/1.0",Z._jsonSchema={type:G("string",Z._jsonSchemaVersion),seconds:G("number"),nanoseconds:G("number")};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class cn{static fromTimestamp(e){return new cn(e)}static min(){return new cn(new Z(0,0))}static max(){return new cn(new Z(253402300799,999999999))}constructor(e){this.timestamp=e}compareTo(e){return this.timestamp._compareTo(e.timestamp)}isEqual(e){return this.timestamp.isEqual(e.timestamp)}toMicroseconds(){return 1e6*this.timestamp.seconds+this.timestamp.nanoseconds/1e3}toString(){return"SnapshotVersion("+this.timestamp.toString()+")"}toTimestamp(){return this.timestamp}}function kf(n){return n.name==="IndexedDbTransactionError"}function _n(n){return n===0&&1/n==-1/0}function Nf(n){return typeof n=="number"&&Number.isInteger(n)&&!_n(n)&&n<=Number.MAX_SAFE_INTEGER&&n>=Number.MIN_SAFE_INTEGER}function Cf(n){return typeof n=="string"}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class pr{constructor(e,t){this.comparator=e,this.root=t||te.EMPTY}insert(e,t){return new pr(this.comparator,this.root.insert(e,t,this.comparator).copy(null,null,te.BLACK,null,null))}remove(e){return new pr(this.comparator,this.root.remove(e,this.comparator).copy(null,null,te.BLACK,null,null))}get(e){let t=this.root;for(;!t.isEmpty();){const r=this.comparator(e,t.key);if(r===0)return t.value;r<0?t=t.left:r>0&&(t=t.right)}return null}indexOf(e){let t=0,r=this.root;for(;!r.isEmpty();){const i=this.comparator(e,r.key);if(i===0)return t+r.left.size;i<0?r=r.left:(t+=r.left.size+1,r=r.right)}return-1}isEmpty(){return this.root.isEmpty()}get size(){return this.root.size}minKey(){return this.root.minKey()}maxKey(){return this.root.maxKey()}inorderTraversal(e){return this.root.inorderTraversal(e)}forEach(e){this.inorderTraversal(((t,r)=>(e(t,r),!1)))}toString(){const e=[];return this.inorderTraversal(((t,r)=>(e.push(`${t}:${r}`),!1))),`{${e.join(", ")}}`}reverseTraversal(e){return this.root.reverseTraversal(e)}getIterator(){return new Qn(this.root,null,this.comparator,!1)}getIteratorFrom(e){return new Qn(this.root,e,this.comparator,!1)}getReverseIterator(){return new Qn(this.root,null,this.comparator,!0)}getReverseIteratorFrom(e){return new Qn(this.root,e,this.comparator,!0)}}class Qn{constructor(e,t,r,i){this.isReverse=i,this.nodeStack=[];let a=1;for(;!e.isEmpty();)if(a=t?r(e.key,t):1,t&&i&&(a*=-1),a<0)e=this.isReverse?e.left:e.right;else{if(a===0){this.nodeStack.push(e);break}this.nodeStack.push(e),e=this.isReverse?e.right:e.left}}getNext(){let e=this.nodeStack.pop();const t={key:e.key,value:e.value};if(this.isReverse)for(e=e.left;!e.isEmpty();)this.nodeStack.push(e),e=e.right;else for(e=e.right;!e.isEmpty();)this.nodeStack.push(e),e=e.left;return t}hasNext(){return this.nodeStack.length>0}peek(){if(this.nodeStack.length===0)return null;const e=this.nodeStack[this.nodeStack.length-1];return{key:e.key,value:e.value}}}class te{constructor(e,t,r,i,a){this.key=e,this.value=t,this.color=r??te.RED,this.left=i??te.EMPTY,this.right=a??te.EMPTY,this.size=this.left.size+1+this.right.size}copy(e,t,r,i,a){return new te(e??this.key,t??this.value,r??this.color,i??this.left,a??this.right)}isEmpty(){return!1}inorderTraversal(e){return this.left.inorderTraversal(e)||e(this.key,this.value)||this.right.inorderTraversal(e)}reverseTraversal(e){return this.right.reverseTraversal(e)||e(this.key,this.value)||this.left.reverseTraversal(e)}min(){return this.left.isEmpty()?this:this.left.min()}minKey(){return this.min().key}maxKey(){return this.right.isEmpty()?this.key:this.right.maxKey()}insert(e,t,r){let i=this;const a=r(e,i.key);return i=a<0?i.copy(null,null,null,i.left.insert(e,t,r),null):a===0?i.copy(null,t,null,null,null):i.copy(null,null,null,null,i.right.insert(e,t,r)),i.fixUp()}removeMin(){if(this.left.isEmpty())return te.EMPTY;let e=this;return e.left.isRed()||e.left.left.isRed()||(e=e.moveRedLeft()),e=e.copy(null,null,null,e.left.removeMin(),null),e.fixUp()}remove(e,t){let r,i=this;if(t(e,i.key)<0)i.left.isEmpty()||i.left.isRed()||i.left.left.isRed()||(i=i.moveRedLeft()),i=i.copy(null,null,null,i.left.remove(e,t),null);else{if(i.left.isRed()&&(i=i.rotateRight()),i.right.isEmpty()||i.right.isRed()||i.right.left.isRed()||(i=i.moveRedRight()),t(e,i.key)===0){if(i.right.isEmpty())return te.EMPTY;r=i.right.min(),i=i.copy(r.key,r.value,null,null,i.right.removeMin())}i=i.copy(null,null,null,null,i.right.remove(e,t))}return i.fixUp()}isRed(){return this.color}fixUp(){let e=this;return e.right.isRed()&&!e.left.isRed()&&(e=e.rotateLeft()),e.left.isRed()&&e.left.left.isRed()&&(e=e.rotateRight()),e.left.isRed()&&e.right.isRed()&&(e=e.colorFlip()),e}moveRedLeft(){let e=this.colorFlip();return e.right.left.isRed()&&(e=e.copy(null,null,null,null,e.right.rotateRight()),e=e.rotateLeft(),e=e.colorFlip()),e}moveRedRight(){let e=this.colorFlip();return e.left.left.isRed()&&(e=e.rotateRight(),e=e.colorFlip()),e}rotateLeft(){const e=this.copy(null,null,te.RED,null,this.right.left);return this.right.copy(null,null,this.color,e,null)}rotateRight(){const e=this.copy(null,null,te.RED,this.left.right,null);return this.left.copy(null,null,this.color,null,e)}colorFlip(){const e=this.left.copy(null,null,!this.left.color,null,null),t=this.right.copy(null,null,!this.right.color,null,null);return this.copy(null,null,!this.color,e,t)}checkMaxDepth(){const e=this.check();return Math.pow(2,e)<=this.size+1}check(){if(this.isRed()&&this.left.isRed())throw q(43730,{key:this.key,value:this.value});if(this.right.isRed())throw q(14113,{key:this.key,value:this.value});const e=this.left.check();if(e!==this.right.check())throw q(27949);return e+(this.isRed()?0:1)}}te.EMPTY=null,te.RED=!0,te.BLACK=!1;te.EMPTY=new class{constructor(){this.size=0}get key(){throw q(57766)}get value(){throw q(16141)}get color(){throw q(16727)}get left(){throw q(29726)}get right(){throw q(36894)}copy(e,t,r,i,a){return this}insert(e,t,r){return new te(e,t)}remove(e,t){return this}isEmpty(){return!0}inorderTraversal(e){return!1}reverseTraversal(e){return!1}minKey(){return null}maxKey(){return null}isRed(){return!1}checkMaxDepth(){return!0}check(){return 0}};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class gr{constructor(e){this.comparator=e,this.data=new pr(this.comparator)}has(e){return this.data.get(e)!==null}first(){return this.data.minKey()}last(){return this.data.maxKey()}get size(){return this.data.size}indexOf(e){return this.data.indexOf(e)}forEach(e){this.data.inorderTraversal(((t,r)=>(e(t),!1)))}forEachInRange(e,t){const r=this.data.getIteratorFrom(e[0]);for(;r.hasNext();){const i=r.getNext();if(this.comparator(i.key,e[1])>=0)return;t(i.key)}}forEachWhile(e,t){let r;for(r=t!==void 0?this.data.getIteratorFrom(t):this.data.getIterator();r.hasNext();)if(!e(r.getNext().key))return}firstAfterOrEqual(e){const t=this.data.getIteratorFrom(e);return t.hasNext()?t.getNext().key:null}getIterator(){return new ko(this.data.getIterator())}getIteratorFrom(e){return new ko(this.data.getIteratorFrom(e))}add(e){return this.copy(this.data.remove(e).insert(e,!0))}delete(e){return this.has(e)?this.copy(this.data.remove(e)):this}isEmpty(){return this.data.isEmpty()}unionWith(e){let t=this;return t.size<e.size&&(t=e,e=this),e.forEach((r=>{t=t.add(r)})),t}isEqual(e){if(!(e instanceof gr)||this.size!==e.size)return!1;const t=this.data.getIterator(),r=e.data.getIterator();for(;t.hasNext();){const i=t.getNext().key,a=r.getNext().key;if(this.comparator(i,a)!==0)return!1}return!0}toArray(){const e=[];return this.forEach((t=>{e.push(t)})),e}toString(){const e=[];return this.forEach((t=>e.push(t))),"SortedSet("+e.toString()+")"}copy(e){const t=new gr(this.comparator);return t.data=e,t}}class ko{constructor(e){this.iter=e}getNext(){return this.iter.getNext().key}hasNext(){return this.iter.hasNext()}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function mr(n){let e=0;for(const t in n)Object.prototype.hasOwnProperty.call(n,t)&&e++;return e}function Bs(n,e){for(const t in n)Object.prototype.hasOwnProperty.call(n,t)&&e(t,n[t])}function xf(n,e){const t=[];for(const r in n)Object.prototype.hasOwnProperty.call(n,r)&&t.push(e(n[r],r,n));return t}function Of(n){for(const e in n)if(Object.prototype.hasOwnProperty.call(n,e))return!1;return!0}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Df extends Error{constructor(){super(...arguments),this.name="Base64DecodeError"}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ee{constructor(e){this.binaryString=e}static fromBase64String(e){const t=(function(i){try{return atob(i)}catch(a){throw typeof DOMException<"u"&&a instanceof DOMException?new Df("Invalid base64 string: "+a):a}})(e);return new Ee(t)}static fromUint8Array(e){const t=(function(i){let a="";for(let l=0;l<i.length;++l)a+=String.fromCharCode(i[l]);return a})(e);return new Ee(t)}[Symbol.iterator](){let e=0;return{next:()=>e<this.binaryString.length?{value:this.binaryString.charCodeAt(e++),done:!1}:{value:void 0,done:!0}}}toBase64(){return(function(t){return btoa(t)})(this.binaryString)}toUint8Array(){return(function(t){const r=new Uint8Array(t.length);for(let i=0;i<t.length;i++)r[i]=t.charCodeAt(i);return r})(this.binaryString)}approximateByteSize(){return 2*this.binaryString.length}compareTo(e){return W(this.binaryString,e.binaryString)}isEqual(e){return this.binaryString===e.binaryString}}Ee.EMPTY_BYTE_STRING=new Ee("");const Lf=new RegExp(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.(\d+))?Z$/);function Ft(n){if(U(!!n,39018),typeof n=="string"){let e=0;const t=Lf.exec(n);if(U(!!t,46558,{timestamp:n}),t[1]){let i=t[1];i=(i+"000000000").substr(0,9),e=Number(i)}const r=new Date(n);return{seconds:Math.floor(r.getTime()/1e3),nanos:e}}return{seconds:Q(n.seconds),nanos:Q(n.nanos)}}function Q(n){return typeof n=="number"?n:typeof n=="string"?Number(n):0}function _r(n){return typeof n=="string"?Ee.fromBase64String(n):Ee.fromUint8Array(n)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Uf="server_timestamp",Mf="__type__",Ff="__previous_value__",Bf="__local_write_time__";function js(n){var t,r;return((r=(((t=n==null?void 0:n.mapValue)==null?void 0:t.fields)||{})[Mf])==null?void 0:r.stringValue)===Uf}function ja(n){const e=n.mapValue.fields[Ff];return js(e)?ja(e):e}function yn(n){const e=Ft(n.mapValue.fields[Bf].timestampValue);return new Z(e.seconds,e.nanos)}const ys="(default)";class yr{constructor(e,t){this.projectId=e,this.database=t||ys}static empty(){return new yr("","")}get isDefaultDatabase(){return this.database===ys}isEqual(e){return e instanceof yr&&e.projectId===this.projectId&&e.database===this.database}}function jf(n,e){if(!Object.prototype.hasOwnProperty.apply(n.options,["projectId"]))throw new L(M.INVALID_ARGUMENT,'"projectId" not provided in firebase.initializeApp.');return new yr(n.options.projectId,e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const $a="__type__",$f="__max__",Zn={mapValue:{}},Ha="__vector__",wr="value",vr={nullValue:"NULL_VALUE"},me={booleanValue:!0},ee={booleanValue:!1};function ie(n){return"nullValue"in n?0:"booleanValue"in n?1:"integerValue"in n||"doubleValue"in n?2:"timestampValue"in n?3:"stringValue"in n?5:"bytesValue"in n?6:"referenceValue"in n?7:"geoPointValue"in n?8:"arrayValue"in n?9:"mapValue"in n?js(n)?4:Hf(n)?9007199254740991:Er(n)?10:11:q(28295,{value:n})}function Ir(n,e,t){if(n===e)return!0;const r=ie(n);if(r!==ie(e))return!1;switch(r){case 0:case 9007199254740991:return!0;case 1:return n.booleanValue===e.booleanValue;case 4:return yn(n).isEqual(yn(e));case 3:return(function(a,l){if(typeof a.timestampValue=="string"&&typeof l.timestampValue=="string"&&a.timestampValue.length===l.timestampValue.length)return a.timestampValue===l.timestampValue;const h=Ft(a.timestampValue),f=Ft(l.timestampValue);return h.seconds===f.seconds&&h.nanos===f.nanos})(n,e);case 5:return n.stringValue===e.stringValue;case 6:return(function(a,l){return _r(a.bytesValue).isEqual(_r(l.bytesValue))})(n,e);case 7:return n.referenceValue===e.referenceValue;case 8:return(function(a,l){return Q(a.geoPointValue.latitude)===Q(l.geoPointValue.latitude)&&Q(a.geoPointValue.longitude)===Q(l.geoPointValue.longitude)})(n,e);case 2:return(function(a,l,h){if("integerValue"in a&&"integerValue"in l)return Q(a.integerValue)===Q(l.integerValue);let f,_;if("doubleValue"in a&&"doubleValue"in l)f=Q(a.doubleValue),_=Q(l.doubleValue);else{if(!(h!=null&&h.Ee))return!1;f=Q(a.integerValue??a.doubleValue),_=Q(l.integerValue??l.doubleValue)}return f===_?!!(h!=null&&h.he)||_n(f)===_n(_):!!(h===void 0||h.Te)&&isNaN(f)&&isNaN(_)})(n,e,t);case 9:return Rf(n.arrayValue.values||[],e.arrayValue.values||[],((i,a)=>Ir(i,a,t)));case 10:case 11:return(function(a,l,h){const f=a.mapValue.fields||{},_=l.mapValue.fields||{};if(mr(f)!==mr(_))return!1;for(const b in f)if(f.hasOwnProperty(b)&&(_[b]===void 0||!Ir(f[b],_[b],h)))return!1;return!0})(n,e,t);default:return q(52216,{left:n})}}function Be(n,e){if(n===e)return 0;const t=ie(n),r=ie(e);if(t!==r)return W(t,r);switch(t){case 0:case 9007199254740991:return 0;case 1:return W(n.booleanValue,e.booleanValue);case 2:return(function(a,l){const h=Q(a.integerValue||a.doubleValue),f=Q(l.integerValue||l.doubleValue);return h<f?-1:h>f?1:h===f?0:isNaN(h)?isNaN(f)?0:-1:1})(n,e);case 3:return No(n.timestampValue,e.timestampValue);case 4:return No(yn(n),yn(e));case 5:return _s(n.stringValue,e.stringValue);case 6:return(function(a,l){const h=_r(a),f=_r(l);return h.compareTo(f)})(n.bytesValue,e.bytesValue);case 7:return(function(a,l){const h=a.split("/"),f=l.split("/");for(let _=0;_<h.length&&_<f.length;_++){const b=W(h[_],f[_]);if(b!==0)return b}return W(h.length,f.length)})(n.referenceValue,e.referenceValue);case 8:return(function(a,l){const h=W(Q(a.latitude),Q(l.latitude));return h!==0?h:W(Q(a.longitude),Q(l.longitude))})(n.geoPointValue,e.geoPointValue);case 9:return Co(n.arrayValue,e.arrayValue);case 10:return(function(a,l){var V,x,O,B;const h=a.fields||{},f=l.fields||{},_=(V=h[wr])==null?void 0:V.arrayValue,b=(x=f[wr])==null?void 0:x.arrayValue,R=W(((O=_==null?void 0:_.values)==null?void 0:O.length)||0,((B=b==null?void 0:b.values)==null?void 0:B.length)||0);return R!==0?R:Co(_,b)})(n.mapValue,e.mapValue);case 11:return(function(a,l){if(a===Zn.mapValue&&l===Zn.mapValue)return 0;if(a===Zn.mapValue)return 1;if(l===Zn.mapValue)return-1;const h=a.fields||{},f=Object.keys(h),_=l.fields||{},b=Object.keys(_);f.sort(),b.sort();for(let R=0;R<f.length&&R<b.length;++R){const V=_s(f[R],b[R]);if(V!==0)return V;const x=Be(h[f[R]],_[b[R]]);if(x!==0)return x}return W(f.length,b.length)})(n.mapValue,e.mapValue);default:throw q(23264,{Pe:t})}}function No(n,e){if(typeof n=="string"&&typeof e=="string"&&n.length===e.length)return W(n,e);const t=Ft(n),r=Ft(e),i=W(t.seconds,r.seconds);return i!==0?i:W(t.nanos,r.nanos)}function Co(n,e){const t=n.values||[],r=e.values||[];for(let i=0;i<t.length&&i<r.length;++i){const a=Be(t[i],r[i]);if(a!==void 0&&a!==0)return a}return W(t.length,r.length)}function Nt(n){return!!n&&"integerValue"in n}function yt(n){return!!n&&"doubleValue"in n}function Bt(n){return Nt(n)||yt(n)}function ws(n){return!!n&&"arrayValue"in n}function Se(n){return!!n&&"nullValue"in n}function Te(n){return!!n&&"doubleValue"in n&&isNaN(Number(n.doubleValue))}function Dt(n){return!!n&&"mapValue"in n}function Er(n){var t,r;return((r=(((t=n==null?void 0:n.mapValue)==null?void 0:t.fields)||{})[$a])==null?void 0:r.stringValue)===Ha}function vs(n){var e,t;return(t=(((e=n==null?void 0:n.mapValue)==null?void 0:e.fields)||{})[wr])==null?void 0:t.arrayValue}function hn(n){if(n.geoPointValue)return{geoPointValue:{...n.geoPointValue}};if(n.timestampValue&&typeof n.timestampValue=="object")return{timestampValue:{...n.timestampValue}};if(n.mapValue){const e={mapValue:{fields:{}}};return Bs(n.mapValue.fields,((t,r)=>e.mapValue.fields[t]=hn(r))),e}if(n.arrayValue){const e={arrayValue:{values:[]}};for(let t=0;t<(n.arrayValue.values||[]).length;++t)e.arrayValue.values[t]=hn(n.arrayValue.values[t]);return e}return{...n}}function Hf(n){return(((n.mapValue||{}).fields||{}).__type__||{}).stringValue===$f}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Tr{constructor(e){this.value=e}static empty(){return new Tr({mapValue:{}})}field(e){if(e.isEmpty())return this.value;{let t=this.value;for(let r=0;r<e.length-1;++r)if(t=(t.mapValue.fields||{})[e.get(r)],!Dt(t))return null;return t=(t.mapValue.fields||{})[e.lastSegment()],t||null}}set(e,t){this.getFieldsMap(e.popLast())[e.lastSegment()]=hn(t)}setAll(e){let t=ge.emptyPath(),r={},i=[];e.forEach(((l,h)=>{if(!t.isImmediateParentOf(h)){const f=this.getFieldsMap(t);this.applyChanges(f,r,i),r={},i=[],t=h.popLast()}l?r[h.lastSegment()]=hn(l):i.push(h.lastSegment())}));const a=this.getFieldsMap(t);this.applyChanges(a,r,i)}delete(e){const t=this.field(e.popLast());Dt(t)&&t.mapValue.fields&&delete t.mapValue.fields[e.lastSegment()]}isEqual(e){return Ir(this.value,e.value)}getFieldsMap(e){let t=this.value;t.mapValue.fields||(t.mapValue={fields:{}});for(let r=0;r<e.length;++r){let i=t.mapValue.fields[e.get(r)];Dt(i)&&i.mapValue.fields||(i={mapValue:{fields:{}}},t.mapValue.fields[e.get(r)]=i),t=i}return t.mapValue.fields}applyChanges(e,t,r){Bs(t,((i,a)=>e[i]=a));for(const i of r)delete e[i]}clone(){return new Tr(hn(this.value))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function qa(n,e){if(n.useProto3Json){if(isNaN(e))return{doubleValue:"NaN"};if(e===1/0)return{doubleValue:"Infinity"};if(e===-1/0)return{doubleValue:"-Infinity"}}return{doubleValue:_n(e)?"-0":e}}function qf(n){return{integerValue:""+n}}function zf(n,e,t){return Number.isInteger(e)&&(t!=null&&t.preferIntegers)||Nf(e)?qf(e):qa(n,e)}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class xo{constructor(e,t="asc"){this.field=e,this.dir=t}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Wf{constructor(e,t=null,r=[],i=[],a=null,l="F",h=null,f=null){this.path=e,this.collectionGroup=t,this.explicitOrderBy=r,this.filters=i,this.limit=a,this.limitType=l,this.startAt=h,this.endAt=f,this.fe=null,this.me=null,this.pe=null,this.startAt,this.endAt}}function Gf(n){return new Wf(n)}function Kf(n){const e=gf(n);if(e.fe===null){e.fe=[];const t=new Set;for(const a of e.explicitOrderBy)e.fe.push(a),t.add(a.field.canonicalString());const r=e.explicitOrderBy.length>0?e.explicitOrderBy[e.explicitOrderBy.length-1].dir:"asc";(function(l){let h=new gr(ge.comparator);return l.filters.forEach((f=>{f.getFlattenedFilters().forEach((_=>{_.isInequality()&&(h=h.add(_.field))}))})),h})(e).forEach((a=>{t.has(a.canonicalString())||a.isKeyField()||e.fe.push(new xo(a,r))})),t.has(ge.keyField().canonicalString())||e.fe.push(new xo(ge.keyField(),r))}return e.fe}function Jf(n){return(e,t)=>{let r=!1;for(const i of Kf(n)){const a=Yf(i,e,t);if(a!==0)return a;r=r||i.field.isKeyField()}return 0}}function Yf(n,e,t){const r=n.field.isKeyField()?at.comparator(e.key,t.key):(function(a,l,h){const f=l.data.field(a),_=h.data.field(a);return f!==null&&_!==null?Be(f,_):q(42886)})(n.field,e,t);switch(n.dir){case"asc":return r;case"desc":return-1*r;default:return q(19790,{direction:n.dir})}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Oo,F;(F=Oo||(Oo={}))[F.OK=0]="OK",F[F.CANCELLED=1]="CANCELLED",F[F.UNKNOWN=2]="UNKNOWN",F[F.INVALID_ARGUMENT=3]="INVALID_ARGUMENT",F[F.DEADLINE_EXCEEDED=4]="DEADLINE_EXCEEDED",F[F.NOT_FOUND=5]="NOT_FOUND",F[F.ALREADY_EXISTS=6]="ALREADY_EXISTS",F[F.PERMISSION_DENIED=7]="PERMISSION_DENIED",F[F.UNAUTHENTICATED=16]="UNAUTHENTICATED",F[F.RESOURCE_EXHAUSTED=8]="RESOURCE_EXHAUSTED",F[F.FAILED_PRECONDITION=9]="FAILED_PRECONDITION",F[F.ABORTED=10]="ABORTED",F[F.OUT_OF_RANGE=11]="OUT_OF_RANGE",F[F.UNIMPLEMENTED=12]="UNIMPLEMENTED",F[F.INTERNAL=13]="INTERNAL",F[F.UNAVAILABLE=14]="UNAVAILABLE",F[F.DATA_LOSS=15]="DATA_LOSS";/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */new Us([4294967295,4294967295],0);function Is(n,e){return n.useProto3Json?`${new Date(1e3*e.seconds).toISOString().replace(/\.\d*/,"").replace("Z","")}.${("000000000"+e.nanoseconds).slice(-9)}Z`:{seconds:""+e.seconds,nanos:e.nanoseconds}}function za(n){const e=Ft(n);return new Z(e.seconds,e.nanos)}function Xf(n,e){return n.useProto3Json?e.toBase64():e.toUint8Array()}function us(n,e){return Is(n,e.toTimestamp())}function Wa(n,e){return Qf(n,e).canonicalString()}function Qf(n,e){const t=(function(i){return new pe(["projects",i.projectId,"databases",i.database])})(n).child("documents");return e===void 0?t:t.child(e)}function Zf(n,e){return Wa(n.databaseId,e.path)}function Ga(n){return!!n&&typeof n._toProto=="function"&&n._protoValueType==="ProtoValue"}function wn(n,e){const t={fields:{}};return e.forEach(((r,i)=>{if(typeof i!="string")throw new Error(`Cannot encode map with non-string key: ${i}`);t.fields[i]=r._toProto(n)})),{mapValue:t}}function Ka(n){return{stringValue:n}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class be{constructor(e){this._byteString=e}static fromBase64String(e){try{return new be(Ee.fromBase64String(e))}catch(t){throw new L(M.INVALID_ARGUMENT,"Failed to construct data from Base64 string: "+t)}}static fromUint8Array(e){return new be(Ee.fromUint8Array(e))}toBase64(){return this._byteString.toBase64()}toUint8Array(){return this._byteString.toUint8Array()}toString(){return"Bytes(base64: "+this.toBase64()+")"}isEqual(e){return this._byteString.isEqual(e._byteString)}toJSON(){return{type:be._jsonSchemaVersion,bytes:this.toBase64()}}static fromJSON(e){if(On(e,be._jsonSchema))return be.fromBase64String(e.bytes)}}be._jsonSchemaVersion="firestore/bytes/1.0",be._jsonSchema={type:G("string",be._jsonSchemaVersion),bytes:G("string")};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class $s{constructor(...e){for(let t=0;t<e.length;++t)if(e[t].length===0)throw new L(M.INVALID_ARGUMENT,"Invalid field name at argument $(i + 1). Field names must not be empty.");this._internalPath=new ge(e)}isEqual(e){return this._internalPath.isEqual(e._internalPath)}}function ed(){return new $s(mn)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ja{constructor(e){this._methodName=e}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ze{constructor(e,t){if(!isFinite(e)||e<-90||e>90)throw new L(M.INVALID_ARGUMENT,"Latitude must be a number between -90 and 90, but was: "+e);if(!isFinite(t)||t<-180||t>180)throw new L(M.INVALID_ARGUMENT,"Longitude must be a number between -180 and 180, but was: "+t);this._lat=e,this._long=t}get latitude(){return this._lat}get longitude(){return this._long}isEqual(e){return this._lat===e._lat&&this._long===e._long}_compareTo(e){return W(this._lat,e._lat)||W(this._long,e._long)}toJSON(){return{latitude:this._lat,longitude:this._long,type:ze._jsonSchemaVersion}}static fromJSON(e){if(On(e,ze._jsonSchema))return new ze(e.latitude,e.longitude)}}function td(n){const e={};return n.timeoutSeconds!==void 0&&(e.timeoutSeconds=n.timeoutSeconds),e}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */ze._jsonSchemaVersion="firestore/geoPoint/1.0",ze._jsonSchema={type:G("string",ze._jsonSchemaVersion),latitude:G("number"),longitude:G("number")};class nd{constructor(e,t,r=1e3,i=1.5,a=6e4){this.Tn=e,this.timerId=t,this.Pn=r,this.Rn=i,this.In=a,this.An=0,this.Vn=null,this.dn=Date.now(),this.reset()}reset(){this.An=0}fn(){this.An=this.In}mn(e){this.cancel();const t=Math.floor(this.An+this.pn()),r=Math.max(0,Date.now()-this.dn),i=Math.max(0,t-r);i>0&&Pe("ExponentialBackoff",`Backing off for ${i} ms (base delay: ${this.An} ms, delay with jitter: ${t} ms, last attempt: ${r} ms ago)`),this.Vn=this.Tn.enqueueAfterDelay(this.timerId,i,(()=>(this.dn=Date.now(),e()))),this.An*=this.Rn,this.An<this.Pn&&(this.An=this.Pn),this.An>this.In&&(this.An=this.In)}gn(){this.Vn!==null&&(this.Vn.skipDelay(),this.Vn=null)}cancel(){this.Vn!==null&&(this.Vn.cancel(),this.Vn=null)}pn(){return(Math.random()-.5)*this.An}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const rd="ComponentProvider",Do=new Map;/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const sd=41943040;/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const id=1048576;/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ya="firestore.googleapis.com",Lo=!0;class Uo{constructor(e){if(e.host===void 0){if(e.ssl!==void 0)throw new L(M.INVALID_ARGUMENT,"Can't provide ssl option if host option is not set");this.host=Ya,this.ssl=Lo}else this.host=e.host,this.ssl=e.ssl??Lo;if(this.isUsingEmulator=e.emulatorOptions!==void 0,this.credentials=e.credentials,this.ignoreUndefinedProperties=!!e.ignoreUndefinedProperties,this.localCache=e.localCache,e.cacheSizeBytes===void 0)this.cacheSizeBytes=sd;else{if(e.cacheSizeBytes!==-1&&e.cacheSizeBytes<id)throw new L(M.INVALID_ARGUMENT,"cacheSizeBytes must be at least 1048576");this.cacheSizeBytes=e.cacheSizeBytes}Sf("experimentalForceLongPolling",e.experimentalForceLongPolling,"experimentalAutoDetectLongPolling",e.experimentalAutoDetectLongPolling),this.experimentalForceLongPolling=!!e.experimentalForceLongPolling,this.experimentalForceLongPolling?this.experimentalAutoDetectLongPolling=!1:e.experimentalAutoDetectLongPolling===void 0?this.experimentalAutoDetectLongPolling=!0:this.experimentalAutoDetectLongPolling=!!e.experimentalAutoDetectLongPolling,this.experimentalLongPollingOptions=td(e.experimentalLongPollingOptions??{}),(function(r){if(r.timeoutSeconds!==void 0){if(isNaN(r.timeoutSeconds))throw new L(M.INVALID_ARGUMENT,`invalid long polling timeout: ${r.timeoutSeconds} (must not be NaN)`);if(r.timeoutSeconds<5)throw new L(M.INVALID_ARGUMENT,`invalid long polling timeout: ${r.timeoutSeconds} (minimum allowed value is 5)`);if(r.timeoutSeconds>30)throw new L(M.INVALID_ARGUMENT,`invalid long polling timeout: ${r.timeoutSeconds} (maximum allowed value is 30)`)}})(this.experimentalLongPollingOptions),this.useFetchStreams=!!e.useFetchStreams}isEqual(e){return this.host===e.host&&this.ssl===e.ssl&&this.credentials===e.credentials&&this.cacheSizeBytes===e.cacheSizeBytes&&this.experimentalForceLongPolling===e.experimentalForceLongPolling&&this.experimentalAutoDetectLongPolling===e.experimentalAutoDetectLongPolling&&(function(r,i){return r.timeoutSeconds===i.timeoutSeconds})(this.experimentalLongPollingOptions,e.experimentalLongPollingOptions)&&this.ignoreUndefinedProperties===e.ignoreUndefinedProperties&&this.useFetchStreams===e.useFetchStreams}}class Xa{constructor(e,t,r,i){this._authCredentials=e,this._appCheckCredentials=t,this._databaseId=r,this._app=i,this.type="firestore-lite",this._persistenceKey="(lite)",this._settings=new Uo({}),this._settingsFrozen=!1,this._emulatorOptions={},this._terminateTask="notTerminated"}get app(){if(!this._app)throw new L(M.FAILED_PRECONDITION,"Firestore was not initialized using the Firebase SDK. 'app' is not available");return this._app}get _initialized(){return this._settingsFrozen}get _terminated(){return this._terminateTask!=="notTerminated"}_setSettings(e){if(this._settingsFrozen)throw new L(M.FAILED_PRECONDITION,"Firestore has already been started and its settings can no longer be changed. You can only modify settings before calling any other methods on a Firestore object.");this._settings=new Uo(e),this._emulatorOptions=e.emulatorOptions||{},e.credentials!==void 0&&(this._authCredentials=(function(r){if(!r)return new mf;switch(r.type){case"firstParty":return new vf(r.sessionIndex||"0",r.iamToken||null,r.authTokenFactory||null);case"provider":return r.client;default:throw new L(M.INVALID_ARGUMENT,"makeAuthCredentialsProvider failed due to invalid credential type")}})(e.credentials))}_getSettings(){return this._settings}_getEmulatorOptions(){return this._emulatorOptions}_freezeSettings(){return this._settingsFrozen=!0,this._settings}_delete(){return this._terminateTask==="notTerminated"&&(this._terminateTask=this._terminate()),this._terminateTask}async _restart(){this._terminateTask==="notTerminated"?await this._terminate():this._terminateTask="notTerminated"}toJSON(){return{app:this._app,databaseId:this._databaseId,settings:this._settings}}_terminate(){return(function(t){const r=Do.get(t);r&&(Pe(rd,"Removing Datastore"),Do.delete(t),r.terminate())})(this),Promise.resolve()}}function od(n,e,t,r={}){var _;n=Vf(n,Xa);const i=Pn(e),a=n._getSettings(),l={...a,emulatorOptions:n._getEmulatorOptions()},h=`${e}:${t}`;i&&bs(`https://${h}`),a.host!==Ya&&a.host!==h&&Cn("Host has been set in both settings() and connectFirestoreEmulator(), emulator host will be used.");const f={...a,host:h,ssl:i,emulatorOptions:r};if(!vt(f,l)&&(n._setSettings(f),r.mockUserToken)){let b,R;if(typeof r.mockUserToken=="string")b=r.mockUserToken,R=le.MOCK_USER;else{b=ra(r.mockUserToken,(_=n._app)==null?void 0:_.options.projectId);const V=r.mockUserToken.sub||r.mockUserToken.user_id;if(!V)throw new L(M.INVALID_ARGUMENT,"mockUserToken must contain 'sub' or 'user_id' field!");R=new le(V)}n._authCredentials=new _f(new Ba(b,R))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Hs{constructor(e,t,r){this.converter=t,this._query=r,this.type="query",this.firestore=e}withConverter(e){return new Hs(this.firestore,e,this._query)}}class ve{constructor(e,t,r){this.converter=t,this._key=r,this.type="document",this.firestore=e}get _path(){return this._key.path}get id(){return this._key.path.lastSegment()}get path(){return this._key.path.canonicalString()}get parent(){return new qs(this.firestore,this.converter,this._key.path.popLast())}withConverter(e){return new ve(this.firestore,e,this._key)}toJSON(){return{type:ve._jsonSchemaVersion,referencePath:this._key.toString()}}static fromJSON(e,t,r){if(On(t,ve._jsonSchema))return new ve(e,r||null,new at(pe.fromString(t.referencePath)))}}ve._jsonSchemaVersion="firestore/documentReference/1.0",ve._jsonSchema={type:G("string",ve._jsonSchemaVersion),referencePath:G("string")};class qs extends Hs{constructor(e,t,r){super(e,t,Gf(r)),this._path=r,this.type="collection"}get id(){return this._query.path.lastSegment()}get path(){return this._query.path.canonicalString()}get parent(){const e=this._path.popLast();return e.isEmpty()?null:new ve(this.firestore,null,new at(e))}withConverter(e){return new qs(this.firestore,e,this._path)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ie{constructor(e){this._values=(e||[]).map((t=>t))}toArray(){return this._values.map((e=>e))}isEqual(e){return(function(r,i){if(r.length!==i.length)return!1;for(let a=0;a<r.length;++a)if(r[a]!==i[a])return!1;return!0})(this._values,e._values)}toJSON(){return{type:Ie._jsonSchemaVersion,vectorValues:this._values}}static fromJSON(e){if(On(e,Ie._jsonSchema)){if(Array.isArray(e.vectorValues)&&e.vectorValues.every((t=>typeof t=="number")))return new Ie(e.vectorValues);throw new L(M.INVALID_ARGUMENT,"Expected 'vectorValues' field to be a number array")}}}Ie._jsonSchemaVersion="firestore/vectorValue/1.0",Ie._jsonSchema={type:G("string",Ie._jsonSchemaVersion),vectorValues:G("object")};function ad(n){switch(n){case 0:case 2:case 1:return!0;case 3:case 4:return!1;default:throw q(40011,{dataSource:n})}}function vn(n,e,t){if(Qa(n=Le(n)))return ld("Unsupported field value:",e,n),ud(n,e);if(n instanceof Ja)return(function(i,a){if(!ad(a.dataSource))throw a.createError(`${i._methodName}() can only be used with update() and set()`);if(!a.path)throw a.createError(`${i._methodName}() is not currently supported inside arrays`);const l=i._toFieldTransform(a);l&&a.fieldTransforms.push(l)})(n,e),null;if(n===void 0&&e.ignoreUndefinedProperties)return null;if(e.path&&e.fieldMask.push(e.path),n instanceof Array){if(e.settings.arrayElement&&e.dataSource!==4)throw e.createError("Nested arrays are not supported");return(function(i,a){const l=[];let h=0;for(const f of i){let _=vn(f,a.childContextForArray(h));_==null&&(_={nullValue:"NULL_VALUE"}),l.push(_),h++}return{arrayValue:{values:l}}})(n,e)}return(function(i,a,l){if((i=Le(i))===null)return{nullValue:"NULL_VALUE"};if(typeof i=="number")return zf(a.serializer,i,l);if(typeof i=="boolean")return{booleanValue:i};if(typeof i=="string")return{stringValue:i};if(i instanceof Date){const h=Z.fromDate(i);return{timestampValue:Is(a.serializer,h)}}if(i instanceof Z){const h=new Z(i.seconds,1e3*Math.floor(i.nanoseconds/1e3));return{timestampValue:Is(a.serializer,h)}}if(i instanceof ze)return{geoPointValue:{latitude:i.latitude,longitude:i.longitude}};if(i instanceof be)return{bytesValue:Xf(a.serializer,i._byteString)};if(i instanceof ve){const h=a.databaseId,f=i.firestore._databaseId;if(!f.isEqual(h))throw a.createError(`Document reference is for database ${f.projectId}/${f.database} but should be for database ${h.projectId}/${h.database}`);return{referenceValue:Wa(i.firestore._databaseId||a.databaseId,i._key.path)}}if(i instanceof Ie)return(function(f,_){const b=f instanceof Ie?f.toArray():f;return{mapValue:{fields:{[$a]:{stringValue:Ha},[wr]:{arrayValue:{values:b.map((V=>{if(typeof V!="number")throw _.createError("VectorValues must only contain numeric values.");return qa(_.serializer,V)}))}}}}}})(i,a);if(Ga(i))return i._toProto(a.serializer);throw a.createError(`Unsupported field value: ${Fs(i)}`)})(n,e,t)}function ud(n,e){const t={};return Of(n)?e.path&&e.path.length>0&&e.fieldMask.push(e.path):Bs(n,((r,i)=>{const a=vn(i,e.childContextForField(r));a!=null&&(t[r]=a)})),{mapValue:{fields:t}}}function Qa(n){return!(typeof n!="object"||n===null||n instanceof Array||n instanceof Date||n instanceof Z||n instanceof ze||n instanceof be||n instanceof ve||n instanceof Ja||n instanceof Ie||Ga(n))}function ld(n,e,t){if(!Qa(t)||!xn(t)){const r=Fs(t);throw r==="an object"?e.createError(n+" a custom object"):e.createError(n+" "+r)}}function zs(n,e,t){if((e=Le(e))instanceof $s)return e._internalPath;if(typeof e=="string")return hd(n,e);throw Es("Field path arguments must be of type string or ",n)}const cd=new RegExp("[~\\*/\\[\\]]");function hd(n,e,t){if(e.search(cd)>=0)throw Es(`Invalid field path (${e}). Paths must not contain '~', '*', '/', '[', or ']'`,n);try{return new $s(...e.split("."))._internalPath}catch{throw Es(`Invalid field path (${e}). Paths must not be empty, begin with '.', end with '.', or contain '..'`,n)}}function Es(n,e,t,r,i){let a=`Function ${e}() called with invalid data`;a+=". ";let l="";return new L(M.INVALID_ARGUMENT,a+n+l)}function fd(n){return typeof n._readUserData=="function"}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class _e{constructor(e){this.optionDefinitions=e}_getKnownOptions(e,t){const r=Tr.empty();for(const i in this.optionDefinitions)if(this.optionDefinitions.hasOwnProperty(i)){const a=this.optionDefinitions[i];if(i in e){const l=e[i];let h;a.nestedOptions&&xn(l)?h={mapValue:{fields:new _e(a.nestedOptions).getOptionsProto(t,l)}}:l&&(h=vn(l,t)??void 0),h&&r.set(ge.fromServerFormat(a.serverName),h)}}return r}getOptionsProto(e,t,r){const i=this._getKnownOptions(t,e);if(r){const a=new Map(xf(r,((l,h)=>[ge.fromServerFormat(h),l!==void 0?vn(l,e):null])));i.setAll(a)}return i.value.mapValue.fields??{}}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function dd(n){return typeof n=="object"&&n!==null&&!!("nullValue"in n&&(n.nullValue===null||n.nullValue==="NULL_VALUE")||"booleanValue"in n&&(n.booleanValue===null||typeof n.booleanValue=="boolean")||"integerValue"in n&&(n.integerValue===null||typeof n.integerValue=="number"||typeof n.integerValue=="string")||"doubleValue"in n&&(n.doubleValue===null||typeof n.doubleValue=="number")||"timestampValue"in n&&(n.timestampValue===null||(function(t){return typeof t=="object"&&t!==null&&"seconds"in t&&(t.seconds===null||typeof t.seconds=="number"||typeof t.seconds=="string")&&"nanos"in t&&(t.nanos===null||typeof t.nanos=="number")})(n.timestampValue))||"stringValue"in n&&(n.stringValue===null||typeof n.stringValue=="string")||"bytesValue"in n&&(n.bytesValue===null||n.bytesValue instanceof Uint8Array)||"referenceValue"in n&&(n.referenceValue===null||typeof n.referenceValue=="string")||"geoPointValue"in n&&(n.geoPointValue===null||(function(t){return typeof t=="object"&&t!==null&&"latitude"in t&&(t.latitude===null||typeof t.latitude=="number")&&"longitude"in t&&(t.longitude===null||typeof t.longitude=="number")})(n.geoPointValue))||"arrayValue"in n&&(n.arrayValue===null||(function(t){return typeof t=="object"&&t!==null&&!(!("values"in t)||t.values!==null&&!Array.isArray(t.values))})(n.arrayValue))||"mapValue"in n&&(n.mapValue===null||(function(t){return typeof t=="object"&&t!==null&&!(!("fields"in t)||t.fields!==null&&!xn(t.fields))})(n.mapValue))||"fieldReferenceValue"in n&&(n.fieldReferenceValue===null||typeof n.fieldReferenceValue=="string")||"functionValue"in n&&(n.functionValue===null||(function(t){return typeof t=="object"&&t!==null&&!(!("name"in t)||t.name!==null&&typeof t.name!="string"||!("args"in t)||t.args!==null&&!Array.isArray(t.args))})(n.functionValue))||"pipelineValue"in n&&(n.pipelineValue===null||(function(t){return typeof t=="object"&&t!==null&&!(!("stages"in t)||t.stages!==null&&!Array.isArray(t.stages))})(n.pipelineValue)))}function pd(n){return new Ie(n)}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function P(n){let e;return n instanceof bt?n:(e=xn(n)?Id(n):n instanceof Array?Ed(n):Za(n,void 0),e)}function ls(n){if(n instanceof bt)return n;if(n instanceof Ie)return In(n);if(Array.isArray(n))return In(pd(n));throw new Error("Unsupported value: "+typeof n)}function Ws(n){return Cf(n)?_d(n):P(n)}class bt{constructor(){this._protoValueType="ProtoValue"}add(e){return new A("add",[this,P(e)],"add")}asBoolean(){if(this instanceof ht)return this;if(this instanceof Dn)return new eu(this);if(this instanceof Gs)return new vd(this);if(this instanceof A)return new wd(this);throw new L("invalid-argument",`Conversion of type ${typeof this} to BooleanExpression not supported.`)}subtract(e){return new A("subtract",[this,P(e)],"subtract")}multiply(e){return new A("multiply",[this,P(e)],"multiply")}divide(e){return new A("divide",[this,P(e)],"divide")}mod(e){return new A("mod",[this,P(e)],"mod")}equal(e){return new A("equal",[this,P(e)],"equal").asBoolean()}notEqual(e){return new A("not_equal",[this,P(e)],"notEqual").asBoolean()}lessThan(e){return new A("less_than",[this,P(e)],"lessThan").asBoolean()}lessThanOrEqual(e){return new A("less_than_or_equal",[this,P(e)],"lessThanOrEqual").asBoolean()}greaterThan(e){return new A("greater_than",[this,P(e)],"greaterThan").asBoolean()}greaterThanOrEqual(e){return new A("greater_than_or_equal",[this,P(e)],"greaterThanOrEqual").asBoolean()}arrayConcat(e,...t){const r=[e,...t].map((i=>P(i)));return new A("array_concat",[this,...r],"arrayConcat")}arrayContains(e){return new A("array_contains",[this,P(e)],"arrayContains").asBoolean()}arrayContainsAll(e){const t=Array.isArray(e)?new an(e.map(P),"arrayContainsAll"):e;return new A("array_contains_all",[this,t],"arrayContainsAll").asBoolean()}arrayContainsAny(e){const t=Array.isArray(e)?new an(e.map(P),"arrayContainsAny"):e;return new A("array_contains_any",[this,t],"arrayContainsAny").asBoolean()}arrayReverse(){return new A("array_reverse",[this])}arrayLength(){return new A("array_length",[this],"arrayLength")}equalAny(e){const t=Array.isArray(e)?new an(e.map(P),"equalAny"):e;return new A("equal_any",[this,t],"equalAny").asBoolean()}notEqualAny(e){const t=Array.isArray(e)?new an(e.map(P),"notEqualAny"):e;return new A("not_equal_any",[this,t],"notEqualAny").asBoolean()}exists(){return new A("exists",[this],"exists").asBoolean()}charLength(){return new A("char_length",[this],"charLength")}like(e){return new A("like",[this,P(e)],"like").asBoolean()}regexContains(e){return new A("regex_contains",[this,P(e)],"regexContains").asBoolean()}regexFind(e){return new A("regex_find",[this,P(e)],"regexFind")}regexFindAll(e){return new A("regex_find_all",[this,P(e)],"regexFindAll")}regexMatch(e){return new A("regex_match",[this,P(e)],"regexMatch").asBoolean()}stringContains(e){return new A("string_contains",[this,P(e)],"stringContains").asBoolean()}startsWith(e){return new A("starts_with",[this,P(e)],"startsWith").asBoolean()}endsWith(e){return new A("ends_with",[this,P(e)],"endsWith").asBoolean()}toLower(){return new A("to_lower",[this],"toLower")}toUpper(){return new A("to_upper",[this],"toUpper")}trim(e){const t=[this];return e&&t.push(P(e)),new A("trim",t,"trim")}ltrim(e){const t=[this];return e&&t.push(P(e)),new A("ltrim",t,"ltrim")}rtrim(e){const t=[this];return e&&t.push(P(e)),new A("rtrim",t,"rtrim")}type(){return new A("type",[this])}isType(e){return new A("is_type",[this,In(e)],"isType").asBoolean()}stringConcat(e,...t){const r=[e,...t].map(P);return new A("string_concat",[this,...r],"stringConcat")}stringIndexOf(e){return new A("string_index_of",[this,P(e)],"stringIndexOf")}stringRepeat(e){return new A("string_repeat",[this,P(e)],"stringRepeat")}stringReplaceAll(e,t){return new A("string_replace_all",[this,P(e),P(t)],"stringReplaceAll")}stringReplaceOne(e,t){return new A("string_replace_one",[this,P(e),P(t)],"stringReplaceOne")}concat(e,...t){const r=[e,...t].map(P);return new A("concat",[this,...r],"concat")}reverse(){return new A("reverse",[this],"reverse")}arrayFilter(e,t){return new A("array_filter",[this,P(e),t],"arrayFilter")}arrayTransform(e,t){return new A("array_transform",[this,P(e),t],"arrayTransform")}arrayTransformWithIndex(e,t,r){return new A("array_transform",[this,P(e),P(t),r],"arrayTransformWithIndex")}arraySlice(e,t){const r=[this,P(e)];return t!==void 0&&r.push(P(t)),new A("array_slice",r,"arraySlice")}arrayFirst(){return new A("array_first",[this],"arrayFirst")}arrayFirstN(e){return new A("array_first_n",[this,P(e)],"arrayFirstN")}arrayLast(){return new A("array_last",[this],"arrayLast")}arrayLastN(e){return new A("array_last_n",[this,P(e)],"arrayLastN")}arrayMaximum(){return new A("maximum",[this],"arrayMaximum")}arrayMaximumN(e){return new A("maximum_n",[this,P(e)],"arrayMaximumN")}arrayMinimum(){return new A("minimum",[this],"arrayMinimum")}arrayMinimumN(e){return new A("minimum_n",[this,P(e)],"arrayMinimumN")}arrayIndexOf(e){return new A("array_index_of",[this,P(e),P("first")],"arrayIndexOf")}arrayLastIndexOf(e){return new A("array_index_of",[this,P(e),P("last")],"arrayLastIndexOf")}arrayIndexOfAll(e){return new A("array_index_of_all",[this,P(e)],"arrayIndexOfAll")}byteLength(){return new A("byte_length",[this],"byteLength")}ceil(){return new A("ceil",[this])}floor(){return new A("floor",[this])}abs(){return new A("abs",[this])}exp(){return new A("exp",[this])}mapGet(e){return new A("map_get",[this,In(e)],"mapGet")}mapSet(e,t,...r){const i=[this,P(e),P(t),...r.map(P)];return new A("map_set",i,"mapSet")}mapKeys(){return new A("map_keys",[this],"mapKeys")}mapValues(){return new A("map_values",[this],"mapValues")}mapEntries(){return new A("map_entries",[this],"mapEntries")}getField(e){return new A("get_field",[this,P(e)],"get_field")}count(){return de._create("count",[this],"count")}sum(){return de._create("sum",[this],"sum")}average(){return de._create("average",[this],"average")}minimum(){return de._create("minimum",[this],"minimum")}maximum(){return de._create("maximum",[this],"maximum")}first(){return de._create("first",[this],"first")}last(){return de._create("last",[this],"last")}arrayAgg(){return de._create("array_agg",[this],"arrayAgg")}arrayAggDistinct(){return de._create("array_agg_distinct",[this],"arrayAggDistinct")}countDistinct(){return de._create("count_distinct",[this],"countDistinct")}logicalMaximum(e,...t){const r=[e,...t];return new A("maximum",[this,...r.map(P)],"logicalMaximum")}logicalMinimum(e,...t){const r=[e,...t];return new A("minimum",[this,...r.map(P)],"minimum")}vectorLength(){return new A("vector_length",[this],"vectorLength")}cosineDistance(e){return new A("cosine_distance",[this,ls(e)],"cosineDistance")}dotProduct(e){return new A("dot_product",[this,ls(e)],"dotProduct")}euclideanDistance(e){return new A("euclidean_distance",[this,ls(e)],"euclideanDistance")}unixMicrosToTimestamp(){return new A("unix_micros_to_timestamp",[this],"unixMicrosToTimestamp")}timestampToUnixMicros(){return new A("timestamp_to_unix_micros",[this],"timestampToUnixMicros")}unixMillisToTimestamp(){return new A("unix_millis_to_timestamp",[this],"unixMillisToTimestamp")}timestampToUnixMillis(){return new A("timestamp_to_unix_millis",[this],"timestampToUnixMillis")}unixSecondsToTimestamp(){return new A("unix_seconds_to_timestamp",[this],"unixSecondsToTimestamp")}timestampToUnixSeconds(){return new A("timestamp_to_unix_seconds",[this],"timestampToUnixSeconds")}timestampAdd(e,t){return new A("timestamp_add",[this,P(e),P(t)],"timestampAdd")}timestampSubtract(e,t){return new A("timestamp_subtract",[this,P(e),P(t)],"timestampSubtract")}timestampDiff(e,t){return new A("timestamp_diff",[this,Ws(e),P(t)],"timestampDiff")}timestampExtract(e,t){const r=[this,P(e)];return t&&r.push(P(t)),new A("timestamp_extract",r,"timestampExtract")}documentId(){return new A("document_id",[this],"documentId")}parent(){return new A("parent",[this],"parent")}substring(e,t){const r=P(e);return new A("substring",t===void 0?[this,r]:[this,r,P(t)],"substring")}arrayGet(e){return new A("array_get",[this,P(e)],"arrayGet")}isError(){return new A("is_error",[this],"isError").asBoolean()}ifError(e){const t=new A("if_error",[this,P(e)],"ifError");return e instanceof ht?t.asBoolean():t}isAbsent(){return new A("is_absent",[this],"isAbsent").asBoolean()}mapRemove(e){return new A("map_remove",[this,P(e)],"mapRemove")}mapMerge(e,...t){const r=P(e),i=t.map(P);return new A("map_merge",[this,r,...i],"mapMerge")}pow(e){return new A("pow",[this,P(e)])}trunc(e){return e===void 0?new A("trunc",[this]):new A("trunc",[this,P(e)],"trunc")}round(e){return e===void 0?new A("round",[this]):new A("round",[this,P(e)],"round")}collectionId(){return new A("collection_id",[this])}length(){return new A("length",[this])}ln(){return new A("ln",[this])}sqrt(){return new A("sqrt",[this])}stringReverse(){return new A("string_reverse",[this])}ifAbsent(e){return new A("if_absent",[this,P(e)],"ifAbsent")}ifNull(e){return new A("if_null",[this,P(e)],"ifNull")}coalesce(e,...t){return new A("coalesce",[this,P(e),...t.map(P)],"coalesce")}join(e){return new A("join",[this,P(e)],"join")}log10(){return new A("log10",[this])}arraySum(){return new A("sum",[this])}split(e){return new A("split",[this,P(e)])}timestampTruncate(e,t){const r=[this,P(e)];return t&&r.push(P(t)),new A("timestamp_trunc",r)}ascending(){return Td(this)}descending(){return Ad(this)}as(e){return new md(this,e,"as")}}class de{constructor(e,t){this.name=e,this.params=t,this.exprType="AggregateFunction",this._protoValueType="ProtoValue"}static _create(e,t,r){const i=new de(e,t);return i._methodName=r,i}as(e){return new gd(this,e,"as")}_toProto(e){return{functionValue:{name:this.name,args:this.params.map((t=>t._toProto(e)))}}}_readUserData(e){e=this._methodName?e.contextWith({methodName:this._methodName}):e,this.params.forEach((t=>t._readUserData(e)))}}class gd{constructor(e,t,r){this.aggregate=e,this.alias=t,this._methodName=r}_readUserData(e){this.aggregate._readUserData(e)}}class md{constructor(e,t,r){this.expr=e,this.alias=t,this._methodName=r,this.exprType="AliasedExpression",this.selectable=!0}_readUserData(e){this.expr._readUserData(e)}}class an extends bt{constructor(e,t){super(),this.Rr=e,this._methodName=t,this.expressionType="ListOfExpressions"}_toProto(e){return{arrayValue:{values:this.Rr.map((t=>t._toProto(e)))}}}_readUserData(e){this.Rr.forEach((t=>t._readUserData(e)))}}class Gs extends bt{constructor(e,t){super(),this.fieldPath=e,this._methodName=t,this.expressionType="Field",this.selectable=!0}get _fieldPath(){return this.fieldPath}get fieldName(){return this.fieldPath.canonicalString()}get alias(){return this.fieldName}get expr(){return this}geoDistance(e){return new A("geo_distance",[this,P(e)],"geoDistance")}_toProto(e){return{fieldReferenceValue:this.fieldPath.canonicalString()}}_readUserData(e){}}function _d(n){return yd(n,"field")}function yd(n,e){return new Gs(typeof n=="string"?mn===n?ed()._internalPath:zs("field",n):n._internalPath,e)}class Dn extends bt{constructor(e,t){super(),this.value=e,this._methodName=t,this.expressionType="Constant"}static _fromProto(e){const t=new Dn(e,void 0);return t._protoValue=e,t}_toProto(e){return U(this._protoValue!==void 0,237),this._protoValue}_getValue(){return this._protoValue}_readUserData(e){e=this._methodName?e.contextWith({methodName:this._methodName}):e,dd(this._protoValue)||(this._protoValue=vn(this.value,e))}}function In(n,e){return Za(n,"constant")}function Za(n,e){const t=new Dn(n,e);return typeof n=="boolean"?new eu(t):t}class A extends bt{constructor(e,t,r,i){super(),this.name=e,this.params=t,this.expressionType="Function",this._optionsProto=void 0,r!==void 0&&(this._methodName=r),i!==void 0&&(this._options=i)}get _optionsUtil(){return new _e({})}_toProto(e){const t={functionValue:{name:this.name,args:this.params.map((r=>r._toProto(e)))}};return this._optionsProto&&(t.functionValue.options=this._optionsProto),t}_readUserData(e){e=this._methodName?e.contextWith({methodName:this._methodName}):e,this.params.forEach((t=>t._readUserData(e))),this._options&&(this._optionsProto=this._optionsUtil.getOptionsProto(e,this._options))}}class ht extends bt{get _methodName(){return this._expr._methodName}countIf(){return de._create("count_if",[this],"countIf")}not(){return new A("not",[this],"not").asBoolean()}conditional(e,t){return new A("conditional",[this,e,t],"conditional")}ifError(e){const t=P(e),r=new A("if_error",[this,t],"ifError");return t instanceof ht?r.asBoolean():r}_toProto(e){return this._expr._toProto(e)}_readUserData(e){this._expr._readUserData(e)}}class wd extends ht{constructor(e){super(),this._expr=e,this.expressionType="Function"}}class eu extends ht{constructor(e){super(),this._expr=e,this.expressionType="Constant"}_getValue(){return this._expr._getValue()}}class vd extends ht{constructor(e){super(),this._expr=e,this.expressionType="Field"}}function Id(n,e){const t=[];for(const r in n)if(Object.prototype.hasOwnProperty.call(n,r)){const i=n[r];t.push(In(r)),t.push(P(i))}return new A("map",t,"map")}function Ed(n){return(function(t,r){return new A("array",t.map((i=>P(i))),r)})(n,"array")}function Td(n){return new tu(Ws(n),"ascending","ascending")}function Ad(n){return new tu(Ws(n),"descending","descending")}class tu{constructor(e,t,r){this.expr=e,this.direction=t,this._methodName=r,this._protoValueType="ProtoValue"}_toProto(e){return{mapValue:{fields:{direction:Ka(this.direction),expression:this.expr._toProto(e)}}}}_readUserData(e){this.expr._readUserData(e)}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class je{constructor(e){this.optionsProto=void 0,{rawOptions:this.rawOptions,...this.knownOptions}=e}_readUserData(e){this.optionsProto=this._optionsUtil.getOptionsProto(e,this.knownOptions,this.rawOptions)}_toProto(e){return{name:this._name,options:this.optionsProto}}}class bd extends je{get _name(){return"add_fields"}get _optionsUtil(){return new _e({})}constructor(e,t){super(t),this.fields=e}_toProto(e){return{...super._toProto(e),args:[wn(e,this.fields)]}}_readUserData(e){super._readUserData(e),Tt(this.fields,e)}}class Rd extends je{get _name(){return"aggregate"}get _optionsUtil(){return new _e({})}constructor(e,t,r){super(r),this.groups=e,this.accumulators=t}_toProto(e){return{...super._toProto(e),args:[wn(e,this.accumulators),wn(e,this.groups)]}}_readUserData(e){super._readUserData(e),Tt(this.groups,e),Tt(this.accumulators,e)}}class Pd extends je{get _name(){return"distinct"}get _optionsUtil(){return new _e({})}constructor(e,t){super(t),this.groups=e}_toProto(e){return{...super._toProto(e),args:[wn(e,this.groups)]}}_readUserData(e){super._readUserData(e),Tt(this.groups,e)}}class Sd extends je{get _name(){return"collection"}get _optionsUtil(){return new _e({forceIndex:{serverName:"force_index"}})}constructor(e,t){super(t),this.Vr=e.startsWith("/")?e:"/"+e}_toProto(e){return{...super._toProto(e),args:[{referenceValue:this.Vr}]}}_readUserData(e){super._readUserData(e)}}class Vd extends je{get _name(){return"collection_group"}get _optionsUtil(){return new _e({forceIndex:{serverName:"force_index"}})}constructor(e,t){super(t),this.collectionId=e}_toProto(e){return{...super._toProto(e),args:[{referenceValue:""},{stringValue:this.collectionId}]}}_readUserData(e){super._readUserData(e)}}class kd extends je{get _name(){return"database"}get _optionsUtil(){return new _e({})}_toProto(e){return{...super._toProto(e)}}_readUserData(e){super._readUserData(e)}}class Nd extends je{get _name(){return"documents"}get _optionsUtil(){return new _e({})}constructor(e,t){if(super(t),!e||e.length===0)throw new L(M.INVALID_ARGUMENT,"Empty document paths are not allowed in DocumentsSource");const r=e.map((a=>a.startsWith("/")?a:"/"+a)),i=new Set(r);if(i.size!==r.length)throw new L(M.INVALID_ARGUMENT,"Duplicate document paths are not allowed in DocumentsSource");this.dr=r,this.mr=i}_toProto(e){return{...super._toProto(e),args:this.dr.map((t=>({referenceValue:t})))}}_readUserData(e){super._readUserData(e)}}class Cd extends je{get _name(){return"select"}get _optionsUtil(){return new _e({})}constructor(e,t){super(t),this.selections=e}_toProto(e){return{...super._toProto(e),args:[wn(e,this.selections)]}}_readUserData(e){super._readUserData(e),Tt(this.selections,e)}}class xd extends je{get _name(){return"sort"}get _optionsUtil(){return new _e({})}constructor(e,t){super(t),this.orderings=e}_toProto(e){return{...super._toProto(e),args:this.orderings.map((t=>t._toProto(e)))}}_readUserData(e){super._readUserData(e),Tt(this.orderings,e)}}class Ks extends je{get _name(){return"replace_with"}get _optionsUtil(){return new _e({})}constructor(e,t){super(t),this.map=e}_toProto(e){return{...super._toProto(e),args:[this.map._toProto(e),Ka(Ks.pr)]}}_readUserData(e){super._readUserData(e),Tt(this.map,e)}}Ks.pr="full_replace";function Tt(n,e){return fd(n)?n._readUserData(e):Array.isArray(n)?n.forEach((t=>t._readUserData(e))):n instanceof Map?n.forEach((t=>t._readUserData(e))):Object.values(n).forEach((t=>t._readUserData(e))),n}// Copyright 2024 Google LLC* @license
class Od{constructor(e,t,r){this.serializer=e,this.stages=t,this.listenOptions=r,this.isCorePipeline=!0}getPipelineCollection(){return nu(this)}getPipelineCollectionGroup(){return ru(this)}getPipelineCollectionId(){return Dd(this)}getPipelineDocuments(){return Ld(this)}getPipelineFlavor(){return(function(t){let r="exact";return t.stages.forEach(((i,a)=>{i._name!==Pd.name&&i._name!==Rd.name||(r="keyless"),i._name===Cd.name&&r==="exact"&&(r="augmented"),i._name===bd.name&&a<t.stages.length-1&&r==="exact"&&(r="augmented")})),r})(this)}getPipelineSourceType(){return Ln(this)}}function Ln(n){const e=n.stages[0];return e instanceof Sd||e instanceof Vd||e instanceof kd||e instanceof Nd?e._name:"unknown"}function nu(n){if(Ln(n)==="collection")return n.stages[0].Vr}function ru(n){if(Ln(n)==="collection_group")return n.stages[0].collectionId}function Dd(n){switch(Ln(n)){case"collection":return pe.fromString(nu(n)).lastSegment();case"collection_group":return ru(n);default:return}}function Ld(n){if(Ln(n)==="documents")return n.stages[0].dr}// Copyright 2024 Google LLC* @license
class m{constructor(e,t){this.type=e,this.value=t}static vr(){return new m("ERROR",void 0)}static Sr(){return new m("UNSET",void 0)}static Dr(){return new m("NULL",vr)}static newValue(e){return Se(e)?new m("NULL",vr):(function(r){return!!r&&"booleanValue"in r})(e)?new m("BOOLEAN",e):Nt(e)?new m("INT",e):yt(e)?new m("DOUBLE",e):(function(r){return!!r&&"timestampValue"in r&&!!r.timestampValue})(e)?new m("TIMESTAMP",e):(function(r){return!!r&&"stringValue"in r})(e)?new m("STRING",e):(function(r){return!!r&&"bytesValue"in r})(e)?new m("BYTES",e):e.referenceValue?new m("REFERENCE",e):e.geoPointValue?new m("GEO_POINT",e):ws(e)?new m("ARRAY",e):Er(e)?new m("VECTOR",e):Dt(e)?new m("MAP",e):new m("ERROR",void 0)}Cr(){return this.type==="ERROR"||this.type==="UNSET"}Fr(){return this.type==="NULL"}}function Mo(n){if(!n.Cr())return n.value}function Ud(n){return n instanceof ht?n._expr:n}function k(n){if((n=Ud(n))instanceof Gs)return new Md(n);if(n instanceof Dn)return new Fd(n);if(n instanceof an)return new Bd(n);if(n instanceof A){if(n.name==="add")return new Hd(n);if(n.name==="subtract")return new qd(n);if(n.name==="multiply")return new zd(n);if(n.name==="divide")return new Wd(n);if(n.name==="mod")return new Gd(n);if(n.name==="and")return new Kd(n);if(n.name==="equal")return new op(n);if(n.name==="not_equal")return new ap(n);if(n.name==="less_than")return new up(n);if(n.name==="less_than_or_equal")return new lp(n);if(n.name==="greater_than")return new cp(n);if(n.name==="greater_than_or_equal")return new hp(n);if(n.name==="array_concat")return new fp(n);if(n.name==="array_reverse")return new dp(n);if(n.name==="array_contains")return new pp(n);if(n.name==="array_contains_all")return new gp(n);if(n.name==="array_contains_any")return new mp(n);if(n.name==="array_length")return new _p(n);if(n.name==="array_element")return new yp(n);if(n.name==="equal_any")return new su(n);if(n.name==="not_equal_any")return new Yd(n);if(n.name==="is_nan")return new Xd(n);if(n.name==="is_not_nan")return new Qd(n);if(n.name==="is_null")return new Zd(n);if(n.name==="is_not_null")return new ep(n);if(n.name==="is_error")return new tp(n);if(n.name==="exists")return new np(n);if(n.name==="not")return new kr(n);if(n.name==="or")return new Jd(n);if(n.name==="xor")return new Js(n);if(n.name==="conditional")return new rp(n);if(n.name==="maximum")return new sp(n);if(n.name==="minimum")return new ip(n);if(n.name==="reverse")return new wp(n);if(n.name==="replace_first")return new vp(n);if(n.name==="replace_all")return new Ip(n);if(n.name==="char_length")return new Ep(n);if(n.name==="byte_length")return new Tp(n);if(n.name==="like")return new Ap(n);if(n.name==="regex_contains")return new bp(n);if(n.name==="regex_match")return new Rp(n);if(n.name==="string_contains")return new Pp(n);if(n.name==="starts_with")return new Sp(n);if(n.name==="ends_with")return new Vp(n);if(n.name==="to_lower")return new kp(n);if(n.name==="to_upper")return new Np(n);if(n.name==="trim")return new Cp(n);if(n.name==="string_concat")return new xp(n);if(n.name==="map_get")return new Op(n);if(n.name==="cosine_distance")return new Dp(n);if(n.name==="dot_product")return new Lp(n);if(n.name==="euclidean_distance")return new Up(n);if(n.name==="vector_length")return new Mp(n);if(n.name==="unix_micros_to_timestamp")return new Hp(n);if(n.name==="timestamp_to_unix_micros")return new Wp(n);if(n.name==="unix_millis_to_timestamp")return new qp(n);if(n.name==="timestamp_to_unix_millis")return new Gp(n);if(n.name==="unix_seconds_to_timestamp")return new zp(n);if(n.name==="timestamp_to_unix_seconds")return new Kp(n);if(n.name==="timestamp_add")return new Jp(n);if(n.name==="timestamp_subtract")return new Yp(n)}throw new Error(`Unknown Expr : ${n}`)}class Md{constructor(e){this.expr=e}evaluate(e,t){if(this.expr.fieldName===mn)return m.newValue({referenceValue:Zf(e.serializer,t.key)});if(this.expr.fieldName==="__update_time__")return m.newValue({timestampValue:us(e.serializer,t.version)});if(this.expr.fieldName==="__create_time__")return m.newValue({timestampValue:us(e.serializer,t.createTime)});const r=t.data.field(this.expr._fieldPath);return r?js(r)?m.newValue((function(a,l){if(a.serverTimestampBehavior==="estimate")return{timestampValue:us(a.serializer,cn.fromTimestamp(yn(l)))};if(a.serverTimestampBehavior==="previous"){const h=ja(l);if(h)return h}return{nullValue:"NULL_VALUE"}})(e,r)):m.newValue(r):m.Sr()}}class Fd{constructor(e){this.expr=e}evaluate(e,t){return m.newValue(this.expr._getValue())}}class Bd{constructor(e){this.expr=e}evaluate(e,t){const r=this.expr.Rr.map((i=>k(i).evaluate(e,t)));return r.some((i=>i.Cr()))?m.vr():m.newValue({arrayValue:{values:r.map((i=>i.value))}})}}function ne(n){return yt(n)?Number(n.doubleValue):Number(n.integerValue)}function Ue(n){return BigInt(n.integerValue)}const jd=BigInt("0x7fffffffffffffff"),$d=-BigInt("0x8000000000000000");class Un{constructor(e){this.expr=e}evaluate(e,t){U(this.expr.params.length>=2,24778);const r=k(this.expr.params[0]).evaluate(e,t),i=k(this.expr.params[1]).evaluate(e,t);let a=this.Or(r,i);for(const l of this.expr.params.slice(2)){const h=k(l).evaluate(e,t);a=this.Or(a,h)}return a}Or(e,t){if(e.Cr()||t.Cr())return m.vr();if(e.Fr()||t.Fr())return m.Dr();const r=e.value,i=t.value;if(!yt(r)&&!Nt(r)||!yt(i)&&!Nt(i))return m.vr();if(yt(r)||yt(i)){const a=this.Mr(r,i);return a?m.newValue(a):m.vr()}if(Nt(r)&&Nt(i)){const a=this.Nr(r,i);return a===void 0?m.vr():typeof a=="number"?m.newValue({doubleValue:a}):a<$d||a>jd?m.vr():m.newValue({integerValue:`${a}`})}return m.vr()}}function Je(n,e){return ie(n)!==ie(e)?"TYPE_MISMATCH":Te(n)||Te(e)?"NOT_EQ":Se(n)&&Se(e)?"EQ":Se(n)||Se(e)?"NULL":ws(n)&&ws(e)?(function(r,i){var l,h,f;if(((l=r.values)==null?void 0:l.length)!==((h=i.values)==null?void 0:h.length))return"NOT_EQ";let a=!1;for(let _=0;_<(((f=r.values)==null?void 0:f.length)??0);_++){const b=r.values[_],R=i.values[_];switch(Je(b,R)){case"EQ":break;case"NOT_EQ":case"TYPE_MISMATCH":return"NOT_EQ";case"NULL":a=!0;break;default:q(44609,{Lr:b,Br:R})}}return a?"NULL":"EQ"})(n.arrayValue,e.arrayValue):Er(n)&&Er(e)||Dt(n)&&Dt(e)?(function(r,i){const a=r.fields||{},l=i.fields||{};if(mr(a)!==mr(l))return"NOT_EQ";let h=!1;for(const f in a)if(a.hasOwnProperty(f)){if(l[f]===void 0)return"NOT_EQ";switch(Je(a[f],l[f])){case"NOT_EQ":case"TYPE_MISMATCH":return"NOT_EQ";case"NULL":h=!0}}return h?"NULL":"EQ"})(n.mapValue,e.mapValue):(function(r,i){return Ir(r,i,{Te:!1,Ee:!0,he:!0})})(n,e)?"EQ":"NOT_EQ"}class Hd extends Un{Nr(e,t){return Ue(e)+Ue(t)}Mr(e,t){return{doubleValue:ne(e)+ne(t)}}}class qd extends Un{constructor(e){super(e),this.expr=e}Nr(e,t){return Ue(e)-Ue(t)}Mr(e,t){return{doubleValue:ne(e)-ne(t)}}}class zd extends Un{constructor(e){super(e),this.expr=e}Nr(e,t){return Ue(e)*Ue(t)}Mr(e,t){return{doubleValue:ne(e)*ne(t)}}}class Wd extends Un{constructor(e){super(e),this.expr=e}Nr(e,t){const r=Ue(t);if(r!==BigInt(0))return Ue(e)/r}Mr(e,t){const r=ne(t);return r===0?{doubleValue:_n(r)?Number.NEGATIVE_INFINITY:Number.POSITIVE_INFINITY}:{doubleValue:ne(e)/r}}}class Gd extends Un{constructor(e){super(e),this.expr=e}Nr(e,t){const r=Ue(t);if(r!==BigInt(0))return Ue(e)%r}Mr(e,t){const r=ne(t);if(r!==0)return{doubleValue:ne(e)%r}}}class Kd{constructor(e){this.expr=e}evaluate(e,t){var a;let r=!1,i=!1;for(const l of this.expr.params){const h=k(l).evaluate(e,t);switch(h.type){case"BOOLEAN":if(!((a=h.value)!=null&&a.booleanValue))return m.newValue(ee);break;case"NULL":i=!0;break;default:r=!0}}return r?m.vr():i?m.Dr():m.newValue(me)}}class kr{constructor(e){this.expr=e}evaluate(e,t){var i;U(this.expr.params.length===1,9634);const r=k(this.expr.params[0]).evaluate(e,t);switch(r.type){case"BOOLEAN":return m.newValue({booleanValue:!((i=r.value)!=null&&i.booleanValue)});case"NULL":return m.Dr();default:return m.vr()}}}class Jd{constructor(e){this.expr=e}evaluate(e,t){var a;let r=!1,i=!1;for(const l of this.expr.params){const h=k(l).evaluate(e,t);switch(h.type){case"BOOLEAN":if((a=h.value)!=null&&a.booleanValue)return m.newValue(me);break;case"NULL":i=!0;break;default:r=!0}}return r?m.vr():i?m.Dr():m.newValue(ee)}}class Js{constructor(e){this.expr=e}evaluate(e,t){var a;let r=!1,i=!1;for(const l of this.expr.params){const h=k(l).evaluate(e,t);switch(h.type){case"BOOLEAN":r=Js.xor(r,!!((a=h.value)!=null&&a.booleanValue));break;case"NULL":i=!0;break;default:return m.vr()}}return i?m.Dr():m.newValue({booleanValue:r})}static xor(e,t){return(e||t)&&!(e&&t)}}class su{constructor(e){this.expr=e}evaluate(e,t){var l,h;U(this.expr.params.length===2,55094);let r=!1;const i=k(this.expr.params[0]).evaluate(e,t);switch(i.type){case"NULL":r=!0;break;case"ERROR":case"UNSET":return m.vr()}const a=k(this.expr.params[1]).evaluate(e,t);switch(a.type){case"ARRAY":break;case"NULL":r=!0;break;default:return m.vr()}if(r)return m.Dr();for(const f of((h=(l=a.value)==null?void 0:l.arrayValue)==null?void 0:h.values)??[])switch(Se(i.value)&&Se(f)?"EQ":Je(i.value,f)){case"EQ":return m.newValue(me);case"NOT_EQ":case"TYPE_MISMATCH":break;case"NULL":r=!0;break;default:q(44608,{value:i.value,candidate:f})}return r?m.Dr():m.newValue(ee)}}class Yd{constructor(e){this.expr=e}evaluate(e,t){return new kr(new A("not",[new A("equal_any",this.expr.params)])).evaluate(e,t)}}class Xd{constructor(e){this.expr=e}evaluate(e,t){U(this.expr.params.length===1,23322);const r=k(this.expr.params[0]).evaluate(e,t);switch(r.type){case"INT":return m.newValue(ee);case"DOUBLE":return m.newValue({booleanValue:isNaN(ne(r.value))});case"NULL":return m.Dr();default:return m.vr()}}}class Qd{constructor(e){this.expr=e}evaluate(e,t){return U(this.expr.params.length===1,50406),new kr(new A("not",[new A("is_nan",this.expr.params)])).evaluate(e,t)}}class Zd{constructor(e){this.expr=e}evaluate(e,t){switch(U(this.expr.params.length===1,23123),k(this.expr.params[0]).evaluate(e,t).type){case"NULL":return m.newValue(me);case"UNSET":case"ERROR":return m.vr();default:return m.newValue(ee)}}}class ep{constructor(e){this.expr=e}evaluate(e,t){return U(this.expr.params.length===1,23167),new kr(new A("not",[new A("is_null",this.expr.params)])).evaluate(e,t)}}class tp{constructor(e){this.expr=e}evaluate(e,t){return U(this.expr.params.length===1,5228),k(this.expr.params[0]).evaluate(e,t).type==="ERROR"?m.newValue(me):m.newValue(ee)}}class np{constructor(e){this.expr=e}evaluate(e,t){switch(U(this.expr.params.length===1,6877),k(this.expr.params[0]).evaluate(e,t).type){case"ERROR":return m.vr();case"UNSET":return m.newValue(ee);default:return m.newValue(me)}}}class rp{constructor(e){this.expr=e}evaluate(e,t){var i;U(this.expr.params.length===3,11706);const r=k(this.expr.params[0]).evaluate(e,t);switch(r.type){case"BOOLEAN":return(i=r.value)!=null&&i.booleanValue?k(this.expr.params[1]).evaluate(e,t):k(this.expr.params[2]).evaluate(e,t);case"NULL":return k(this.expr.params[2]).evaluate(e,t);default:return m.vr()}}}class sp{constructor(e){this.expr=e}evaluate(e,t){const r=this.expr.params.map((a=>k(a).evaluate(e,t)));let i;for(const a of r)switch(a.type){case"ERROR":case"UNSET":case"NULL":continue;default:i=i===void 0||Be(a.value,i.value)>0?a:i}return i===void 0?m.Dr():i}}class ip{constructor(e){this.expr=e}evaluate(e,t){const r=this.expr.params.map((a=>k(a).evaluate(e,t)));let i;for(const a of r)switch(a.type){case"ERROR":case"UNSET":case"NULL":continue;default:i=i===void 0||Be(a.value,i.value)<0?a:i}return i===void 0?m.Dr():i}}class $t{constructor(e){this.expr=e}evaluate(e,t){U(this.expr.params.length===2,31033,`${this.expr.name}() function should have exactly 2 params`);const r=k(this.expr.params[0]).evaluate(e,t);switch(r.type){case"ERROR":case"UNSET":return m.vr()}const i=k(this.expr.params[1]).evaluate(e,t);switch(i.type){case"ERROR":case"UNSET":return m.vr()}return this.Ur(r,i)}}class op extends $t{constructor(e){super(e),this.expr=e}Ur(e,t){if(e.Fr()&&t.Fr())return m.newValue(me);if(e.Fr()||t.Fr()||Te(e.value)||Te(t.value)||ie(e.value)!==ie(t.value))return m.newValue(ee);switch(Je(e.value,t.value)){case"EQ":return m.newValue(me);case"NOT_EQ":return m.newValue(ee);case"NULL":return m.Dr();default:q(44615,{left:e,right:t})}}}class ap extends $t{constructor(e){super(e),this.expr=e}Ur(e,t){switch(Je(e.value,t.value)){case"EQ":return m.newValue(ee);case"NOT_EQ":case"TYPE_MISMATCH":return m.newValue(me);case"NULL":return m.Dr();default:q(44614,{left:e,right:t})}}}class up extends $t{constructor(e){super(e),this.expr=e}Ur(e,t){return ie(e.value)!==ie(t.value)||Te(e.value)||Te(t.value)?m.newValue(ee):m.newValue({booleanValue:Be(e.value,t.value)<0})}}class lp extends $t{constructor(e){super(e),this.expr=e}Ur(e,t){return ie(e.value)!==ie(t.value)||Te(e.value)||Te(t.value)?m.newValue(ee):Je(e.value,t.value)==="EQ"?m.newValue(me):m.newValue({booleanValue:Be(e.value,t.value)<0})}}class cp extends $t{constructor(e){super(e),this.expr=e}Ur(e,t){return ie(e.value)!==ie(t.value)||Te(e.value)||Te(t.value)?m.newValue(ee):m.newValue({booleanValue:Be(e.value,t.value)>0})}}class hp extends $t{constructor(e){super(e),this.expr=e}Ur(e,t){return ie(e.value)!==ie(t.value)||Te(e.value)||Te(t.value)?m.newValue(ee):Je(e.value,t.value)==="EQ"?m.newValue(me):m.newValue({booleanValue:Be(e.value,t.value)>0})}}class fp{constructor(e){this.expr=e}evaluate(e,t){throw new Error("Unimplemented")}}class dp{constructor(e){this.expr=e}evaluate(e,t){var i;U(this.expr.params.length===1,216);const r=k(this.expr.params[0]).evaluate(e,t);switch(r.type){case"NULL":return m.Dr();case"ARRAY":{const a=((i=r.value.arrayValue)==null?void 0:i.values)??[];return m.newValue({arrayValue:{values:[...a].reverse()}})}default:return m.vr()}}}class pp{constructor(e){this.expr=e}evaluate(e,t){return U(this.expr.params.length===2,52884),new su(new A("eq_any",[this.expr.params[1],this.expr.params[0]])).evaluate(e,t)}}class gp{constructor(e){this.expr=e}evaluate(e,t){var f,_,b,R;U(this.expr.params.length===2,1392);let r=!1;const i=k(this.expr.params[0]).evaluate(e,t);switch(i.type){case"ARRAY":break;case"NULL":r=!0;break;default:return m.vr()}const a=k(this.expr.params[1]).evaluate(e,t);switch(a.type){case"ARRAY":break;case"NULL":r=!0;break;default:return m.vr()}if(r)return m.Dr();const l=((_=(f=a.value)==null?void 0:f.arrayValue)==null?void 0:_.values)??[],h=((R=(b=i.value)==null?void 0:b.arrayValue)==null?void 0:R.values)??[];for(const V of l){let x=!1;r=!1;for(const O of h){switch(Se(V)&&Se(O)?"EQ":Je(V,O)){case"EQ":x=!0;break;case"NOT_EQ":case"TYPE_MISMATCH":break;case"NULL":r=!0;break;default:q(44613,{value:O,search:V})}if(x)break}if(!x)return m.newValue(ee)}return m.newValue(me)}}class mp{constructor(e){this.expr=e}evaluate(e,t){var f,_,b,R;U(this.expr.params.length===2,2680);let r=!1;const i=k(this.expr.params[0]).evaluate(e,t);switch(i.type){case"ARRAY":break;case"NULL":r=!0;break;default:return m.vr()}const a=k(this.expr.params[1]).evaluate(e,t);switch(a.type){case"ARRAY":break;case"NULL":r=!0;break;default:return m.vr()}if(r)return m.Dr();const l=((_=(f=a.value)==null?void 0:f.arrayValue)==null?void 0:_.values)??[],h=((R=(b=i.value)==null?void 0:b.arrayValue)==null?void 0:R.values)??[];for(const V of h)for(const x of l)switch(Se(V)&&Se(x)?"EQ":Je(V,x)){case"EQ":return m.newValue(me);case"NOT_EQ":case"TYPE_MISMATCH":break;case"NULL":r=!0;break;default:q(44608,{value:V,search:x})}return r?m.Dr():m.newValue(ee)}}class _p{constructor(e){this.expr=e}evaluate(e,t){var i,a,l;U(this.expr.params.length===1,38605);const r=k(this.expr.params[0]).evaluate(e,t);switch(r.type){case"NULL":return m.Dr();case"ARRAY":return m.newValue({integerValue:`${((l=(a=(i=r.value)==null?void 0:i.arrayValue)==null?void 0:a.values)==null?void 0:l.length)??0}`});default:return m.vr()}}}class yp{constructor(e){this.expr=e}evaluate(e,t){throw new Error("Unimplemented")}}class wp{constructor(e){this.expr=e}evaluate(e,t){var i,a;U(this.expr.params.length===1,1508);const r=k(this.expr.params[0]).evaluate(e,t);switch(r.type){case"NULL":return m.Dr();case"BYTES":{const l=(i=r.value)==null?void 0:i.bytesValue;if(typeof l=="string"){const h=Ee.fromBase64String(l).toUint8Array();return h.reverse(),m.newValue({bytesValue:Ee.fromUint8Array(h).toBase64()})}return m.newValue({bytesValue:new Uint8Array(l).reverse()})}case"STRING":{const l=(a=r.value)==null?void 0:a.stringValue,h=new Intl.__PRIVATE_Segmenter(void 0,{granularity:"grapheme"}).segment(l),f=Array.from(h,(_=>_.segment)).reverse();return m.newValue({stringValue:f.join("")})}default:return m.vr()}}}class vp{constructor(e){this.expr=e}evaluate(e,t){throw new Error("Unimplemented")}}class Ip{constructor(e){this.expr=e}evaluate(e,t){throw new Error("Unimplemented")}}class Ep{constructor(e){this.expr=e}evaluate(e,t){U(this.expr.params.length===1,19400);const r=k(this.expr.params[0]).evaluate(e,t);switch(r.type){case"NULL":return m.Dr();case"STRING":{const i=(function(l){let h=0;for(let f=0;f<l.length;f++){const _=l.codePointAt(f);if(_===void 0)return;if(_<=65535)if(_>=55296&&_<=57343)if(_<=56319){const b=l.codePointAt(f+1);b!==void 0&&b>=56320&&b<=57343?(h+=1,f++):h+=1}else h+=1;else h+=1;else{if(!(_<=1114111))return;h+=1,f++}}return h})(r.value.stringValue);return i===void 0?m.vr():m.newValue({integerValue:i})}default:return m.vr()}}}class Tp{constructor(e){this.expr=e}evaluate(e,t){var i,a;U(this.expr.params.length===1,8486);const r=k(this.expr.params[0]).evaluate(e,t);switch(r.type){case"BYTES":{const l=(i=r.value)==null?void 0:i.bytesValue;return typeof l=="string"?m.newValue({integerValue:Ee.fromBase64String(l).toUint8Array().length}):m.newValue({integerValue:new Uint8Array(l).length})}case"STRING":{const l=(function(f){let _=0;for(let b=0;b<f.length;b++){const R=f.codePointAt(b);if(R===void 0)return;if(R>=55296&&R<=57343){if(!(R<=56319))return;{const V=f.codePointAt(b+1);if(V===void 0||!(V>=56320&&V<=57343))return;_+=4,b++}}else if(R<=127)_+=1;else if(R<=2047)_+=2;else if(R<=65535)_+=3;else{if(!(R<=1114111))return;_+=4,b++}}return _})((a=r.value)==null?void 0:a.stringValue);return l===void 0?m.vr():m.newValue({integerValue:l})}case"NULL":return m.Dr();default:return m.vr()}}}class Ht{constructor(e){this.expr=e}evaluate(e,t){var l,h;U(this.expr.params.length===2,39773,`${this.expr.name}() function should have exactly two parameters`);let r=!1;const i=k(this.expr.params[0]).evaluate(e,t);switch(i.type){case"STRING":break;case"NULL":r=!0;break;default:return m.vr()}const a=k(this.expr.params[1]).evaluate(e,t);switch(a.type){case"STRING":break;case"NULL":r=!0;break;default:return m.vr()}return r?m.Dr():this.kr((l=i.value)==null?void 0:l.stringValue,(h=a.value)==null?void 0:h.stringValue)}}class Ap extends Ht{kr(e,t){try{const r=(function(l){let h="";for(let f=0;f<l.length;f++){const _=l.charAt(f);switch(_){case"_":h+=".";break;case"%":h+=".*";break;case"\\":case".":case"*":case"?":case"+":case"^":case"$":case"|":case"(":case")":case"[":case"]":case"{":case"}":h+="\\"+_;break;default:h+=_}}return"^"+h+"$"})(t),i=Ts.compile(r);return m.newValue({booleanValue:i.matches(e)})}catch(r){return Cn(`Invalid LIKE pattern converted to regex: ${t}, returning error. Error: ${r}`),m.vr()}}}class bp extends Ht{kr(e,t){try{const r=Ts.compile(t);return m.newValue({booleanValue:r.matcher(e).find()})}catch{return Cn(`Invalid regex pattern found in regex_contains: ${t}, returning error`),m.vr()}}}class Rp extends Ht{kr(e,t){try{return m.newValue({booleanValue:Ts.compile(t).matches(e)})}catch{return Cn(`Invalid regex pattern found in regex_match: ${t}, returning error`),m.vr()}}}class Pp extends Ht{kr(e,t){return m.newValue({booleanValue:e.includes(t)})}}class Sp extends Ht{kr(e,t){return m.newValue({booleanValue:e.startsWith(t)})}}class Vp extends Ht{kr(e,t){return m.newValue({booleanValue:e.endsWith(t)})}}class kp{constructor(e){this.expr=e}evaluate(e,t){var i,a;U(this.expr.params.length===1,29079);const r=k(this.expr.params[0]).evaluate(e,t);switch(r.type){case"STRING":return m.newValue({stringValue:(a=(i=r.value)==null?void 0:i.stringValue)==null?void 0:a.toLowerCase()});case"NULL":return m.Dr();default:return m.vr()}}}class Np{constructor(e){this.expr=e}evaluate(e,t){var i,a;U(this.expr.params.length===1,60487);const r=k(this.expr.params[0]).evaluate(e,t);switch(r.type){case"STRING":return m.newValue({stringValue:(a=(i=r.value)==null?void 0:i.stringValue)==null?void 0:a.toUpperCase()});case"NULL":return m.Dr();default:return m.vr()}}}class Cp{constructor(e){this.expr=e}evaluate(e,t){var i,a;U(this.expr.params.length===1,28544);const r=k(this.expr.params[0]).evaluate(e,t);switch(r.type){case"STRING":return m.newValue({stringValue:(a=(i=r.value)==null?void 0:i.stringValue)==null?void 0:a.trim()});case"NULL":return m.Dr();default:return m.vr()}}}class xp{constructor(e){this.expr=e}evaluate(e,t){const r=this.expr.params.map((l=>k(l).evaluate(e,t)));let i="",a=!1;for(const l of r)switch(l.type){case"STRING":i+=l.value.stringValue;break;case"NULL":a=!0;break;default:return m.vr()}return a?m.Dr():m.newValue({stringValue:i})}}class Op{constructor(e){this.expr=e}evaluate(e,t){var l,h,f,_;U(this.expr.params.length===2,4483);const r=k(this.expr.params[0]).evaluate(e,t);switch(r.type){case"UNSET":return m.Sr();case"MAP":break;default:return m.vr()}const i=k(this.expr.params[1]).evaluate(e,t);if(i.type!=="STRING")return m.vr();const a=(_=(h=(l=r.value)==null?void 0:l.mapValue)==null?void 0:h.fields)==null?void 0:_[(f=i.value)==null?void 0:f.stringValue];return a===void 0?m.Sr():m.newValue(a)}}class Ys{constructor(e){this.expr=e}evaluate(e,t){var _,b;U(this.expr.params.length===2,25231,`${this.expr.name}() function should have exactly 2 params`);let r=!1;const i=k(this.expr.params[0]).evaluate(e,t);switch(i.type){case"VECTOR":break;case"NULL":r=!0;break;default:return m.vr()}const a=k(this.expr.params[1]).evaluate(e,t);switch(a.type){case"VECTOR":break;case"NULL":r=!0;break;default:return m.vr()}if(r)return m.Dr();const l=vs(i.value),h=vs(a.value);if(l===void 0||h===void 0||((_=l.values)==null?void 0:_.length)!==((b=h.values)==null?void 0:b.length))return m.vr();const f=this.qr(l,h);return f===void 0||isNaN(f)?m.vr():m.newValue({doubleValue:f})}}class Dp extends Ys{qr(e,t){const r=(e==null?void 0:e.values)??[],i=(t==null?void 0:t.values)??[];if(r.length===0)return;let a=0,l=0,h=0;for(let _=0;_<r.length;_++){if(!Bt(r[_])||!Bt(i[_]))return;const b=ne(r[_]),R=ne(i[_]);a+=b*R,l+=b*b,h+=R*R}const f=Math.sqrt(l)*Math.sqrt(h);if(f!==0)return 1-Math.max(-1,Math.min(1,a/f))}}class Lp extends Ys{qr(e,t){const r=(e==null?void 0:e.values)??[],i=(t==null?void 0:t.values)??[];if(r.length===0)return 0;let a=0;for(let l=0;l<r.length;l++){if(!Bt(r[l])||!Bt(i[l]))return;a+=ne(r[l])*ne(i[l])}return a}}class Up extends Ys{qr(e,t){const r=(e==null?void 0:e.values)??[],i=(t==null?void 0:t.values)??[];if(r.length===0)return 0;let a=0;for(let l=0;l<r.length;l++){if(!Bt(r[l])||!Bt(i[l]))return;const h=ne(r[l]),f=ne(i[l]);a+=Math.pow(h-f,2)}return Math.sqrt(a)}}class Mp{constructor(e){this.expr=e}evaluate(e,t){var i;U(this.expr.params.length===1,39044);const r=k(this.expr.params[0]).evaluate(e,t);switch(r.type){case"VECTOR":{const a=vs(r.value);return m.newValue({integerValue:((i=a==null?void 0:a.values)==null?void 0:i.length)??0})}case"NULL":return m.Dr();default:return m.vr()}}}const En=BigInt(-62135596800),Tn=BigInt(253402300799),Ar=BigInt(1e3),lt=BigInt(1e6),Fp=En*Ar,Bp=Tn*Ar+BigInt(999),jp=En*lt,$p=Tn*lt+BigInt(999999);function Xs(n){return n>=jp&&n<=$p}function iu(n){return n>=En&&n<=Tn}function An(n,e){const t=BigInt(n);return!(t<En||t>Tn)&&!(e<0||e>=1e9)&&(t!==En||e===0)&&!(t===Tn&&e>999999999)}function ou(n,e){return e<0?{seconds:n-1,nanos:e+1e9}:{seconds:n,nanos:e}}function Qs(n){return BigInt(n.seconds)*lt+BigInt(Math.trunc(n.nanoseconds/1e3))}class Zs{constructor(e){this.expr=e}evaluate(e,t){U(this.expr.params.length===1,49262,`${this.expr.name}() function should have exactly one parameter`);const r=k(this.expr.params[0]).evaluate(e,t);switch(r.type){case"INT":return this.toTimestamp(BigInt(r.value.integerValue));case"NULL":return m.Dr();default:return m.vr()}}}class Hp extends Zs{toTimestamp(e){if(!Xs(e))return m.vr();let t=Number(e/lt),r=Number(e%lt*BigInt(1e3));const i=ou(t,r);return t=i.seconds,r=i.nanos,An(t,r)?m.newValue({timestampValue:{seconds:t,nanos:r}}):m.vr()}}class qp extends Zs{toTimestamp(e){if(!(function(l){return l>=Fp&&l<=Bp})(e))return m.vr();let t=Number(e/Ar),r=Number(e%Ar*BigInt(1e6));const i=ou(t,r);return t=i.seconds,r=i.nanos,An(t,r)?m.newValue({timestampValue:{seconds:t,nanos:r}}):m.vr()}}class zp extends Zs{toTimestamp(e){if(!iu(e))return m.vr();const t=Number(e);return m.newValue({timestampValue:{seconds:t,nanos:0}})}}class ei{constructor(e){this.expr=e}evaluate(e,t){U(this.expr.params.length===1,1265,`${this.expr.name}() function should have exactly one parameter`);const r=k(this.expr.params[0]).evaluate(e,t);switch(r.type){case"TIMESTAMP":break;case"NULL":return m.Dr();default:return m.vr()}const i=za(r.value.timestampValue);return An(i.seconds,i.nanoseconds)?this.$r(i):m.vr()}}class Wp extends ei{$r(e){const t=Qs(e);return Xs(t)?m.newValue({integerValue:`${t.toString()}`}):m.vr()}}class Gp extends ei{$r(e){const t=Qs(e),r=t/BigInt(1e3),i=t%BigInt(1e3);return r>BigInt(0)||i===BigInt(0)?m.newValue({integerValue:r.toString()}):m.newValue({integerValue:(r-BigInt(1)).toString()})}}class Kp extends ei{$r(e){const t=BigInt(e.seconds);return iu(t)?m.newValue({integerValue:t.toString()}):m.vr()}}class au{constructor(e){this.expr=e}evaluate(e,t){U(this.expr.params.length===3,2775,`${this.expr.name}() function should have exactly 3 parameters`);let r=!1;const i=k(this.expr.params[0]).evaluate(e,t);switch(i.type){case"TIMESTAMP":break;case"NULL":r=!0;break;default:return m.vr()}const a=k(this.expr.params[1]).evaluate(e,t);let l;switch(a.type){case"STRING":if(l=(function(ye){switch(ye){case"microsecond":return"microsecond";case"millisecond":return"millisecond";case"second":return"second";case"minute":return"minute";case"hour":return"hour";case"day":return"day";default:return}})(a.value.stringValue),l===void 0)return m.vr();break;case"NULL":r=!0;break;default:return m.vr()}const h=k(this.expr.params[2]).evaluate(e,t);switch(h.type){case"INT":break;case"NULL":r=!0;break;default:return m.vr()}if(r)return m.Dr();const f=BigInt(h.value.integerValue);let _;try{switch(l){case"microsecond":_=f;break;case"millisecond":_=f*BigInt(1e3);break;case"second":_=f*BigInt(1e6);break;case"minute":_=f*BigInt(6e7);break;case"hour":_=f*BigInt(36e8);break;case"day":_=f*BigInt(864e8);break;default:return m.vr()}if(l!=="microsecond"&&f!==BigInt(0)&&_/f!==BigInt(this.Kr(l)))return m.vr()}catch(J){return Cn(`Error during timestamp arithmetic: ${J}`),m.vr()}const b=za(i.value.timestampValue);if(!An(b.seconds,b.nanoseconds))return m.vr();const R=Qs(b),V=this.Wr(R,_);if(!Xs(V))return m.vr();const x=Number(V/lt),O=V%lt,B=Number((O<0?O+lt:O)*BigInt(1e3)),D=O<0?x-1:x;return An(D,B)?m.newValue({timestampValue:{seconds:D,nanos:B}}):m.vr()}Kr(e){switch(e){case"millisecond":return 1e3;case"second":return 1e6;case"minute":return 6e7;case"hour":return 36e8;case"day":return 864e8;default:return 1}}}class Jp extends au{Wr(e,t){return e+t}}class Yp extends au{Wr(e,t){return e-t}}function Xp(n){return n instanceof Od}function Qp(n){const e=(function(r){for(let i=r.stages.length-1;i>=0;i--){const a=r.stages[i];if(a instanceof xd)return a.orderings}throw new Error("Pipeline must contain at least one Sort stage")})(n);return(t,r)=>{for(const i of e){const a=Mo(k(i.expr).evaluate({serializer:n.serializer},t)),l=Mo(k(i.expr).evaluate({serializer:n.serializer},r)),h=Be(a||vr,l||vr);if(h!==0)return i.direction==="ascending"?h:-h}return 0}}function cs(){return typeof document<"u"?document:null}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ti{constructor(e,t,r,i,a){this.asyncQueue=e,this.timerId=t,this.targetTimeMs=r,this.op=i,this.removalCallback=a,this.deferred=new ln,this.then=this.deferred.promise.then.bind(this.deferred.promise),this.deferred.promise.catch((l=>{}))}get promise(){return this.deferred.promise}static createAndSchedule(e,t,r,i,a){const l=Date.now()+r,h=new ti(e,t,l,i,a);return h.start(r),h}start(e){this.timerHandle=setTimeout((()=>this.handleDelayElapsed()),e)}skipDelay(){return this.handleDelayElapsed()}cancel(e){this.timerHandle!==null&&(this.clearTimeout(),this.deferred.reject(new L(M.CANCELLED,"Operation cancelled"+(e?": "+e:""))))}handleDelayElapsed(){this.asyncQueue.enqueueAndForget((()=>this.timerHandle!==null?(this.clearTimeout(),this.op().then((e=>this.deferred.resolve(e)))):Promise.resolve()))}clearTimeout(){this.timerHandle!==null&&(this.removalCallback(this),clearTimeout(this.timerHandle),this.timerHandle=null)}}var Fo;(function(n){n.Default="default",n.Cache="cache"})(Fo||(Fo={}));/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Bo="AsyncQueue";class jo{constructor(e=Promise.resolve()){this.qc=[],this.$c=!1,this.Kc=[],this.Wc=null,this.Qc=!1,this.Gc=!1,this.zc=[],this.xn=new nd(this,"async_queue_retry"),this.jc=()=>{const r=cs();r&&Pe(Bo,"Visibility state changed to "+r.visibilityState),this.xn.gn()},this.Hc=e;const t=cs();t&&typeof t.addEventListener=="function"&&t.addEventListener("visibilitychange",this.jc)}get isShuttingDown(){return this.$c}enqueueAndForget(e){this.enqueue(e)}enqueueAndForgetEvenWhileRestricted(e){this.Jc(),this.Yc(e)}enterRestrictedMode(e){if(!this.$c){this.$c=!0,this.Gc=e||!1;const t=cs();t&&typeof t.removeEventListener=="function"&&t.removeEventListener("visibilitychange",this.jc)}}enqueue(e){if(this.Jc(),this.$c)return new Promise((()=>{}));const t=new ln;return this.Yc((()=>this.$c&&this.Gc?Promise.resolve():(e().then(t.resolve,t.reject),t.promise))).then((()=>t.promise))}enqueueRetryable(e){this.enqueueAndForget((()=>(this.qc.push(e),this.Zc())))}async Zc(){if(this.qc.length!==0){try{await this.qc[0](),this.qc.shift(),this.xn.reset()}catch(e){if(!kf(e))throw e;Pe(Bo,"Operation failed with retryable error: "+e)}this.qc.length>0&&this.xn.mn((()=>this.Zc()))}}Yc(e){const t=this.Hc.then((()=>(this.Qc=!0,e().catch((r=>{throw this.Wc=r,this.Qc=!1,Ma("INTERNAL UNHANDLED ERROR: ",$o(r)),r})).then((r=>(this.Qc=!1,r))))));return this.Hc=t,t}enqueueAfterDelay(e,t,r){this.Jc(),this.zc.indexOf(e)>-1&&(t=0);const i=ti.createAndSchedule(this,e,t,r,(a=>this.Xc(a)));return this.Kc.push(i),i}Jc(){this.Wc&&q(47125,{el:$o(this.Wc)})}verifyOperationInProgress(){}async tl(){let e;do e=this.Hc,await e;while(e!==this.Hc)}nl(e){for(const t of this.Kc)if(t.timerId===e)return!0;return!1}rl(e){return this.tl().then((()=>{this.Kc.sort(((t,r)=>t.targetTimeMs-r.targetTimeMs));for(const t of this.Kc)if(t.skipDelay(),e!=="all"&&t.timerId===e)break;return this.tl()}))}il(e){this.zc.push(e)}Xc(e){const t=this.Kc.indexOf(e);this.Kc.splice(t,1)}}function $o(n){let e=n.message||"";return n.stack&&(e=n.stack.includes(n.message)?n.stack:n.message+`
`+n.stack),e}class Zp extends Xa{constructor(e,t,r,i){super(e,t,r,i),this.type="firestore",this._queue=new jo,this._persistenceKey=(i==null?void 0:i.name)||"[DEFAULT]"}async _terminate(){if(this._firestoreClient){const e=this._firestoreClient.terminate();this._queue=new jo(e),this._firestoreClient=void 0,await e}}}function Og(n,e){const t=typeof n=="object"?n:Ps(),r=typeof n=="string"?n:ys,i=Pr(t,"firestore").getImmediate({identifier:r});if(!i._initialized){const a=ea("firestore");a&&od(i,...a)}return i}const Ho="@firebase/firestore",qo="4.16.0";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class uu{constructor(e,t,r,i,a){this._firestore=e,this._userDataWriter=t,this._key=r,this._document=i,this._converter=a}get id(){return this._key.path.lastSegment()}get ref(){return new ve(this._firestore,this._converter,this._key)}exists(){return this._document!==null}data(){if(this._document){if(this._converter){const e=new eg(this._firestore,this._userDataWriter,this._key,this._document,null);return this._converter.fromFirestore(e)}return this._userDataWriter.convertValue(this._document.data.value)}}_fieldsProto(){var e;return((e=this._document)==null?void 0:e.data.clone().value.mapValue.fields)??void 0}get(e){if(this._document){const t=this._document.data.field(zs("DocumentSnapshot.get",e));if(t!==null)return this._userDataWriter.convertValue(t)}}}class eg extends uu{data(){return super.data()}}class er{constructor(e,t){this.hasPendingWrites=e,this.fromCache=t}isEqual(e){return this.hasPendingWrites===e.hasPendingWrites&&this.fromCache===e.fromCache}}class Lt extends uu{constructor(e,t,r,i,a,l){super(e,t,r,i,l),this._firestore=e,this._firestoreImpl=e,this.metadata=a}exists(){return super.exists()}data(e={}){if(this._document){if(this._converter){const t=new or(this._firestore,this._userDataWriter,this._key,this._document,this.metadata,null);return this._converter.fromFirestore(t,e)}return this._userDataWriter.convertValue(this._document.data.value,e.serverTimestamps)}}get(e,t={}){if(this._document){const r=this._document.data.field(zs("DocumentSnapshot.get",e));if(r!==null)return this._userDataWriter.convertValue(r,t.serverTimestamps)}}toJSON(){if(this.metadata.hasPendingWrites)throw new L(M.FAILED_PRECONDITION,"DocumentSnapshot.toJSON() attempted to serialize a document with pending writes. Await waitForPendingWrites() before invoking toJSON().");const e=this._document,t={};return t.type=Lt._jsonSchemaVersion,t.bundle="",t.bundleSource="DocumentSnapshot",t.bundleName=this._key.toString(),!e||!e.isValidDocument()||!e.isFoundDocument()?t:(this._userDataWriter.convertObjectMap(e.data.value.mapValue.fields,"previous"),t.bundle=(this._firestore,this.ref.path,"NOT SUPPORTED"),t)}}Lt._jsonSchemaVersion="firestore/documentSnapshot/1.0",Lt._jsonSchema={type:G("string",Lt._jsonSchemaVersion),bundleSource:G("string","DocumentSnapshot"),bundleName:G("string"),bundle:G("string")};class or extends Lt{data(e={}){return super.data(e)}}class fn{constructor(e,t,r,i){this._firestore=e,this._userDataWriter=t,this._snapshot=i,this.metadata=new er(i.hasPendingWrites,i.fromCache),this.query=r}get docs(){const e=[];return this.forEach((t=>e.push(t))),e}get size(){return this._snapshot.docs.size}get empty(){return this.size===0}forEach(e,t){this._snapshot.docs.forEach((r=>{e.call(t,new or(this._firestore,this._userDataWriter,r.key,r,new er(this._snapshot.mutatedKeys.has(r.key),this._snapshot.fromCache),this.query.converter))}))}docChanges(e={}){const t=!!e.includeMetadataChanges;if(t&&this._snapshot.excludesMetadataChanges)throw new L(M.INVALID_ARGUMENT,"To include metadata changes with your document changes, you must also pass { includeMetadataChanges:true } to onSnapshot().");return this._cachedChanges&&this._cachedChangesIncludeMetadataChanges===t||(this._cachedChanges=(function(i,a){if(i._snapshot.oldDocs.isEmpty()){let l=0;return i._snapshot.docChanges.map((h=>{Xp(i._snapshot.query)?Qp(i._snapshot.query):Jf(i.query._query);const f=new or(i._firestore,i._userDataWriter,h.doc.key,h.doc,new er(i._snapshot.mutatedKeys.has(h.doc.key),i._snapshot.fromCache),i.query.converter);return h.doc,{type:"added",doc:f,oldIndex:-1,newIndex:l++}}))}{let l=i._snapshot.oldDocs;return i._snapshot.docChanges.filter((h=>a||h.type!==3)).map((h=>{const f=new or(i._firestore,i._userDataWriter,h.doc.key,h.doc,new er(i._snapshot.mutatedKeys.has(h.doc.key),i._snapshot.fromCache),i.query.converter);let _=-1,b=-1;return h.type!==0&&(_=l.indexOf(h.doc.key),l=l.delete(h.doc.key)),h.type!==1&&(l=l.add(h.doc),b=l.indexOf(h.doc.key)),{type:tg(h.type),doc:f,oldIndex:_,newIndex:b}}))}})(this,t),this._cachedChangesIncludeMetadataChanges=t),this._cachedChanges}toJSON(){if(this.metadata.hasPendingWrites)throw new L(M.FAILED_PRECONDITION,"QuerySnapshot.toJSON() attempted to serialize a document with pending writes. Await waitForPendingWrites() before invoking toJSON().");const e={};e.type=fn._jsonSchemaVersion,e.bundleSource="QuerySnapshot",e.bundleName=Tf.newId(),this._firestore._databaseId.database,this._firestore._databaseId.projectId;const t=[],r=[],i=[];return this.docs.forEach((a=>{a._document!==null&&(t.push(a._document),r.push(this._userDataWriter.convertObjectMap(a._document.data.value.mapValue.fields,"previous")),i.push(a.ref.path))})),e.bundle=(this._firestore,this.query._query,e.bundleName,"NOT SUPPORTED"),e}}function tg(n){switch(n){case 0:return"added";case 2:case 3:return"modified";case 1:return"removed";default:return q(61501,{type:n})}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */fn._jsonSchemaVersion="firestore/querySnapshot/1.0",fn._jsonSchema={type:G("string",fn._jsonSchemaVersion),bundleSource:G("string","QuerySnapshot"),bundleName:G("string"),bundle:G("string")};(function(e,t=!0){pf(At),It(new ct("firestore",((r,{instanceIdentifier:i,options:a})=>{const l=r.getProvider("app").getImmediate(),h=new Zp(new yf(r.getProvider("auth-internal")),new If(l,r.getProvider("app-check-internal")),jf(l,i),l);return a={useFetchStreams:t,...a},h._setSettings(a),h}),"PUBLIC").setMultipleInstances(!0)),xe(Ho,qo,e),xe(Ho,qo,"esm2020")})();/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const lu="firebasestorage.googleapis.com",ng="storageBucket",rg=120*1e3,sg=600*1e3;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class $e extends Fe{constructor(e,t,r=0){super(hs(e),`Firebase Storage: ${t} (${hs(e)})`),this.status_=r,this.customData={serverResponse:null},this._baseMessage=this.message,Object.setPrototypeOf(this,$e.prototype)}get status(){return this.status_}set status(e){this.status_=e}_codeEquals(e){return hs(e)===this.code}get serverResponse(){return this.customData.serverResponse}set serverResponse(e){this.customData.serverResponse=e,this.customData.serverResponse?this.message=`${this._baseMessage}
${this.customData.serverResponse}`:this.message=this._baseMessage}}var Me;(function(n){n.UNKNOWN="unknown",n.OBJECT_NOT_FOUND="object-not-found",n.BUCKET_NOT_FOUND="bucket-not-found",n.PROJECT_NOT_FOUND="project-not-found",n.QUOTA_EXCEEDED="quota-exceeded",n.UNAUTHENTICATED="unauthenticated",n.UNAUTHORIZED="unauthorized",n.UNAUTHORIZED_APP="unauthorized-app",n.RETRY_LIMIT_EXCEEDED="retry-limit-exceeded",n.INVALID_CHECKSUM="invalid-checksum",n.CANCELED="canceled",n.INVALID_EVENT_NAME="invalid-event-name",n.INVALID_URL="invalid-url",n.INVALID_DEFAULT_BUCKET="invalid-default-bucket",n.NO_DEFAULT_BUCKET="no-default-bucket",n.CANNOT_SLICE_BLOB="cannot-slice-blob",n.SERVER_FILE_WRONG_SIZE="server-file-wrong-size",n.NO_DOWNLOAD_URL="no-download-url",n.INVALID_ARGUMENT="invalid-argument",n.INVALID_ARGUMENT_COUNT="invalid-argument-count",n.APP_DELETED="app-deleted",n.INVALID_ROOT_OPERATION="invalid-root-operation",n.INVALID_FORMAT="invalid-format",n.INTERNAL_ERROR="internal-error",n.UNSUPPORTED_ENVIRONMENT="unsupported-environment"})(Me||(Me={}));function hs(n){return"storage/"+n}function ig(){const n="An unknown error occurred, please check the error payload for server response.";return new $e(Me.UNKNOWN,n)}function og(){return new $e(Me.RETRY_LIMIT_EXCEEDED,"Max retry time for operation exceeded, please try again.")}function ag(){return new $e(Me.CANCELED,"User canceled the upload/download.")}function ug(n){return new $e(Me.INVALID_URL,"Invalid URL '"+n+"'.")}function lg(n){return new $e(Me.INVALID_DEFAULT_BUCKET,"Invalid default bucket '"+n+"'.")}function zo(n){return new $e(Me.INVALID_ARGUMENT,n)}function cu(){return new $e(Me.APP_DELETED,"The Firebase app was deleted.")}function cg(n){return new $e(Me.INVALID_ROOT_OPERATION,"The operation '"+n+"' cannot be performed on a root reference, create a non-root reference using child, such as .child('file.png').")}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ve{constructor(e,t){this.bucket=e,this.path_=t}get path(){return this.path_}get isRoot(){return this.path.length===0}fullServerUrl(){const e=encodeURIComponent;return"/b/"+e(this.bucket)+"/o/"+e(this.path)}bucketOnlyServerUrl(){return"/b/"+encodeURIComponent(this.bucket)+"/o"}static makeFromBucketSpec(e,t){let r;try{r=Ve.makeFromUrl(e,t)}catch{return new Ve(e,"")}if(r.path==="")return r;throw lg(e)}static makeFromUrl(e,t){let r=null;const i="([A-Za-z0-9.\\-_]+)";function a(Y){Y.path.charAt(Y.path.length-1)==="/"&&(Y.path_=Y.path_.slice(0,-1))}const l="(/(.*))?$",h=new RegExp("^gs://"+i+l,"i"),f={bucket:1,path:3};function _(Y){Y.path_=decodeURIComponent(Y.path)}const b="v[A-Za-z0-9_]+",R=t.replace(/[.]/g,"\\."),V="(/([^?#]*).*)?$",x=new RegExp(`^https?://${R}/${b}/b/${i}/o${V}`,"i"),O={bucket:1,path:3},B=t===lu?"(?:storage.googleapis.com|storage.cloud.google.com)":t,D="([^?#]*)",J=new RegExp(`^https?://${B}/${i}/${D}`,"i"),oe=[{regex:h,indices:f,postModify:a},{regex:x,indices:O,postModify:_},{regex:J,indices:{bucket:1,path:2},postModify:_}];for(let Y=0;Y<oe.length;Y++){const fe=oe[Y],re=fe.regex.exec(e);if(re){const w=re[fe.indices.bucket];let d=re[fe.indices.path];d||(d=""),r=new Ve(w,d),fe.postModify(r);break}}if(r==null)throw ug(e);return r}}class hg{constructor(e){this.promise_=Promise.reject(e)}getPromise(){return this.promise_}cancel(e=!1){}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function fg(n,e,t){let r=1,i=null,a=null,l=!1,h=0;function f(){return h===2}let _=!1;function b(...D){_||(_=!0,e.apply(null,D))}function R(D){i=setTimeout(()=>{i=null,n(x,f())},D)}function V(){a&&clearTimeout(a)}function x(D,...J){if(_){V();return}if(D){V(),b.call(null,D,...J);return}if(f()||l){V(),b.call(null,D,...J);return}r<64&&(r*=2);let oe;h===1?(h=2,oe=0):oe=(r+Math.random())*1e3,R(oe)}let O=!1;function B(D){O||(O=!0,V(),!_&&(i!==null?(D||(h=2),clearTimeout(i),R(0)):D||(h=1)))}return R(0),a=setTimeout(()=>{l=!0,B(!0)},t),B}function dg(n){n(!1)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function pg(n){return n!==void 0}function Wo(n,e,t,r){if(r<e)throw zo(`Invalid value for '${n}'. Expected ${e} or greater.`);if(r>t)throw zo(`Invalid value for '${n}'. Expected ${t} or less.`)}function gg(n){const e=encodeURIComponent;let t="?";for(const r in n)if(n.hasOwnProperty(r)){const i=e(r)+"="+e(n[r]);t=t+i+"&"}return t=t.slice(0,-1),t}var br;(function(n){n[n.NO_ERROR=0]="NO_ERROR",n[n.NETWORK_ERROR=1]="NETWORK_ERROR",n[n.ABORT=2]="ABORT"})(br||(br={}));/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function mg(n,e){const t=n>=500&&n<600,i=[408,429].indexOf(n)!==-1,a=e.indexOf(n)!==-1;return t||i||a}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class _g{constructor(e,t,r,i,a,l,h,f,_,b,R,V=!0,x=!1){this.url_=e,this.method_=t,this.headers_=r,this.body_=i,this.successCodes_=a,this.additionalRetryCodes_=l,this.callback_=h,this.errorCallback_=f,this.timeout_=_,this.progressCallback_=b,this.connectionFactory_=R,this.retry=V,this.isUsingEmulator=x,this.pendingConnection_=null,this.backoffId_=null,this.canceled_=!1,this.appDelete_=!1,this.promise_=new Promise((O,B)=>{this.resolve_=O,this.reject_=B,this.start_()})}start_(){const e=(r,i)=>{if(i){r(!1,new tr(!1,null,!0));return}const a=this.connectionFactory_();this.pendingConnection_=a;const l=h=>{const f=h.loaded,_=h.lengthComputable?h.total:-1;this.progressCallback_!==null&&this.progressCallback_(f,_)};this.progressCallback_!==null&&a.addUploadProgressListener(l),a.send(this.url_,this.method_,this.isUsingEmulator,this.body_,this.headers_).then(()=>{this.progressCallback_!==null&&a.removeUploadProgressListener(l),this.pendingConnection_=null;const h=a.getErrorCode()===br.NO_ERROR,f=a.getStatus();if(!h||mg(f,this.additionalRetryCodes_)&&this.retry){const b=a.getErrorCode()===br.ABORT;r(!1,new tr(!1,null,b));return}const _=this.successCodes_.indexOf(f)!==-1;r(!0,new tr(_,a))})},t=(r,i)=>{const a=this.resolve_,l=this.reject_,h=i.connection;if(i.wasSuccessCode)try{const f=this.callback_(h,h.getResponse());pg(f)?a(f):a()}catch(f){l(f)}else if(h!==null){const f=ig();f.serverResponse=h.getErrorText(),this.errorCallback_?l(this.errorCallback_(h,f)):l(f)}else if(i.canceled){const f=this.appDelete_?cu():ag();l(f)}else{const f=og();l(f)}};this.canceled_?t(!1,new tr(!1,null,!0)):this.backoffId_=fg(e,t,this.timeout_)}getPromise(){return this.promise_}cancel(e){this.canceled_=!0,this.appDelete_=e||!1,this.backoffId_!==null&&dg(this.backoffId_),this.pendingConnection_!==null&&this.pendingConnection_.abort()}}class tr{constructor(e,t,r){this.wasSuccessCode=e,this.connection=t,this.canceled=!!r}}function yg(n,e){e!==null&&e.length>0&&(n.Authorization="Firebase "+e)}function wg(n,e){n["X-Firebase-Storage-Version"]="webjs/"+(e??"AppManager")}function vg(n,e){e&&(n["X-Firebase-GMPID"]=e)}function Ig(n,e){e!==null&&(n["X-Firebase-AppCheck"]=e)}function Eg(n,e,t,r,i,a,l=!0,h=!1){const f=gg(n.urlParams),_=n.url+f,b=Object.assign({},n.headers);return vg(b,e),yg(b,t),wg(b,a),Ig(b,r),new _g(_,n.method,b,n.body,n.successCodes,n.additionalRetryCodes,n.handler,n.errorHandler,n.timeout,n.progressCallback,i,l,h)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Tg(n){if(n.length===0)return null;const e=n.lastIndexOf("/");return e===-1?"":n.slice(0,e)}function Ag(n){const e=n.lastIndexOf("/",n.length-2);return e===-1?n:n.slice(e+1)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Rr{constructor(e,t){this._service=e,t instanceof Ve?this._location=t:this._location=Ve.makeFromUrl(t,e.host)}toString(){return"gs://"+this._location.bucket+"/"+this._location.path}_newRef(e,t){return new Rr(e,t)}get root(){const e=new Ve(this._location.bucket,"");return this._newRef(this._service,e)}get bucket(){return this._location.bucket}get fullPath(){return this._location.path}get name(){return Ag(this._location.path)}get storage(){return this._service}get parent(){const e=Tg(this._location.path);if(e===null)return null;const t=new Ve(this._location.bucket,e);return new Rr(this._service,t)}_throwIfRoot(e){if(this._location.path==="")throw cg(e)}}function Go(n,e){const t=e==null?void 0:e[ng];return t==null?null:Ve.makeFromBucketSpec(t,n)}function bg(n,e,t,r={}){n.host=`${e}:${t}`;const i=Pn(e);i&&bs(`https://${n.host}/b`),n._isUsingEmulator=!0,n._protocol=i?"https":"http";const{mockUserToken:a}=r;a&&(n._overrideAuthToken=typeof a=="string"?a:ra(a,n.app.options.projectId))}class Rg{constructor(e,t,r,i,a,l=!1){this.app=e,this._authProvider=t,this._appCheckProvider=r,this._url=i,this._firebaseVersion=a,this._isUsingEmulator=l,this._bucket=null,this._host=lu,this._protocol="https",this._appId=null,this._deleted=!1,this._maxOperationRetryTime=rg,this._maxUploadRetryTime=sg,this._requests=new Set,i!=null?this._bucket=Ve.makeFromBucketSpec(i,this._host):this._bucket=Go(this._host,this.app.options)}get host(){return this._host}set host(e){this._host=e,this._url!=null?this._bucket=Ve.makeFromBucketSpec(this._url,e):this._bucket=Go(e,this.app.options)}get maxUploadRetryTime(){return this._maxUploadRetryTime}set maxUploadRetryTime(e){Wo("time",0,Number.POSITIVE_INFINITY,e),this._maxUploadRetryTime=e}get maxOperationRetryTime(){return this._maxOperationRetryTime}set maxOperationRetryTime(e){Wo("time",0,Number.POSITIVE_INFINITY,e),this._maxOperationRetryTime=e}async _getAuthToken(){if(this._overrideAuthToken)return this._overrideAuthToken;const e=this._authProvider.getImmediate({optional:!0});if(e){const t=await e.getToken();if(t!==null)return t.accessToken}return null}async _getAppCheckToken(){if(Ae(this.app)&&this.app.settings.appCheckToken)return this.app.settings.appCheckToken;const e=this._appCheckProvider.getImmediate({optional:!0});return e?(await e.getToken()).token:null}_delete(){return this._deleted||(this._deleted=!0,this._requests.forEach(e=>e.cancel()),this._requests.clear()),Promise.resolve()}_makeStorageReference(e){return new Rr(this,e)}_makeRequest(e,t,r,i,a=!0){if(this._deleted)return new hg(cu());{const l=Eg(e,this._appId,r,i,t,this._firebaseVersion,a,this._isUsingEmulator);return this._requests.add(l),l.getPromise().then(()=>this._requests.delete(l),()=>this._requests.delete(l)),l}}async makeRequestWithTokens(e,t){const[r,i]=await Promise.all([this._getAuthToken(),this._getAppCheckToken()]);return this._makeRequest(e,t,r,i).getPromise()}}const Ko="@firebase/storage",Jo="0.14.3";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const hu="storage";function Dg(n=Ps(),e){n=Le(n);const r=Pr(n,hu).getImmediate({identifier:e}),i=ea("storage");return i&&Pg(r,...i),r}function Pg(n,e,t,r={}){bg(n,e,t,r)}function Sg(n,{instanceIdentifier:e}){const t=n.getProvider("app").getImmediate(),r=n.getProvider("auth-internal"),i=n.getProvider("app-check-internal");return new Rg(t,r,i,e,At)}function Vg(){It(new ct(hu,Sg,"PUBLIC").setMultipleInstances(!0)),xe(Ko,Jo,""),xe(Ko,Jo,"esm2020")}Vg();export{st as G,Ng as a,Cg as b,Og as c,Dg as d,Ps as g,rc as i};
