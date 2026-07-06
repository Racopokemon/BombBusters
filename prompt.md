Moin. Ich möchte mit meinen Freunden online ein Brettspiel ("Bomb Busters") spielen, und weil sich jeder eigene Sichtbarkeiten für einzelne Steine umschalten kann, klappen existierende Tools dafür nicht so gut. Das Ganze sollte ein simpler Prototyp sein, muss nicht fancy sein oder Tests haben etc. Meine Freunde sind im selben Netzwerk und tippen einfach meine IP mit Port in ihren Browser. Du wirst dafür eine kleine Webapp mit einer einzigen Seite machen, und vmtl mit Websockets oder etwas basierend darauf arbeiten. 

- Es gibt nur eine Session, jeder, der die Seite besucht, joint dieser. 
- Es gibt ein Spielfeld, was die gesamte Seite ausfüllt. Auf dem Spielfeld sind Spielobjekte (Essentiell Boxen mit einer Farbe, Abmessung und Text. Später vielleicht auch rechteckige JPGs mit einer Abmessung). Das Spielfeld wird zwischen Spielern synchronisiert, alle sehen das gleiche. 
- Spieler können Objekte mit der Maus herumziehen, das sollte synchronisiert sein (zmnd beim Loslassen sollte das mit allen synchronisiert werden.)
- Spieler können Objekte doppelklicken, das schaltet um zwischen "aufgedeckt" und "verdeckt". Verdeckt heißt essentiell, dass der Text einfach ausgeblendet wird :D
- Manche verdeckte Objekte haben verdeckt eine andere Rechteckfarbe als aufgedeckt
- Spieler können Objekte rechtsklicken, das schaltet die private Sichtbarkeit um: Ist das Objekt für alle aufgedeckt, macht das keinen Unterschied. Ist das Objekt für alle verdeckt, wird es nur für diesen Spieler aufgedeckt. Um darauf hinzuweisen, gib dem Objekt einen hervorgehobenen Rand. Das ist nur client-sided. 
- Jeder Spieler wird beim Betreten nach seinem Namen gefragt. 
- Jeder Spieler sieht die aktuelle Mausposition jedes anderen Spielers. Der Spieler hat eine zufällige Farbe (server-sided) und eine kleine Beschriftung mit dem Namen, der beim Betreten abgefragt wurde. 

Das wars. Ich habe noch eine pieces.md angelegt mit einer Beschreibung den fürs Spiel benötigten Spielsteinen, lies dir die auch noch einmal durch. Für manche Level braucht man noch andere Steine (und ich will sicher mal Schriftgrößen und Farben ändern etc), vielleicht kannst du also eine pieces.js Datei anlegen, in der übersichtlich die Spielsteine erstellt werden, sodass man hier unkompliziert weitere Steine hinzufügen kann. 

Geil, funktioniert gut! Ich hab ein paar Änderungen: 
- Aufdecken und Verdecken sollte mit Rechtsklick statt mit Doppelklick passieren
- Das Bewegen von Tiles sollte auch schon synchronisiert werden, wenn das Tile noch bewegt wird, nicht erst am Ende
- Ich hätte gerne oben rechts ein kleines Menü mit Funktionien: 1: Shuffle wires - shuffelt alle normalen Kabel (nicht die mit Kommazahlen). Die Positionen bleiben alle, aber danach liegt dort vmtl ein anderes Kabel. Und 2: Cover wires - verdeckt alle normalen Kabel.  

- Spielernamen durch unsere echten Namen ersetzen
- 1-12 brauchen Hintergrund
- Verdeckt und nicht haben vertauschte Farben - wo ist das schief gelaufen?
- Ein bewegtes Element muss danach (synchronisiert) erst mal über allen anderen sein, sonst kann man daraus erkennen, wo hohe und tiefe Zahlen liegen