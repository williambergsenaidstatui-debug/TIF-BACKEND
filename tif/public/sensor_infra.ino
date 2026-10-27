#define SENSOR_1 13
#define SENSOR_2 27
#define BUZZER 25

// Variáveis para controlar se os sensores estão ativos ou desativados
bool sensor1Ativo = true;
bool sensor2Ativo = true;

void setup() {
  Serial.begin(115200);

  pinMode(SENSOR_1, INPUT);
  pinMode(SENSOR_2, INPUT);
  pinMode(BUZZER, OUTPUT);

  noTone(BUZZER);

  Serial.println("Sistema iniciado!");
  Serial.println("Comandos aceitos: 'ativar-1', 'desativar-1', 'ativar-2', 'desativar-2'");
}

void loop() {
  // Verifica se há comandos chegando pelo Serial Monitor
  if (Serial.available() > 0) {
    String comando = Serial.readStringUntil('\n');
    comando.trim(); // Remove espaços em branco ou quebras de linha (\r)

    if (comando == "desativar-1") {
      sensor1Ativo = false;
      Serial.println("-> Sensor 1 DESATIVADO");
    }
    else if (comando == "ativar-1") {
      sensor1Ativo = true;
      Serial.println("-> Sensor 1 ATIVADO");
    }
    else if (comando == "desativar-2") {
      sensor2Ativo = false;
      Serial.println("-> Sensor 2 DESATIVADO");
    }
    else if (comando == "ativar-2") {
      sensor2Ativo = true;
      Serial.println("-> Sensor 2 ATIVADO");
    }
    else if (comando == "desativar-todos") {
      sensor2Ativo = false;
      sensor1Ativo = false;
      Serial.println("-> Sensores DESATIVADOs");
    }
    else if (comando == "ativar-todos") {
      sensor2Ativo = true;
      sensor1Ativo = true;
      Serial.println("-> Sensores ATIVADOS");
    }
  }

  // Se o sensor estiver ativo, lê o pino. Se desativado, força o estado "LOW" (objeto presente/ignorado)
  int s1 = sensor1Ativo ? digitalRead(SENSOR_1) : LOW;
  int s2 = sensor2Ativo ? digitalRead(SENSOR_2) : LOW;

  // FC-51: LOW = objeto detectado
  bool ausencia1 = (s1 == HIGH);
  bool ausencia2 = (s2 == HIGH);

  if (ausencia1 || ausencia2) {
    tone(BUZZER, 2500);
  } else {
    noTone(BUZZER);
  }

  // Print dos logs no monitor serial
  Serial.print("Sensor 1: ");
  if (sensor1Ativo) Serial.print(s1); else Serial.print("DESATIVADO");

  Serial.print(" | Sensor 2: ");
  if (sensor2Ativo) Serial.print(s2); else Serial.print("DESATIVADO");

  Serial.print(" | Estado: ");

  if (ausencia1 && ausencia2) {
    Serial.println("ALERTA: PC 1 e PC 2 AUSENTES");
  }
  else if (ausencia1) {
    Serial.println("ALERTA: PC 1 AUSENTE");
  }
  else if (ausencia2) {
    Serial.println("ALERTA: PC 2 AUSENTE");
  }
  else {
    Serial.println("NORMAL: Ambos presentes (ou desativados)");
  }

  delay(100);
}
