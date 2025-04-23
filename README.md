# circolari-bot-whatsapp
**Un Bot per WhatsApp, che invia aggiornamenti sulle nuove circolari** dei siti delle scuole italiane  
realizzati con il tema per WordPress “[Design Scuole Italia](https://docs.italia.it/italia/designers-italia/design-scuole-docs/it/v2022.1/risorse/tema-wordpress.html)”, direttamente nei **gruppi di classe**.

> **Non è garantito che il tuo account non venga sospeso utilizzando questa applicazione.  
> WhatsApp non consente bot o client di terze parti sulla loro piattaforma, dunque non è da considerarsi completamente sicuro.**

Visto che il bot **si basa sui feed RSS**, ho creato uno strumento interattivo con una CLI (Command Line Interface)  
per trovare il feed RSS delle circolari del sito (se esistente) e costruire il bot, velocizzando notevolmente il processo:


<p align="center">
  <img src="assets/fs.png" width="700" alt="Banner">
</p>

<p align="center">
  <a href="#come-usarlo">Come usarlo</a> •
  <a href="#crediti">Crediti</a> •
  <a href="#licenza">Licenza</a>
</p>


# Come usarlo
Sotto sono spiegate due modalità di deploy: Windows/Linux e Android (rootless):
1) Windows/Linux
     - **Installa** l'ultima versione di LTS di [**Node.js**](https://nodejs.org/) e [**Git**](https://git-scm.com/)
     - **Verifica** le **installazioni** dal terminale con i seguenti comandi
       
       ``` bash
       $ node -v
       $ git --version
       ```
     - Sempre dal terminale, **clona il repository**:
       
       ``` bash
       git clone https://github.com/root-xazitya/circolari-bot-whatsapp.git
       ```

     - **Naviga nella directory**  
     
       ``` bash
       cd circolari-bot-whatsapp
       ```
     - **Installa le** [**dipendenze necessarie**](#crediti)  
       
       ``` bash
       npm install
       ```
     - **Avvia il costruttore interattivo**
  
       ``` bash
       npm run build
       ```
     - **Avvia il client**
  
       ``` bash
       npm start
       ```
     - **Scannerizza il codice QR con WhatsApp**

          *Tocca i tre puntini* (⋮) *in alto a destra (Android) o Impostazioni (iOS)*
    
          *Seleziona Dispositivi collegati → Collega un dispositivo*
    
          *Scannerizza il codice QR mostrato nel terminale (il codice cambia ogni 20 secondi)*
       
      - **A questo punto il bot è collegato all'account WhatsApp.**
        
        
2) UserLAnd: un'applicazione per eseguire distribuzioni di Linux su Android 

     - Coming soon

# Crediti
Questo progetto utilizza le seguenti librerie open-source:

  - [axios](https://github.com/axios/axios)
  - [date-fns](https://github.com/date-fns/date-fns)
  - [qrcode-terminal](https://github.com/gtanner/qrcode-terminal)
  - [rss-parser](https://github.com/rss-parser/rss-parser)
  - [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js) – Libreria per interagire con WhatsApp Web tramite Node.js.

Queste librerie sono distribuite sotto diverse licenze open-source.  
Consulta i rispettivi repository per maggiori dettagli.

# Licenza

Questo progetto è distribuito sotto la [MIT License](LICENSE).

---
E-mail circolaribotwhatsapp@protonmail.com &nbsp;&middot;&nbsp;
GitHub [root-xazitya](https://github.com/root-xazitya) &nbsp;&nbsp;

