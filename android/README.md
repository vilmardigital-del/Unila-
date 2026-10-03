# Projeto Android Studio - UNILA Vistorias

Este é o projeto completo para Android Studio pronto para gerar o APK do aplicativo **UNILA Vistorias e Manutenção de Apartamentos**.

O aplicativo foi configurado para funcionar **online e offline**, com cache persistente no dispositivo, sincronização em tempo real com o banco de dados Firebase Firestore e suporte a download de relatórios em PDF.

---

## 📱 Estrutura do Projeto

```
android/
├── app/
│   ├── build.gradle.kts           # Configuração do módulo Android (compileSdk 34, minSdk 24)
│   ├── proguard-rules.pro         # Regras do Proguard
│   └── src/
│       └── main/
│           ├── AndroidManifest.xml # Permissões (INTERNET, ACCESS_NETWORK_STATE) e Activity
│           ├── java/com/unila/vistorias/
│           │   ├── MainActivity.kt # Activity com WebView inteligente e suporte offline
│           │   └── NetworkUtils.kt # Monitoramento em tempo real de conectividade
│           └── res/               # Ícones vetoriais adaptativos, temas e strings
├── build.gradle.kts               # Configuração raiz Gradle
├── settings.gradle.kts            # Configuração de repositórios
├── gradle.properties              # Parâmetros JVM e AndroidX
├── gradlew & gradlew.bat          # Scripts de execução do Gradle Wrapper
└── README.md                      # Esta documentação
```

---

## 🛠️ Como Abrir e Compilar no Android Studio

### Método 1: Pela Interface do Android Studio
1. Abra o **Android Studio**.
2. Clique em **File > Open** (ou "Open" na tela inicial).
3. Selecione a pasta `android/` deste projeto.
4. Aguarde a sincronização inicial do Gradle (o Gradle baixará as dependências automaticamente).
5. No menu superior, clique em **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
6. Ao terminar, uma notificação aparecerá no canto inferior direito com o link **"locate"** para abrir a pasta com o arquivo `app-debug.apk`.

### Método 2: Pela Linha de Comando (Terminal)

No terminal, navegue até a pasta `android/`:

```bash
cd android
```

#### No Linux / macOS:
```bash
chmod +x gradlew
./gradlew assembleDebug
```

#### No Windows:
```cmd
gradlew.bat assembleDebug
```

O arquivo APK gerado estará localizado em:
`android/app/build/outputs/apk/debug/app-debug.apk`

---

## 📲 Como Instalar o APK no Celular

1. **Via Cabo USB (ADB)**:
   ```bash
   adb install app/build/outputs/apk/debug/app-debug.apk
   ```

2. **Direto no Celular**:
   - Envie o arquivo `app-debug.apk` para o celular (via WhatsApp, Google Drive, cabo ou e-mail).
   - No celular, abra o arquivo e permita "Instalar fontes desconhecidas".
   - Conclua a instalação.

---

## 🌐 Suporte Online e Offline

- **Online**: Sincroniza em tempo real com o banco de dados Firebase Firestore. Qualquer vistoria gerada ou alterada é salva imediatamente na nuvem.
- **Offline**: O aplicativo armazena automaticamente os dados e cache das páginas. O inspetor pode caminhar por blocos sem sinal de internet e continuar preenchendo as planilhas; assim que o sinal retornar, a sincronização é restabelecida automaticamente.
