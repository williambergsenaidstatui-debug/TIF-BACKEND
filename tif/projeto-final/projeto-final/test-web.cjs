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
        if (route === '/recuperar_senha') { content = { mensagem: 'Se o e-mail estiver cadastrado, você receberá um link de recuperação.' }; }
else if (route === '/redefinir_senha') { assert.equal(body.password, body.password_confirmation); content = { mensagem: 'Senha redefinida. Entre novamente.' }; }
else if (route === '/login') {
          account = users.find((user) => user.email === body.email);
          if (!account || body.senha !== 'senha-teste') { code = 401; content = { mensagem: 'Email ou senha inválidos' }; }
          else { expired = false; content = { token: 'test-token', usuario: account }; }
        } else if (expired || !account || request.headers.Authorization !== 'Bearer test-token') {
          code = 401; content = { message: 'Unauthenticated.' };
        } else if (route === '/logout') { content = {}; account = null; }
        else if (route === '/user') content = account;
        else if (route === '/emprestimos') content = { data: [], total: 0, last_page: 1 };
else if (route === '/alertas') content = { atrasados: [], total_atrasados: 0, manutencao: [], total_manutencao: 0 };
else if (route === '/minha_senha') { assert.equal(body.password, body.password_confirmation); content = {}; account = null; }
else if (route === '/meus_equipamentos') content = equipment.filter((item) => item.id_usuario === account.id);
        else if (!account.is_admin) { code = 403; content = {}; }
        else if (route === '/listar_usuarios') content = users;
else if (route.startsWith('/usuarios/') && request.method === 'PUT') { Object.assign(users.find(user => user.id === Number(route.split('/').pop())), body); content = {}; }
else if (route.startsWith('/usuarios/') && request.method === 'DELETE') { users.splice(users.findIndex(user => user.id === Number(route.split('/').pop())), 1); content = {}; }
else if (/^\/equipamentos\/\d+\/leituras$/.test(route)) content = { data: [], total: 0, last_page: 1 };
else if (/^\/equipamentos\/\d+\/credencial$/.test(route)) content = { token: request.method === 'POST' ? 'a'.repeat(64) : undefined, mensagem: 'Credencial atualizada.' };
        else if (route === '/listar_equipamentos') content = equipment;
        else if (route === '/vincular_equipamento') {
          assert.equal(request.method, 'POST');
          assert.deepEqual(Object.keys(body).sort(), ['id_equipamento', 'id_usuario', 'previsto_para', ...(body.substituir_usuario_id ? ['substituir_usuario_id'] : [])].sort());
          assert.ok(users.some(user => user.id === body.id_usuario));
          Object.assign(equipment.find(item => item.id === body.id_equipamento), { id_usuario: body.id_usuario, status: 'Em uso' }); content = {};
        } else if (route === '/desvincular_equipamento') {
          assert.equal(request.method, 'POST');
          Object.assign(equipment.find(item => item.id === body.id_equipamento), { id_usuario: null, status: 'Disponível' }); content = {};
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
        const file = ['/', '/redefinir-senha'].includes(url.pathname) ? 'index.html' : decodeURIComponent(url.pathname.replace(/^\/frontend\//, ''));
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
    const expression = "[...document.querySelectorAll('[role=\"button\"]')].find(el => el.checkVisibility() && (el.innerText.trim() === " + JSON.stringify(text) + " || [...el.children].some(child => child.innerText.trim() === " + JSON.stringify(text) + ")))";
    await wait("Boolean(" + expression + ")");
    await evaluate("(" + expression + ").click()");
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
  await send('Page.navigate', { url: 'https://verify-test.local/' });
  await wait('document.querySelector("[data-testid=splash-screen]") !== null');
  await wait(hasText('Acesse sua conta'));
  assert.equal(await evaluate('document.querySelector("[data-testid=splash-screen]") === null'), true);
  await fill('E-mail', 'admin@example.com'); await fill('Senha', 'errada'); await click('Entrar');
  await wait(hasText('Email ou senha inválidos'));
  await login('admin@example.com');
  await click('Usuários'); await wait(hasText('Novo usuário')); await click('Novo usuário');
  for (const [label, value] of [['Nome completo', 'Novo Teste'], ['E-mail', 'admin@example.com'], ['CPF (11 dígitos)', '12345678903'], ['Data de nascimento (AAAA-MM-DD)', '2001-01-01'], ['Senha (12 a 72 caracteres, letras e números)', 'senha-teste']]) await fill(label, value);
  await click('Salvar'); await wait(hasText('E-mail já cadastrado.'));
  await fill('E-mail', 'novo@example.com'); await click('Salvar'); await wait(hasText('Usuário cadastrado com sucesso.'));
  assert.ok(users.some((user) => user.nome === 'Novo Teste'));
  await click('Computadores'); await wait(hasText('PC-001')); await click('Novo equipamento');
  for (const [label, value] of [['Número de série', 'PC-002'], ['Marca', 'Lenovo'], ['Modelo', 'ThinkPad'], ['Data de aquisição (AAAA-MM-DD)', '2026-09-01']]) await fill(label, value);
  await click('Salvar'); await wait(hasText('Equipamento cadastrado.')); await wait(hasText('PC-002'));
  await click('Vínculos'); await wait(hasText('PC-001')); await click('Novo Vínculo');
  await click('Salvar'); await wait(hasText('Preencha todos os campos.'));
  await click('2 · Usuario Teste'); await click('2 · PC-002 · ThinkPad');
  await fill('Devolução prevista (AAAA-MM-DD)', '2026-12-31');
  await click('Salvar'); await wait(hasText('Vínculo cadastrado com sucesso.'));
  assert.equal(equipment.find(item => item.id === 2).id_usuario, 2);
  await click('Alterar responsável'); await click('1 · Admin Teste');
  await fill('Devolução prevista (AAAA-MM-DD)', '2026-12-31');
  await click('Salvar'); await wait(hasText('Responsável atualizado com sucesso.'));
  assert.equal(equipment.find(item => item.id === 1).id_usuario, 1);
  await click('Visualizar vínculo'); await wait(hasText('Detalhes do vínculo')); await click('Fechar');
  await click('Registrar devolução'); await click('Cancelar'); assert.equal(equipment[0].id_usuario, 1);
  await click('Registrar devolução'); await click('Confirmar devolução'); await wait(hasText('Devolução registrada.'));
  assert.equal(equipment[0].id_usuario, null);
  await click('Registrar devolução'); await click('Confirmar devolução'); await wait(hasText('Nenhum vínculo ativo.'));
  assert.equal(equipment[1].id_usuario, null);
  await click('Computadores'); await wait(hasText('PC-001'));
  await click('Editar'); await wait(hasText('Editar equipamento')); await fill('Modelo', 'Modelo alterado'); await click('Salvar'); await wait(hasText('Modelo alterado'));
  await click('Excluir'); await wait(hasText('Confirmar exclusão')); await click('Cancelar');
  assert.equal(equipment.length, 2);
  await click('Excluir'); await click('Confirmar exclusão'); await wait(hasText('Equipamento excluído.'));
  assert.equal(equipment.length, 1);
  await click('Histórico'); await wait(hasText('HISTÓRICO DE EMPRÉSTIMOS')); await wait(hasText('0 registros'));
  await click('Alertas'); await wait(hasText('Empréstimos atrasados: 0'));
  await click('Sensores HTTP'); await wait(hasText('SENSORES HTTP'));
  await click('PC-002 · ThinkPad'); await wait(hasText('Gerar ou trocar credencial'));
  await click('Gerar ou trocar credencial'); await click('Confirmar operação'); await wait(hasText('Copie agora.'));
  assert.equal(await evaluate('document.querySelector("textarea").value'), 'a'.repeat(64));
  await click('Fechar');
  await click('Usuários'); await wait(hasText('Novo Teste'));
  await fill('Buscar usuário', 'Novo Teste'); await click('Editar usuário');
  await fill('Nome completo', 'Nome atualizado'); await click('Salvar');
  await fill('Buscar usuário', 'Nome atualizado'); await wait(hasText('Nome atualizado'));
  await click('Excluir usuário'); await click('Confirmar exclusão de usuário');
  await wait(hasText('Usuário excluído. Histórico preservado.'));
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
  await click('Esqueci minha senha'); await wait(hasText('Recuperar acesso'));
  await fill('E-mail', 'user@example.com'); await click('Enviar recuperação');
  await wait(hasText('Se o e-mail estiver cadastrado'));
  await click('Voltar ao login'); await login('user@example.com', false);
  await click('Configurações'); await wait(hasText('Alterar senha ·'));
  await fill('Senha atual', 'senha-teste'); await fill('Nova senha', 'Nova-senha-1234'); await fill('Confirmar nova senha', 'Nova-senha-1234');
  await click('Alterar senha'); await wait(hasText('Acesse sua conta'));
  await send('Page.navigate', { url: 'https://verify-test.local/redefinir-senha?token=teste&email=user%40example.com' });
  await wait(hasText('Redefinir senha')); await fill('Nova senha', 'Nova-senha-1234'); await fill('Confirmar nova senha', 'Nova-senha-1234');
  await click('Redefinir senha'); await wait(hasText('Senha redefinida. Entre novamente.'));
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
