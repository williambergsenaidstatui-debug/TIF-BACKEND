import jquery from 'jquery';
$(document).ready(function() {
    $ajax({
        url: "api/vincular_equipamento",
        method: "POST",
        data: {
            id_usuario: $("#id_usuario").val(),
            id_equipamento: $("#id_equipamento").val(),
        },

        success: function (response) {
            console.log(response);
            console.log(response['erro']);
            if(response['erro'] == 'n'){
                Swal.fire({
                    icon: 'success',
                    title: 'Sucesso!',
                    text: 'Equipamento vinculado com sucesso!'
                });
            }else{
                Swal.fire({
                    icon: 'error',
                    title: 'Erro!',
                    text: response['mensagem']
                });
            }
        }
    });
});
