<?php

namespace App\Console\Commands;

use App\services\mqttService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('app:mqttlisten')]
#[Description('Command description')]
class mqttlisten extends Command
{
    protected $signature = 'app:mqttlisten';

    protected $description = 'Escuta Mensagem MQTT do HiverMQ';

    public function handle(): int
    {
        $mqttService = new mqttService;
        $mqttService->receberDados();

        return Command::SUCCESS;
    }
}
