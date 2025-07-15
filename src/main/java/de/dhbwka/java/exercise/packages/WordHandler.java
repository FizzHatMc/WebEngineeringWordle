package de.dhbwka.java.exercise.packages;

import java.io.*;
import java.util.ArrayList;
import java.util.List;

public class WordHandler {
    public static String getRandomWord() {
        try {
            // Load file from classpath
            InputStream inputStream = Start.class.getClassLoader().getResourceAsStream("words2.txt");
            if (inputStream == null) {
                throw new FileNotFoundException("File not found in classpath: words2.txt");
            }

            List<String> lines = new ArrayList<>();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    lines.add(line);
                }
            }

            if (lines.isEmpty()) {
                System.out.println("Empty file");
                return "error";
            }

            String newWord = lines.get((int) (Math.random() * lines.size()));
            System.out.println("New Word: " + newWord);
            return newWord;
        } catch (IOException e) {
            System.err.println("Error reading file: " + e.getMessage());
            return "error";
        }
    }

}
