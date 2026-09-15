$(document).ready(function () {
    const token = sessionStorage.getItem("tif_token");
    const botao = $("#cadastro_usuario").prop("disabled", true);

    if (!token) {
        window.location.href = "/login";
        return;
    }

    $.ajax({
        url: "/api/user",
        headers: { Authorization: "Bearer " + token },
        success: function (usuario) {
            if (usuario.is_admin) {
                botao.prop("disabled", false);
            } else {
                Swal.fire({ icon: "error", title: "Acesso restrito ao administrador" });
            }
        },
        error: function (xhr) {
            if (xhr.status === 401) {
                sessionStorage.removeItem("tif_token");
                window.location.href = "/login";
            } else {
                Swal.fire({ icon: "error", title: "Não foi possível verificar seu acesso" });
            }
        }
    });

    botao.click(function () {
        $.ajax({
            url: "/api/cadastro_usuario",
            method: "POST",
            headers: { Authorization: "Bearer " + token },
            data: {
                nome: $("#nome").val(),
                email: $("#email").val(),
                senha: $("#senha").val(),
                data_nascimento: $("#data_nascimento").val(),
                cpf: $("#cpf").val()
            },
            success: function (response) {
                Swal.fire({ icon: "success", title: "Sucesso!", text: response.mensagem });
            },
            error: function (xhr) {
                Swal.fire({
                    icon: "error",
                    title: "Erro!",
                    text: xhr.responseJSON?.mensagem || xhr.responseJSON?.message || "Não foi possível cadastrar o usuário."
                });
            }
        });
    });
});
