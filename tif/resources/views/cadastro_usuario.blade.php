<!DOCTYPE html>
<html lang="pt-BR">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet"
        integrity="sha384-sRIl4kxILFvY47J16cr9ZwB07vP4J8+LH7qKQnuqkuIAvNWLzeN8tE5YBujZqJLB" crossorigin="anonymous">
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js"
        integrity="sha384-FKyoEForCGlyvwx9Hj09JcYn3nv7wiPVlz7YYwJrWVcXK/BmnVDxM+D2scQbITxI" crossorigin="anonymous">
    </script>
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    @vite('resources/js/cadastro_usuario.js')
</head>

<body>
    <div class="container">
        <h3 class="text-center mt-3">Cadastro de Usuário</h3>
        <div class="row bg-light p-3 rounded">
            <div class="col-lg-6 col-md-6 col-sm-12 mt-3">
                <label for="nome">Nome:</label>
                <input type="text" class="form-control form-control-sm" id="nome" name="nome"
                    placeholder="Digite seu nome"></input>
            </div>
            <div class="col-lg-6 col-md-6 col-sm-12 mt-3">
                <label for="email">Email:</label>
                <input type="email" class="form-control form-control-sm" id="email" name="email"
                    placeholder="Digite seu email"></input>
            </div>
            <div class="col-lg-6 col-md-6 col-sm-12 mt-3">
                <label for="senha">Senha:</label>
                <input type="password" class="form-control form-control-sm" id="senha" name="senha"
                    placeholder="Digite sua senha"></input>
            </div>
            <div class="col-lg-3 col-md-3 col-sm-12 mt-3">
                <label for="data_nascimento">Data de Nascimento:</label>
                <input type="date" class="form-control form-control-sm" id="data_nascimento" name="data_nascimento"
                    placeholder="Digite sua data de nascimento"></input>
            </div>
            <div class="col-lg-3 col-md-3 col-sm-12 mt-3">
                <label for="cpf">CPF:</label>
                <input type="text" class="form-control form-control-sm" id="cpf" name="cpf"
                    placeholder="Digite seu CPF"></input>
            </div>
            <div class="col-lg-12 col-md-12 col-sm-12 mt-3 justify-content-center d-flex">
                <button id="cadastro_usuario" type="button"
                 class="btn text-center btn-primary btn-sm">Cadastrar Usuario</button>
            </div>
        </div>
    </div>
</body>

</html>
