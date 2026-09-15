param(
    [string]$Base = 'http://127.0.0.1:8000/api',
    [string]$AdminEmail = 'Wadmin@gmail.com'
)

$ErrorActionPreference = 'Stop'
$Base = $Base.TrimEnd('/')

function Invoke-TifApi {
    param([string]$Metodo, [string]$Rota, $Dados = $null, [string]$Token = '')

    $parametros = @{
        Method = $Metodo
        Uri = "$Base/$Rota"
        Headers = @{ Accept = 'application/json' }
        TimeoutSec = 20
    }
    if ($Token) {
        $parametros.Headers.Authorization = "Bearer $Token"
    }
    if ($null -ne $Dados) {
        $parametros.ContentType = 'application/json; charset=utf-8'
        $parametros.Body = [System.Text.Encoding]::UTF8.GetBytes(($Dados | ConvertTo-Json))
    }
    Invoke-RestMethod @parametros
}

try {
    $credencial = Get-Credential -UserName $AdminEmail -Message 'Login do administrador'
    if ($null -eq $credencial) { throw 'Login cancelado.' }

    $admin = Invoke-TifApi 'POST' 'login' @{
        email = $credencial.UserName
        senha = $credencial.GetNetworkCredential().Password
    }
    if (-not $admin.usuario.is_admin) {
        throw 'Esta conta nao e administradora. Use uma conta criada com php artisan admin:criar.'
    }

    # Cada execucao usa identificadores novos para evitar cadastros duplicados.
    $identificador = [guid]::NewGuid().ToString('N').Substring(0, 12)
    $emailUsuario = "joao.$identificador@example.com"
    $numeroSerie = "PC-TESTE-$identificador"

    Write-Host "Criando usuario: $emailUsuario"
    $null = Invoke-TifApi 'POST' 'cadastro_usuario' @{
        nome = 'Joao Teste'
        email = $emailUsuario
        senha = 'teste123'
        cpf = '12345678901'
        data_nascimento = '2000-01-01'
    } $admin.token

    $usuario = Invoke-TifApi 'POST' 'login' @{
        email = $emailUsuario
        senha = 'teste123'
    }

    Write-Host "Criando PC: $numeroSerie"
    $null = Invoke-TifApi 'POST' 'cadastro_equipamento' @{
        modelo = 'OptiPlex'
        marca = 'Dell'
        categoria = 'Computador'
        numero_serie = $numeroSerie
        data_aquisicao = (Get-Date -Format 'yyyy-MM-dd')
        status = 'ativo'
    } $admin.token

    $pc = Invoke-TifApi 'GET' "buscar_equipamento_por_numero_serie/$numeroSerie" $null $admin.token
    $null = Invoke-TifApi 'POST' 'vincular_equipamento' @{
        id_usuario = $usuario.usuario.id
        id_equipamento = $pc.id
    } $admin.token

    $equipamentos = Invoke-TifApi 'GET' 'meus_equipamentos' $null $usuario.token
    $vinculado = @($equipamentos | Where-Object {
        $_.id -eq $pc.id -and $_.id_usuario -eq $usuario.usuario.id
    })
    if ($vinculado.Count -ne 1) { throw 'O vinculo nao apareceu na consulta do usuario.' }

    Write-Host 'Usuario e PC criados. Vinculo confirmado.' -ForegroundColor Green
    [pscustomobject]@{
        UsuarioId = $usuario.usuario.id
        Email = $emailUsuario
        SenhaTeste = 'teste123'
        ComputadorId = $pc.id
        NumeroSerie = $numeroSerie
    } | Format-List
} catch {
    Write-Host 'O teste foi interrompido:' -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.ErrorDetails.Message) { Write-Host $_.ErrorDetails.Message }
    Write-Host 'Se houve cadastro antes do erro, ele permanece no banco.'
    exit 1
}
