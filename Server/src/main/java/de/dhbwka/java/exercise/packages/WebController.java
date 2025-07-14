package de.dhbwka.java.exercise.packages;


import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;

@Controller
public class WebController {
    private static final Logger log = LoggerFactory.getLogger(WebController.class);
    String dailyWord = WordHandler.getRandomWord();
    HashMap<String, GameLobby> subservers = new HashMap<>();

    @GetMapping("/reset/new_word")
    public ResponseEntity<String> reset() {
        dailyWord = WordHandler.getRandomWord();
        return ResponseEntity.ok(dailyWord);
    }

    @GetMapping("/getNewWord")
    public ResponseEntity<String> randomWord() {
        return ResponseEntity.ok("{\"word\":" + "\"" + WordHandler.getRandomWord() + "\"" + "}");
    }

    @GetMapping("/reset")
    public String resetSite() {
        dailyWord = WordHandler.getRandomWord();
        return "resetWordAdminOnly";
    }

    @GetMapping("/impressum")
    public String impressum() {
        return "impressum";
    }

    @GetMapping("/")
    public String home() {
        return "home";
    }

    @GetMapping("/lobby")
    public String lobby() {
        return "lobby";
    }

    @GetMapping("/game")
    public String game() {
        return "game_";
    }

    @GetMapping("/create-game/{modi}")
    public ResponseEntity<String> create_game(@PathVariable("modi") String modi) throws IOException {
        String gameId = generateID();
        String lobbytype = "1v1";
        if (modi.equals("team")) {
            lobbytype = "team";
        }else if(modi.equals("solo")) {
            lobbytype = "solo";
        }
        int subServerPort = 4001 + subservers.size();
        // Start the sub-server as a separate Node.js process

        try {

            String nodeCommand;
            if (System.getProperty("os.name").toLowerCase().contains("win")) {
                // Windows
                log.info("Windows");
                Process whichProcess = Runtime.getRuntime().exec("where node");
                whichProcess.waitFor();
                try (BufferedReader reader = new BufferedReader(
                        new InputStreamReader(whichProcess.getInputStream()))) {
                    nodeCommand = reader.readLine();
                }
            } else {
                // Linux/Mac
                Process whichProcess = Runtime.getRuntime().exec("which node");
                whichProcess.waitFor();
                try (BufferedReader reader = new BufferedReader(
                        new InputStreamReader(whichProcess.getInputStream()))) {
                    nodeCommand = reader.readLine();
                }
            }

            if (nodeCommand == null || nodeCommand.isEmpty()) {
                throw new RuntimeException("Node.js not found in PATH");
            }

            String jsFilePath = new File("Server/src/main/resources/templates/NewSubServer.js").getAbsolutePath();
            String[] command = {
                    nodeCommand,
                    jsFilePath,
                    gameId,
                    String.valueOf(subServerPort),
                    lobbytype
            };


            ProcessBuilder pb = new ProcessBuilder(command);
            pb.directory(new File("/"));
            pb.redirectErrorStream(true);

            log.info("Starting subserver with command: {}", String.join(" ", command));

            Process process = pb.start();

            // Step 4: Log output from the subserver
            new Thread(() -> {
                try (BufferedReader reader = new BufferedReader(
                        new InputStreamReader(process.getInputStream()))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        log.info("Subserver: {}", line);
                    }
                } catch (IOException e) {
                    log.error("Error reading subserver output", e);
                }
            }).start();

            // Step 5: Add shutdown hook to ensure subserver is killed when main app exits
            Runtime.getRuntime().addShutdownHook(new Thread(() -> {
                if (process.isAlive()) {
                    process.destroy();
                    log.info("Subserver process terminated");
                }
            }));

            // Step 6: Verify the subserver started successfully
            // Wait briefly to detect immediate failures


            log.info("Subserver started successfully on port {}", subServerPort);

        } catch (Exception e) {
            log.error("Failed to start subserver", e);
            throw new RuntimeException("Could not start subserver", e);
        }

        subservers.put(gameId, new GameLobby(gameId, subServerPort));
        subservers.get(gameId).joinRequest();
        //log.info("server {} started on port http://localhost:{}/game",gameId,subServerPort);

        return ResponseEntity.ok(("{\"gameId\" : \"" + gameId + "\" , \"port\" : \"" + subServerPort + "\"}"));
    }

    private String generateID() {
        return KeyGenerator.generateKey();
    }

    @GetMapping("/join-game")
    public ResponseEntity<String> join_game(@RequestParam(name = "id", required = true) String id) {
        String status = "";
        String message = "";
        if (subservers.get(id) != null) {
            if (subservers.get(id).joinRequest()) {
                log.info("" + subservers.get(id).port);
                return ResponseEntity.ok(("{\"status\" : \"joined\" , \"message\" : \"" + subservers.get(id).port + "\"}"));

            }
            return ResponseEntity.status(400).body("{ status: 'error', message: 'Game is full' }");
        }
        return ResponseEntity.status(404).body("{ status: 'error', message: 'Game not found' }");
    }

    @GetMapping("/spielbeitritt")
    public String spielbeitritt(/*@RequestParam(name="name",required=true) String name*/) {
        return "join-game";
    }

    @GetMapping("/shutdown/{id}")
    public void shutdown(@PathVariable("id") String id) {
        subservers.remove(id);

    }

    @GetMapping("/login")
    public String login() {
        return "login";
    }

    @CrossOrigin(origins = "*")
    @GetMapping("/try/{word}")
    @ResponseBody
    public ResponseEntity<int[]> tryWord(@PathVariable("word") String word) {
        return checkWord(word, dailyWord);
    }

    @CrossOrigin(origins = "*")
    @GetMapping("/try/{word}/{correctWord}")
    @ResponseBody
    public ResponseEntity<int[]> tryWord(@PathVariable("word") String word, @PathVariable("correctWord") String correctWord) {
        if (correctWord.equals("try-daily")) {
            return checkWord(word, dailyWord);
        }
        return checkWord(word, correctWord);
    }

    private ResponseEntity<int[]> checkWord(String word, String correctWord) {
        // wenn ein wort einen buchstaben nur x mal enthält , soll der buschtabe auch nur x mal so eingefärbt werden,
        // als wäre er im wort enthalten
        if (word.length() == 5) {
            int[] colors = new int[5];
            int[] rest;
            String restWort = "";
            String restCorrect = "";
            ArrayList<Integer> restIndexList = new ArrayList<>();
            for (int i = 0; i < 5; i++) {
                String currentLetter = String.valueOf(word.toLowerCase().charAt(i));
                if (correctWord.toLowerCase().contains(currentLetter)) {
                    if (correctWord.toLowerCase().charAt(i) == word.toLowerCase().charAt(i)) {
                        colors[i] = 3;
                    } else {
                        restIndexList.add(i);
                        restWort += currentLetter;
                        restCorrect += String.valueOf(correctWord.toLowerCase().charAt(i));
                    }
                } else {
                    colors[i] = 1;
                }
            }
            rest = restIndexList.stream().mapToInt(i -> i).toArray();
            for (int i = 0; i < restCorrect.length(); i++) {
                char curr = word.toLowerCase().charAt(i);
                if (instancesOfChar(restWort.substring(0, i+1), curr) > instancesOfChar(restCorrect, curr)) {// hier ist die Änderung
                    colors[rest[i]] = 1;
                } else {
                    colors[rest[i]] = 2;
                }
            }
            return ResponseEntity.ok(colors);
        } else {
            return ResponseEntity.ok(new int[]{0, 0, 0, 0, 0});
        }
    }


    private int instancesOfChar(String wort, char character) {
        int x = 0;
        for (int i = 0; i < wort.length(); i++) {
            if (wort.charAt(i) == character) x++;
        }
        return x;
    }
}
