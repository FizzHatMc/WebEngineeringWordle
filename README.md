# Multiplayer Wordle

---

Willkommen bei Multiplayer Wordle! Dies ist eine unterhaltsame Echtzeit-Adaption des beliebten Worträtselspiels, das für dich und deine Freunde entwickelt wurde, um es gemeinsam zu genießen. Fordert euch gegenseitig heraus, das geheime Wort innerhalb einer begrenzten Anzahl von Versuchen zu erraten, mit Live-Updates über den Fortschritt jedes Spielers.

---

## Inhaltsverzeichnis
* [🎮 Gameplay](#gameplay)
* [🛠️ Aufbau](#aufbau)
* [💡 Funktionsweise](#funktionsweise)
* [🚀 Schnelleinstieg](#schnelleinstieg)
* [🤝 Mitwirken](#mitwirken)
* [📜 Lizenz](#lizenz)

---

## 🎮 Gameplay

Multiplayer Wordle bringt das klassische Wortratespiel in eine dynamische Mehrspielerumgebung. Jede Runde wird ein geheimes fünfstelliges Wort ausgewählt. Die Spieler erraten abwechselnd das Wort und erhalten sofortiges Feedback zu ihren Buchstaben:

* 🟩 **Grün:** Der Buchstabe ist korrekt und an der richtigen Position.
* 🟨 **Gelb:** Der Buchstabe ist korrekt, aber an der falschen Position.
* ⬜ **Grau:** Der Buchstabe ist nicht im Wort enthalten.

Das Spiel verfolgt den Fortschritt jedes Spielers individuell, und wer das Wort zuerst errät, gewinnt die Runde!

---

## 🛠️ Aufbau

Dieses Projekt ist in mehreren Schlüsselkomponenten organisiert:

* **Frontend:** Entwickelt mit [Dein Frontend-Framework, z.B. React, Vue, Angular] für eine interaktive Benutzeroberfläche.
* **Backend:** Realisiert mit [Dein Backend-Framework/Sprache, z.B. Node.js mit Express, Python mit Flask/Django] zur Verwaltung der Spiellogik, der Benutzerzustände und der Kommunikation.
* **WebSockets:** Verwendet [Deine WebSocket-Bibliothek, z.B. Socket.IO] für die Echtzeitkommunikation zwischen Server und Clients, um ein nahtloses Multiplayer-Erlebnis zu gewährleisten.
* **Datenbank (Optional):** [Dein Datenbanksystem, z.B. MongoDB, PostgreSQL] für persistente Daten wie Spielerstatistiken oder Highscores.

---

## 💡 Funktionsweise

Das Spiel funktioniert wie folgt:

1.  **Spielerbeitritt:** Benutzer können über einen eindeutigen Link oder eine Spiel-ID einem Raum beitreten oder einen neuen erstellen.
2.  **Wortauswahl:** Der Server wählt ein zufälliges fünfstelliges Wort aus seiner Datenbank.
3.  **Raten:** Spieler geben ihre Vermutungen ein. Jede Vermutung wird an den Server gesendet, der sie validiert und das Ergebnis (grün/gelb/grau) an alle Spieler im Raum zurücksendet.
4.  **Echtzeit-Updates:** Dank **WebSockets** sehen alle Spieler in Echtzeit, welche Buchstaben die anderen Spieler bereits geraten haben und wie nahe sie der Lösung sind (ohne die genauen Wörter der anderen preiszugeben, es sei denn, sie wurden korrekt geraten).
5.  **Rundenende:** Die Runde endet, wenn ein Spieler das Wort errät oder alle Spieler ihre maximalen Versuche ausgeschöpft haben. Der Gewinner wird bekannt gegeben, und eine neue Runde kann gestartet werden.

---

## 🚀 Schnelleinstieg

Um Multiplayer Wordle lokal einzurichten und zu starten:

1.  **Repository klonen:**
    ```bash
    git clone [https://github.com/](https://github.com/)[DeinBenutzername]/[DeinRepoName].git
    cd [DeinRepoName]
    ```
2.  **Frontend installieren & starten:**
    ```bash
    cd frontend
    npm install # oder yarn install
    npm start # oder yarn start
    ```
3.  **Backend installieren & starten:**
    ```bash
    cd ../backend
    npm install # oder yarn install
    npm start # oder yarn start
    ```
4.  Öffne deinen Browser und navigiere zu `http://localhost:[DeinFrontendPort]` (Standard ist oft 3000).

---

## 🤝 Mitwirken

Wir freuen uns über **Beiträge**! Wenn du Bugs findest oder neue Funktionen vorschlagen möchtest, öffne bitte ein Issue oder sende einen Pull Request. Bitte beachte unsere [Contributing Guidelines](CONTRIBUTING.md) (falls vorhanden).

---

## 📜 Lizenz

Dieses Projekt steht unter der [Name der Lizenz, z.B. MIT License]. Siehe die Datei [LICENSE](LICENSE) für weitere Details.
