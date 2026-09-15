import jquery from 'jquery';
    $(document).ready(function() {

        $ajax({
            url: "api/cadastro_equipamento",
            method: "POST",
            data: {
                modelo: $("#modelo").val(),
                marca: $("#marca").val(),
                categoria: $("#categoria").val(),
                numero_serie: $("#numero_serie").val(),
                data_aquisicao: $("#data_aquisicao").val(),
                status: $("#status").val(),
            },

            success: function (response) {
                console.log(response);
                console.log(response['erro']);
                if(response['erro'] == 'n'){
                    Swal.fire({
                        icon: 'success',
                        title: 'Sucesso!',
                        text: 'Cadastro realizado com sucesso!'
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

