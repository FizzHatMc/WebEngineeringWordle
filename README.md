### WebEngineeringWordle


>Immer commiten und Pushed

## Aufbau
HTML Side aufgabe:

- Anzeigen der 5 Eingabe Felder
- Anzeigen der Versuchen mit Farben
- Farben Logik
- Menü und Visuelle Aufwertung
- Anzeigen des gesuchten Wortes am Ende einer Runde (muss vom Server angefragt werden)
- Anzeigen von Sieg oder Niederlage
- Seite für "Reset" vom Wort

Server Side aufgabe:

- Zufälliges Wort auswählen (1x Täglich + Reset knopf) aus Liste
- Annahme des Eingebenen Wortes von der HTML Seite
- Vergleichen und buchstaben "einranken" (1-3; (0 = Default), 1 = Nicht dabei, 2 = Dabei aber falsche Position, 3 = Dabei und richtige Position)
- Array an HTML zurück schicken um die Farben logik zu verarbeiten
- Mapping von verschiedenen Adressen / Links
- Authentifizierung von Usern.
- (Kommunikation mit NodeJS-Server für Multiplayer Sessions)
