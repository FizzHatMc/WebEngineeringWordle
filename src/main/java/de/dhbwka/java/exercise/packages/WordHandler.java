package de.dhbwka.java.exercise.packages;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.util.ArrayList;

public class WordHandler {
    public static String getRandomWord(){
        ArrayList<String> zeilen = new ArrayList<>();
        int anzahlZeilen=0;
        try(BufferedReader reader = new BufferedReader(new FileReader(new File("words2.txt")))){
            while(reader.ready()){
                zeilen.add(reader.readLine());
                anzahlZeilen++;
            }
        }catch (IOException e){
            System.err.println("Krise");
        }
        if(anzahlZeilen==0){
            System.out.println("Null-Datei");
            return "error";
        }
        String[] inhalt = new String[anzahlZeilen];
        int zähler=0;
        for (String zeile : zeilen){
            inhalt[zähler]= zeile;
            zähler++;
        }
        String newWord = inhalt[(int) (Math.random()*inhalt.length)];
        System.out.println("New Word : "+newWord);
        return newWord;
    }

}
