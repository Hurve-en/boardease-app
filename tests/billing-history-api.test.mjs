import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {BillingHistorySessionError} from '../src/features/billing-history/errors.ts';
import {parseBillingHistory} from '../src/features/billing-history/model.ts';
import {previewHistory} from '../src/features/billing-history/fixture.ts';

// Execute the real adapter with only storage and network replaced.
function adapter(token, response) {
  const calls = [];
  const exports = {};
  const source = readFileSync(new URL('../src/features/billing-history/api.ts', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
  vm.runInNewContext(compiled, {
    exports,
    require(name) {
      if (name === '@/lib/auth') return {getAccessToken: async () => token};
      if (name === './model') return {parseBillingHistory};
      if (name === './errors') return {BillingHistorySessionError};
      throw new Error(`Unexpected dependency: ${name}`);
    },
    process:{env:{EXPO_PUBLIC_API_URL:'http://backend.test/'}},
    fetch:async (...args) => {calls.push(args); return response;},
    Error,
  });
  return {...exports, calls};
}

test('expired sessions produce the recovery error rather than a retryable network error', async () => {
  for (const token of [null, 'expired-token']) {
    const api = adapter(token, new Response('{}', {status:401}));
    await assert.rejects(api.fetchBillingHistory(new AbortController().signal), BillingHistorySessionError);
    assert.equal(api.calls.length, token ? 1 : 0);
  }
});

test('normal requests preserve bearer authorization, cancellation, and parsed data', async () => {
  const api = adapter('tenant-token', Response.json(previewHistory));
  const signal = new AbortController().signal;
  assert.deepEqual(await api.fetchBillingHistory(signal), previewHistory);
  assert.equal(api.calls[0][0], 'http://backend.test/api/tenant/bills');
  assert.equal(api.calls[0][1].headers.Authorization, 'Bearer tenant-token');
  assert.equal(api.calls[0][1].signal, signal);
});

test('missing linkage and server failures do not incorrectly request another sign-in', async () => {
  for (const response of [Response.json({code:'TENANT_NOT_LINKED'}, {status:403}), new Response('{}',{status:500})]) {
    const api = adapter('tenant-token', response);
    await assert.rejects(api.fetchBillingHistory(new AbortController().signal), error => !(error instanceof BillingHistorySessionError));
  }
});
