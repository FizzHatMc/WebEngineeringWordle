package de.dhbwka.java.exercise.packages;

public class GameLobby {
    private final String id;
    private final int port;
    private String[] players=new String[6];//maximal 6 Spieler
    private String currentWord;

    public GameLobby(String id, int port){
        this.id = id;
        this.port = port;
    }

    public boolean joinRequest(String playerName){
        for (int i = 0; i < players.length; i++) {
            if(players[i].isEmpty()){
                players[i]=playerName;
                return true;
            }
        }
        return false;
    }

    public boolean leaveRequest(String playerName){
        for (int i = 0; i < players.length; i++) {
            if(players[i].equals(playerName)){
                players[i]="";
                return true;
            }
        }
        return false;
    }
}
