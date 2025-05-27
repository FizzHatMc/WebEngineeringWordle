package de.dhbwka.java.exercise.packages;

public class GameLobby {
    public final String id;
    public final int port;
    private int players=0;//maximal 6 Spieler
    private String currentWord;

    public GameLobby(String id, int port){
        this.id = id;
        this.port = port;
    }

    public boolean joinRequest(){
            if(players<6){
                players++;
                return true;
            }
        return false;
    }

    public boolean leaveRequest(){
        players--;
        return true;
    }
}
