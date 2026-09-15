$(document).ready(function () {
    $("#entrar").click(function () {
        $.ajax({
            url: "/api/login",
            method: "POST",
            data: { email: $("#email").val(), senha: $("#senha").val() },
            success: function (response) {
                sessionStorage.setItem("tif_token", response.token);
                Swal.fire({
                    icon: "success",
                    title: "Sucesso!",
                    text: response.mensagem
                }).then(function () {
                    if (response.usuario.is_admin) {
                        window.location.href = "/cadastro_usuario";
                    }
                });
            },
            error: function (xhr) {
                Swal.fire({
                    icon: "error",
                    title: "Erro!",
                    text: xhr.responseJSON?.mensagem || xhr.responseJSON?.message || "Não foi possível entrar."
                });
            }
        });
    });
});
