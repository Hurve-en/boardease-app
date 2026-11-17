import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { parseAccount, ownerContacts, passwordProblem } from '../src/features/account/model.ts';

const account = { profile: {name:'Maya Santos',email:'maya@example.test'}, tenancy: {roomNumber:'101',boardingHouseName:null},owner:null };
function moduleAt(file, dependencies, globals = {}) {
  const exports = {};
  const source = readFileSync(new URL(file, import.meta.url), 'utf8');
  vm.runInNewContext(ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,
    {exports, require: name => { if (name in dependencies) return dependencies[name]; throw new Error(name); }, Error, ...globals});
  return exports;
}
test('account accepts absent tenancy/owner, rejects incomplete or malformed profiles', () => {
  assert.deepEqual(parseAccount(account), account);
  assert.deepEqual(parseAccount({...account,tenancy:null}).tenancy,null);
  for (const value of [null, {}, {...account, profile:{name:'Maya'}}, {...account,owner:{}}, {...account,tenancy:{roomNumber:42}}]) assert.throws(() => parseAccount(value));
});
test('contact links accept phone/email fields and reject injected URL schemes and headers', () => {
  assert.deepEqual(ownerContacts(null), []);
  const contacts = ownerContacts({name:'Owner',phone:'+63 (917) 123-4567',email:'owner@example.test'});
  assert.equal(contacts[0].url,'tel:+639171234567');
  assert.equal(contacts[1].url,'mailto:owner%40example.test');
  assert.deepEqual(ownerContacts({name:null,phone:'javascript:alert(1)',email:'a@example.test?bcc=bad@example.test'}),[]);
});
test('password validation checks current password, length, confirmation and reuse', () => {
  assert.ok(passwordProblem('', 'new-pass-123', 'new-pass-123'));
  assert.ok(passwordProblem('old-pass', 'short', 'short'));
  assert.ok(passwordProblem('old-pass', 'old-pass', 'old-pass'));
  assert.ok(passwordProblem('old-pass', 'new-pass-123', 'different'));
  assert.equal(passwordProblem('old-pass', 'new-pass-123', 'new-pass-123'), null);
});

test('account adapter uses current bearer token, abort signal and no-store; expired sessions are distinct', async () => {
  const calls = [];
  let token = 'first';
  let response = Response.json(account);
  const api = moduleAt('../src/features/account/api.ts', {
    '@/lib/auth': {getAccessToken:async()=>token}, './model': {parseAccount},
  }, {process:{env:{EXPO_PUBLIC_API_URL:'http://backend.test/'}}, fetch:async(...args)=>{calls.push(args);return response;}});
  const signal = new AbortController().signal;
  assert.deepEqual(await api.fetchAccount(signal),account);
  assert.equal(calls[0][0],'http://backend.test/api/tenant/account');
  assert.equal(calls[0][1].headers.Authorization,'Bearer first');
  assert.equal(calls[0][1].signal,signal);
  assert.equal(calls[0][1].cache,'no-store');
  token = 'refreshed'; response = new Response('{}',{status:401});
  await assert.rejects(api.fetchAccount(signal),api.AccountSessionError);
  assert.equal(calls[1][1].headers.Authorization,'Bearer refreshed');
  token = null;
  await assert.rejects(api.fetchAccount(signal),api.AccountSessionError);
  assert.equal(calls.length,2);
});

test('account failures are not replaced with invented data', async () => {
  for (const response of [new Response('{}',{status:403}),new Response('{}',{status:500}),Response.json({profile:{}})]) {
    const api = moduleAt('../src/features/account/api.ts', {'@/lib/auth':{getAccessToken:async()=> 'token'}, './model':{parseAccount}},
      {process:{env:{EXPO_PUBLIC_API_URL:'http://backend.test'}}, fetch:async()=>response});
    await assert.rejects(api.fetchAccount(new AbortController().signal));
  }
});

test('password change verifies the authenticated identity before updating, and preserves failures', async () => {
  const calls=[];
  let verificationError=null;
  let updateError=null;
  const service=moduleAt('../src/features/account/password.ts', {'@/lib/supabase':{supabase:{auth:{
    getUser:async()=>({data:{user:{email:'signed-in@example.test'}},error:null}),
    signInWithPassword:async input=>{calls.push(['verify',input]);return {error:verificationError};},
    updateUser:async input=>{calls.push(['update',input]);return {error:updateError};},
  }}}});
  await service.changePassword('old-pass','new-pass');
  assert.equal(calls[0][1].email,'signed-in@example.test');
  assert.equal(calls[0][1].password,'old-pass');
  assert.equal(calls[1][1].password,'new-pass');
  calls.length=0; verificationError={message:'Invalid credentials'};
  await assert.rejects(service.changePassword('wrong','new-pass'),/verify/);
  assert.equal(calls.length,1);
  verificationError=null; updateError={code:'weak_password'};
  await assert.rejects(service.changePassword('old-pass','new-pass'),/stronger/);
});

test('password changes stop before verification/update when authentication is missing or invalid', async () => {
  const unconfigured = moduleAt('../src/features/account/password.ts', {'@/lib/supabase':{supabase:null}});
  await assert.rejects(unconfigured.changePassword('old-pass','new-pass'), /unavailable/);
  for (const result of [
    {data:{user:null},error:null},
    {data:{user:{email:null}},error:null},
    {data:{user:{email:'tenant@example.test'}},error:{message:'Expired session'}},
  ]) {
    let mutations=0;
    const service=moduleAt('../src/features/account/password.ts', {'@/lib/supabase':{supabase:{auth:{
      getUser:async()=>result,
      signInWithPassword:async()=>{mutations++;return {error:null};},
      updateUser:async()=>{mutations++;return {error:null};},
    }}}});
    await assert.rejects(service.changePassword('old-pass','new-pass'), /sign in again/);
    assert.equal(mutations,0);
  }
});

test('password transport failures do not report success or attempt a save after failed verification', async () => {
  let updates=0;
  let verificationFails=true;
  const service=moduleAt('../src/features/account/password.ts', {'@/lib/supabase':{supabase:{auth:{
    getUser:async()=>({data:{user:{email:'tenant@example.test'}},error:null}),
    signInWithPassword:async()=>{if(verificationFails) throw new Error('Network request failed');return {error:null};},
    updateUser:async()=>{updates++;throw new Error('Network request failed');},
  }}}});
  await assert.rejects(service.changePassword('old-pass','new-pass'), /Network request failed/);
  assert.equal(updates,0);
  verificationFails=false;
  await assert.rejects(service.changePassword('old-pass','new-pass'), /Network request failed/);
  assert.equal(updates,1);
});
