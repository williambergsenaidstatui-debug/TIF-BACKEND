?php
namespace App\Services;

use App\Models\Sensor;
use phpqmtt\client\MQTTClient;
use phpmqtt\client\ConnectionSettings;

class MqttServices
{
    private $mqttClient;

    public function __construct()
    {
        $host = env('Mqtt_HOST');
        $port = env('Mqtt_PORT');
        $username = env('Mqtt_USERNAME');
        $password = env('Mqtt_PASSWORD');

        $connectionSettings = (new ConnectionSettings)
            ->setUsername($username)
            ->setPassword($password);

        $this->mqttClient = new MQTTClient($host, $port, 'phpMQTT', $connectionSettings);
    }

    public function subscribeToTopic($topic)
    {
        $this->mqttClient->connect();
        $this->mqttClient->subscribe($topic, function ($topic, $message) {
            // Aqui você pode processar a mensagem recebida
            // Por exemplo, salvar no banco de dados
            Sensor::create([
                'sensor_nome' => $topic,
                'valor_digital' => (bool)$message,
                'valor_analogico' => null, // Ajuste conforme necessário
            ]);
        });
        $this->mqttClient->loop(true);
    }
}
