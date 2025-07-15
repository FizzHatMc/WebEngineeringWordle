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

Multiplayer Wordle bringt das klassische Wortratespiel in eine dynamische Mehrspielerumgebung. Es gibt die möglichkeit das Tägliche Wort zu erraten was alle 24 Stunden sich ändert. Oder beim starten des spiels ein einzigartiges Wort zu haben. Beim erraten des Wortes werden die buchstaben in folgenden Farben angezeigt:

* 🟩 **Grün:** Der Buchstabe ist korrekt und an der richtigen Position.
* 🟨 **Gelb:** Der Buchstabe ist korrekt, aber an der falschen Position.
* ⬜ **Grau:** Der Buchstabe ist nicht im Wort enthalten.

Es gibt auch die Möglichkeit mit Freunden zu spielen. Miteinander oder Gegeneinander!
In dem "1v1" Modus spielt man gegen einen anderen Nutzer spielt. Der der als erstes das wort errät hat gewonnen.
Oder man spielt im "Team" modus miteinander um das wort zu erraten.

---

## 🛠️ Aufbau

Dieses Projekt ist in mehreren Schlüsselkomponenten organisiert:

* **Frontend:** Entwickelt mit vanilla HTML/CSS und Javascript für eine interaktive Benutzeroberfläche.
* **Backend:** Realisiert mit Java Spring boot (Kontroll Server) und NodeJS (Lobby Server) zur Verwaltung der Spiellogik, der Benutzerzustände und der Spieler logik.
* **WebSockets:** Verwendet SocketIO für die Echtzeitkommunikation zwischen Server und Clients, um ein nahtloses Multiplayer-Erlebnis zu gewährleisten.
* **"Datenbank"** Wir nutzen eine Simple aber Funktionale Text datei für die verfügbaren Wörter.

---

## 💡 Funktionsweise

Das Spiel funktioniert wie folgt:

1.  **Spielerbeitritt:** Benutzer können über eine Spiel-ID einem Raum beitreten oder einen neuen erstellen. Andernseits kann auch eine Einzelspieler Lobby gestartet werden
2.  **Wortauswahl:** Der Server wählt ein zufälliges fünfstelliges Wort aus den vorgegebenen Wörter.
3.  **Raten:** Spieler geben ihre Vermutungen ein. Jede Vermutung wird an den Server gesendet, der sie validiert und das Ergebnis (grün/gelb/grau) an alle Spieler im Raum zurücksendet.
4.  **Echtzeit-Updates:** Dank SocketIO sehen alle Spieler in Echtzeit, welche Buchstaben die anderen Spieler bereits geraten haben und wie nahe sie der Lösung sind (ohne die genauen Wörter der anderen preiszugeben, es sei denn, sie wurden korrekt geraten).
5.  **Rundenende:** Die Runde endet, wenn ein Spieler das Wort errät oder alle Spieler ihre maximalen Versuche ausgeschöpft haben. Der Gewinner wird bekannt gegeben.

---

## 🚀 Schnelleinstieg

Um Multiplayer Wordle lokal einzurichten und zu starten:

1.  **Jar runterladen:**
    ```bash
    https://github.com/FizzHatMc/WebEngineeringWordle/releases
    ```
2.  **Ausführen mit Java 23 installiert:**
    ```bash
    java -jar /pfad/zu/date/wordle.jar
    ```
3.  Öffne deinen Browser und navigiere zu `http://localhost:8080`.


