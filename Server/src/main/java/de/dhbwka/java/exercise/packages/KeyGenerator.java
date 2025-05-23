package de.dhbwka.java.exercise.packages;

import java.util.UUID;

public class KeyGenerator {
    private static String alphabet="0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    public static String generateKey(){
        StringBuilder key= new StringBuilder();
        for (int i = 0; i < 5; i++) {//generiert einen 5-Stelligen Key
            key.append(alphabet.charAt((int) (Math.random() * alphabet.length())));
        }
        return key.toString();
    }
}
