const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');
const os = require('node:os');

const root = path.resolve(__dirname, '../../public/frontend');
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-system-test-'));
const chromePath = process.env.CHROME_PATH || (process.platform === 'win32'
  ? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
  : process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : '/usr/bin/google-chrome');
const chrome = spawn(chromePath, [
  '--headless', '--no-sandbox', '--disable-gpu', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank',
], { windowsHide: true });
let ws;
const errors = [];
const requests = [];
const users = [{ id: 1, nome: 'Admin Teste', email: 'admin@example.com', cpf: '12345678901', data_nascimento: '2000-01-01', is_admin: true },
  { id: 2, nome: 'Usuario Teste', email: 'user@example.com', cpf: '12345678902', data_nascimento: '2000-01-01', is_admin: false }];
const equipment = [{ id: 1, numero_serie: 'PC-001', categoria: 'Computador', marca: 'Dell', modelo: 'Teste', data_aquisicao: '2026-01-01', status: 'Em uso', id_usuario: 2 }];
let account = null;
let expired = false;

(async () => {
  const endpoint = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Chrome timeout')), 15000);
    chrome.on('error', reject);
    chrome.stderr.on('data', (chunk) => {
      const match = chunk.toString().match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) { clearTimeout(timer); resolve(match[1]); }
    });
  });
  ws = new WebSocket(endpoint);
  await new Promise((resolve) => ws.addEventListener('open', resolve, { once: true }));
  let id = 0;
  let sessionId;
  const pending = new Map();
  function send(method, params = {}, session = sessionId) {
    return new Promise((resolve, reject) => {
      const messageId = ++id;
      pending.set(messageId, { resolve, reject });
      ws.send(JSON.stringify({ id: messageId, method, params, ...(session ? { sessionId: session } : {}) }));
    });
  }
  ws.addEventListener('message', async ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) {
      const promise = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) promise.reject(new Error(JSON.stringify(message.error)));
      else promise.resolve(message.result);
    }
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails);
    if (message.method !== 'Fetch.requestPaused') return;
    const { requestId, request } = message.params;
    const url = new URL(request.url);
    try {
      let content, type = 'application/json', code = 200;
      if (url.pathname.startsWith('/api/')) {
        requests.push({ path: url.pathname, method: request.method, body: request.postData });
        const body = request.postData ? JSON.parse(request.postData) : {};
        const route = url.pathname.slice(4);
        if (route === '/login') {
          account = users.find((user) => user.email === body.email);
          if (!account || body.senha !== 'senha-teste') { code = 401; content = { mensagem: 'Email ou senha inválidos' }; }
          else { expired = false; content = { token: 'test-token', usuario: account }; }
        } else if (expired || !account || request.headers.Authorization !== 'Bearer test-token') {
          code = 401; content = { message: 'Unauthenticated.' };
        } else if (route === '/logout') { content = {}; account = null; }
        else if (route === '/user') content = account;
        else if (route === '/meus_equipamentos') content = equipment.filter((item) => item.id_usuario === account.id);
        else if (!account.is_admin) { code = 403; content = {}; }
        else if (route === '/listar_usuarios') content = users;
        else if (route === '/listar_equipamentos') content = equipment;
        else if (route === '/vincular_equipamento') {
          assert.equal(request.method, 'POST');
          assert.deepEqual(Object.keys(body).sort(), ['id_equipamento', 'id_usuario']);
          assert.ok(users.some(user => user.id === body.id_usuario));
          equipment.find(item => item.id === body.id_equipamento).id_usuario = body.id_usuario; content = {};
        } else if (route === '/desvincular_equipamento') {
          assert.equal(request.method, 'POST');
          equipment.find(item => item.id === body.id_equipamento).id_usuario = null; content = {};
        }
        else if (route === '/cadastro_usuario') {
          assert.deepEqual(Object.keys(body).sort(), ['cpf', 'data_nascimento', 'email', 'nome', 'senha'].sort());
          if (users.some((user) => user.email === body.email)) { code = 422; content = { errors: { email: ['E-mail já cadastrado.'] } }; }
          else { users.push({ ...body, id: users.length + 1, is_admin: false }); content = {}; code = 201; }
        } else if (route === '/cadastro_equipamento') {
          assert.deepEqual(Object.keys(body).sort(), ['numero_serie', 'categoria', 'marca', 'modelo', 'data_aquisicao', 'status'].sort());
          equipment.push({ ...body, id: 2, id_usuario: null }); content = {}; code = 201;
        } else if (route.startsWith('/atualizar_equipamento/')) { Object.assign(equipment.find((item) => item.id === Number(route.split('/').pop())), body); content = {}; }
        else if (route.startsWith('/excluir_equipamento/')) { equipment.splice(equipment.findIndex((item) => item.id === Number(route.split('/').pop())), 1); content = {}; }
        else throw new Error('Unexpected API ' + route);
        content = Buffer.from(JSON.stringify(content));
      } else {
        const file = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname.replace(/^\/frontend\//, ''));
        const resolved = path.resolve(root, file);
        assert.ok(resolved.startsWith(root + path.sep));
        content = fs.readFileSync(resolved);
        type = resolved.endsWith('.js') ? 'application/javascript' : resolved.endsWith('.png') ? 'image/png' : resolved.endsWith('.ico') ? 'image/x-icon' : 'text/html';
      }
      await send('Fetch.fulfillRequest', { requestId, responseCode: code, responseHeaders: [{ name: 'Content-Type', value: type }], body: content.toString('base64') });
    } catch (error) {
      errors.push(error.message);
      await send('Fetch.fulfillRequest', { requestId, responseCode: 500, body: '' });
    }
  });
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' }, null);
  ({ sessionId } = await send('Target.attachToTarget', { targetId, flatten: true }, null));
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Fetch.enable', { patterns: [{ urlPattern: '*' }] });
  await send('Emulation.setDeviceMetricsOverride', { width: 1366, height: 900, deviceScaleFactor: 1, mobile: false });
  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  async function wait(expression) {
    const start = Date.now();
    while (Date.now() - start < 12000) {
      if (await evaluate(expression)) return;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error('Timeout: ' + expression + '\n' + await evaluate('document.body.innerText'));
  }
  const hasText = (text) => `document.body.innerText.includes(${JSON.stringify(text)})`;
  async function click(text) {
    await evaluate(`(() => { const item = [...document.querySelectorAll('[role="button"]')].find(el => el.checkVisibility() && (el.innerText.trim() === ${JSON.stringify(text)} || [...el.children].some(child => child.innerText.trim() === ${JSON.stringify(text)}))); if (!item) throw new Error('Button missing: ' + ${JSON.stringify(text)}); item.click(); })()`);
  }
  async function fill(label, value) {
    await evaluate(`(() => { const item = [...document.querySelectorAll('input[aria-label="' + ${JSON.stringify(label)} + '"]')].find(el => el.checkVisibility()); if (!item) throw new Error('Input missing'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(item, ${JSON.stringify(value)}); item.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  }
  async function login(email, linked = true) {
    await wait(hasText('Acesse sua conta'));
    await fill('E-mail', email); await fill('Senha', 'senha-teste'); await click('Entrar');
    await wait(hasText('DASHBOARD'));
    await wait(hasText(linked ? 'PC-001' : 'Nenhum equipamento vinculado.'));
  }
  await send('Page.navigate', { url: 'http://verify-test.local/' });
  await wait('document.querySelector("[data-testid=splash-screen]") !== null');
  await wait(hasText('Acesse sua conta'));
  assert.equal(await evaluate('document.querySelector("[data-testid=splash-screen]") === null'), true);
  await fill('E-mail', 'admin@example.com'); await fill('Senha', 'errada'); await click('Entrar');
  await wait(hasText('Email ou senha inválidos'));
  await login('admin@example.com');
  await click('Usuários'); await wait(hasText('Novo usuário')); await click('Novo usuário');
  for (const [label, value] of [['Nome completo', 'Novo Teste'], ['E-mail', 'admin@example.com'], ['CPF (11 dígitos)', '12345678903'], ['Data de nascimento (AAAA-MM-DD)', '2001-01-01'], ['Senha (mínimo de 6 caracteres)', 'senha-teste']]) await fill(label, value);
  await click('Salvar'); await wait(hasText('E-mail já cadastrado.'));
  await fill('E-mail', 'novo@example.com'); await click('Salvar'); await wait(hasText('Usuário cadastrado com sucesso.'));
  assert.ok(users.some((user) => user.nome === 'Novo Teste'));
  await click('Computadores'); await wait(hasText('PC-001')); await click('Novo equipamento');
  for (const [label, value] of [['Número de série', 'PC-002'], ['Marca', 'Lenovo'], ['Modelo', 'ThinkPad'], ['Data de aquisição (AAAA-MM-DD)', '2026-09-01']]) await fill(label, value);
  await click('Salvar'); await wait(hasText('Equipamento cadastrado.')); await wait(hasText('PC-002'));
  await click('Vínculos'); await wait(hasText('PC-001')); await click('Novo Vínculo');
  await click('Cadastrar'); await wait(hasText('Selecione um usuário e um equipamento.'));
  async function selectOption(index, name) {
    await evaluate(`document.querySelectorAll('[aria-label="Selecionar op\u00e7\u00e3o"]')[${index}].click()`);
    await click(name);
  }
  await selectOption(0, 'Usuario Teste'); await selectOption(1, 'ThinkPad (PC-002)');
  await click('Cadastrar'); await wait(hasText('Vínculo cadastrado com sucesso.'));
  assert.equal(equipment.find(item => item.id === 2).id_usuario, 2);
  await click('A'); await selectOption(0, 'Admin Teste'); await click('Salvar responsável');
  await wait(hasText('Responsável atualizado com sucesso.'));
  assert.equal(equipment.find(item => item.id === 1).id_usuario, 1);
  await click('V'); await wait(hasText('Detalhes do vínculo')); await click('Fechar');
  await click('D'); await click('Cancelar'); assert.equal(equipment[0].id_usuario, 1);
  await click('D'); await click('Confirmar desvínculo'); await wait(hasText('Vínculo removido com sucesso.'));
  assert.equal(equipment[0].id_usuario, null);
  await click('D'); await click('Confirmar desv\u00ednculo'); await wait(hasText('Nenhum v\u00ednculo encontrado.'));
  assert.equal(equipment[1].id_usuario, null);
  await click('Computadores'); await wait(hasText('PC-001'));
  await click('Editar'); await wait(hasText('Editar equipamento')); await fill('Modelo', 'Modelo alterado'); await click('Salvar'); await wait(hasText('Modelo alterado'));
  await click('Excluir'); await wait(hasText('Confirmar exclusão')); await click('Cancelar');
  assert.equal(equipment.length, 2);
  await click('Excluir'); await click('Confirmar exclusão'); await wait(hasText('Equipamento excluído.'));
  assert.equal(equipment.length, 1);
  await send('Page.reload'); await wait(hasText('DASHBOARD')); await wait(hasText('Nenhum equipamento vinculado.'));
  await click('Sair'); await login('user@example.com', false);
  const requestStart = requests.length;
  await click('Meus equipamentos'); await wait(hasText('Nenhum registro encontrado.'));
  assert.equal(await evaluate(hasText('Novo equipamento')), false);
  assert.equal(await evaluate(hasText('Usuários')), false);
  assert.ok(requests.slice(requestStart).every((request) => request.path === '/api/meus_equipamentos'));
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  assert.equal(await evaluate('document.documentElement.scrollWidth <= 390'), true);
  expired = true;
  await click('Atualizar'); await wait(hasText('Acesse sua conta'));
  assert.equal(await evaluate('sessionStorage.getItem("verify-system-session")'), null);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ result: 'passed', checks: ['invalid login', 'admin login', 'user validation and creation', 'equipment creation/edit/delete', 'cancel deletion', 'link creation and validation', 'change owner', 'link details', 'cancel and confirm unlink', 'session restore', 'logout', 'user restrictions', 'mobile layout', 'expired session'], requests: requests.length }));
  await send('Browser.close', {}, null);
})().catch((error) => { console.error(error, errors); process.exitCode = 1; }).finally(async () => {
  if (ws) ws.close();
  if (chrome.exitCode === null) {
    await new Promise((resolve) => { chrome.once('exit', resolve); chrome.kill(); });
  }
  if (path.dirname(profile) === os.tmpdir() && path.basename(profile).startsWith('verify-system-test-')) {
    fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
});
