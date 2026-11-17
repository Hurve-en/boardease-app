import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function authModule(auth) {
  const exports = {};
  const source = readFileSync(new URL('../src/lib/auth.ts', import.meta.url), 'utf8');
  const {outputText, diagnostics} = ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS}, reportDiagnostics:true});
  assert.equal(diagnostics.length, 0, 'Auth source must be valid TypeScript');
  vm.runInNewContext(outputText, {
    exports,
    require(name) {
      if (name === './supabase') return {supabase:auth ? {auth} : null};
      throw new Error(`Unexpected auth dependency ${name}`);
    },
    Error,
    Set,
  });
  return exports;
}

test('History reads the current Supabase token each time instead of legacy storage', async () => {
  let token = 'first-token';
  const auth = authModule({getSession:async()=>({data:{session:{access_token:token}},error:null})});
  assert.equal(await auth.getAccessToken(), 'first-token');
  token = 'refreshed-token';
  assert.equal(await auth.getAccessToken(), 'refreshed-token');
});

test('missing Supabase sessions return no token and storage failures remain errors', async () => {
  assert.equal(await authModule(null).getAccessToken(), null);
  const auth = authModule({getSession:async()=>({data:{session:null},error:null})});
  assert.equal(await auth.getAccessToken(), null);
  const failure = new Error('Session storage unavailable');
  await assert.rejects(authModule({getSession:async()=>({data:{session:null},error:failure})}).getAccessToken(), failure);
});

test('sign-out clears only the current Supabase session and updates the route guard', async () => {
  const calls = [];
  const events = [];
  const auth = authModule({signOut:async options=>{calls.push(options);return {error:null};}});
  const unsubscribe = auth.onAuthChange(value=>events.push(value));
  await auth.signOut();
  assert.equal(calls[0].scope, 'local');
  assert.deepEqual(events, [false]);
  unsubscribe();
});

test('failed sign-out does not claim that the session has been cleared', async () => {
  const failure = new Error('Could not clear session');
  const auth = authModule({signOut:async()=>({error:failure})});
  const events = [];
  auth.onAuthChange(value=>events.push(value));
  await assert.rejects(auth.signOut(), failure);
  assert.deepEqual(events, []);
});

test('sign-in preserves main’s Supabase flow and notifies the protected route guard', async () => {
  const events = [];
  let submitted;
  const auth = authModule({signInWithPassword:async input=>{submitted=input;return {error:null};}});
  auth.onAuthChange(value=>events.push(value));
  assert.equal(await auth.signIn(' tenant@example.test ', 'test-password'), null);
  assert.equal(submitted.email, 'tenant@example.test');
  assert.equal(submitted.password, 'test-password');
  assert.deepEqual(events, [true]);
});

test('restoration preserves main’s user validation and rejects failed checks', async () => {
  assert.equal(await authModule({getUser:async()=>({data:{user:{id:'tenant'}},error:null})}).hasSession(), true);
  assert.equal(await authModule({getUser:async()=>({data:{user:null},error:null})}).hasSession(), false);
  const failure = new Error('Invalid session');
  await assert.rejects(authModule({getUser:async()=>({data:{user:null},error:failure})}).hasSession(), failure);
});
