package de.dhbwka.java.exercise.packages;


import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.io.IOException;
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
        return ResponseEntity.ok(WordHandler.getRandomWord());
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

    @GetMapping("/create-game")
    public ResponseEntity<String> create_game() throws IOException {
        String gameId = generateID();
        String newWord = WordHandler.getRandomWord();
        int subServerPort = 4001 + subservers.size();
        // Start the sub-server as a separate Node.js process
        boolean isWindows = System.getProperty("os.name")
                .toLowerCase().startsWith("windows");
        Process process;
        if (isWindows) {
            String command = String.format("node %s" + " " + gameId + " " + subServerPort + " " + newWord, new File("Server/src/main/resources/templates/NewSubServer.js").getAbsolutePath());

            process = Runtime.getRuntime()
                    .exec(command);
            log.info("Startet Subserver with command {}",command);
        } else {
            process = Runtime.getRuntime()
                    .exec(String.format("/bin/sh -c ls %s", "homeDirectory"));
        }
        subservers.put(gameId, new GameLobby(gameId, subServerPort));
        subservers.get(gameId).joinRequest();
        log.info("server {} started on port http://localhost:{}/game",gameId,subServerPort);

        return ResponseEntity.ok(("{\"gameId\" : \""+gameId+"\" , \"port\" : \""+subServerPort+"\"}"));
    }

    private String generateID() {
        return KeyGenerator.generateKey();
    }

    @GetMapping("/join-game")
    public ResponseEntity<String> join_game(@RequestParam(name="id" ,required=true) String id) {
        String status="";
        String message="";
        if(subservers.get(id)!=null){
            if(subservers.get(id).joinRequest()){
                return ResponseEntity.ok(("{\"status\" : \"joined\" , \"message\" : \""+subservers.get(id).port+"\"}"));
            }
            return ResponseEntity.status(400).body("{ status: 'error', message: 'Game is full' }");
        }
        return ResponseEntity.status(404).body("{ status: 'error', message: 'Game not found' }");
    }

    @GetMapping("/login")
    public String login() {
        return "login";
    }

    @GetMapping("/try/{word}")
    @ResponseBody
    public ResponseEntity<int[]> tryWord(@PathVariable("word") String word) {
        return checkWord(word, dailyWord);
    }

    @GetMapping("/try/{word}/{correctWord}")
    @ResponseBody
    public ResponseEntity<int[]> tryWord(@PathVariable("word") String word, @PathVariable("correctWord") String correctWord) {
        if(correctWord.equals("try-daily")){
            return checkWord(word, dailyWord);
        }
        return checkWord(word, correctWord);
    }

    private ResponseEntity<int[]> checkWord(String word, String correctWord) {
        if (word.length() == 5) {
            int[] colors = new int[5];
            for (int i = 0; i < 5; i++) {
                if (correctWord.toLowerCase().contains(String.valueOf(word.toLowerCase().charAt(i)))) {
                    if (correctWord.toLowerCase().charAt(i) == word.toLowerCase().charAt(i)) {
                        colors[i] = 3;
                    } else {
                        colors[i] = 2;
                    }
                } else {
                    colors[i] = 1;
                }
            }
            return ResponseEntity.ok(colors);
        } else {
            return ResponseEntity.ok(new int[]{0, 0, 0, 0, 0});
        }
    }
}
