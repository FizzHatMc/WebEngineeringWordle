package de.dhbwka.java.exercise.packages;


import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.Comparator;
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

    private static final Path TEMP_DIR = Paths.get("/tmp/wordle-resources");

    @PostConstruct
    public void extractResources() {
        try {
            // 1. Clean up existing directory if it exists
            if (Files.exists(TEMP_DIR)) {
                cleanDirectory(TEMP_DIR);
            }

            // 2. Create fresh directory structure
            Files.createDirectories(TEMP_DIR);

            // 3. Extract resources
            extractResourceFolder("templates");
            extractResourceFolder("static");

            System.out.println("Successfully extracted resources to: " + TEMP_DIR);
        } catch (Exception e) {
            throw new RuntimeException("Failed to extract resources", e);
        }
    }

    private void cleanDirectory(Path dir) throws IOException {
        try {
            Files.walk(dir)
                    .sorted(Comparator.reverseOrder())
                    .forEach(this::deleteSilently);
        } catch (IOException e) {
            System.err.println("Warning: Partial cleanup of " + dir + " - " + e.getMessage());
        }
    }

    private void deleteSilently(Path path) {
        try {
            Files.delete(path);
        } catch (IOException e) {
            System.err.println("Warning: Could not delete " + path + " - " + e.getMessage());
        }
    }

    private void extractResourceFolder(String folderName) throws IOException {
        Path targetDir = TEMP_DIR.resolve(folderName);
        Files.createDirectories(targetDir);

        Resource[] resources = new PathMatchingResourcePatternResolver()
                .getResources("classpath:/" + folderName + "/**");

        for (Resource resource : resources) {
            if (resource.isReadable()) {
                String filename = resource.getFilename();
                if (filename != null && !filename.isEmpty()) {
                    Path dest = targetDir.resolve(filename);
                    try (InputStream in = resource.getInputStream()) {
                        Files.copy(in, dest, StandardCopyOption.REPLACE_EXISTING);
                    }
                }
            }
        }
    }

    @GetMapping("/create-game/{modi}")
    public ResponseEntity<String> create_game(@PathVariable("modi") String modi) throws IOException {
        String gameId = generateID();
        String lobbytype = "1v1";
        if (modi.equals("team")) {
            lobbytype = "team";
        } else if (modi.equals("solo")) {
            lobbytype = "solo";
        }
        int subServerPort = 4001 + subservers.size();

        String nodeCommand = null; // Initialize to null

        try {
            // Determine Node.js command based on OS
            Process whichProcess;
            if (System.getProperty("os.name").toLowerCase().contains("win")) {
                log.info("Operating System: Windows");
                whichProcess = Runtime.getRuntime().exec("where node");
            } else {
                log.info("Operating System: Linux/Mac");
                whichProcess = Runtime.getRuntime().exec("which node");
            }

            whichProcess.waitFor(); // Wait for the 'which' or 'where' command to complete
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(whichProcess.getInputStream()))) {
                nodeCommand = reader.readLine(); // Read the path to node
            }

            if (nodeCommand == null || nodeCommand.isEmpty()) {
                throw new RuntimeException("Node.js not found in PATH. Please ensure Node.js is installed and accessible.");
            }

            // --- START: Corrected logic for accessing NewSubServer.js from JAR ---
            // 1. Get the resource from the classpath (this works whether in IDE or JAR)
            ClassPathResource resource = new ClassPathResource("NewSubServer.js");
            InputStream inputStream = resource.getInputStream();

            // 2. Create a temporary file on the file system
            Path tempFile = Files.createTempFile("NewSubServer", ".js");
            File scriptFile = tempFile.toFile();
            // Ensure the temporary file is deleted when the JVM exits
            scriptFile.deleteOnExit();

            // 3. Copy the content from the JAR's input stream to the temporary file
            Files.copy(inputStream, tempFile, StandardCopyOption.REPLACE_EXISTING);
            inputStream.close(); // Close the stream from the JAR

            // 4. Get the absolute path of the temporary file for Node.js to execute
            String jsFilePath = scriptFile.getAbsolutePath();
            log.info("Subserver: Extracted Node.js script to temporary path: {}", jsFilePath);
            // --- END: Corrected logic ---

            String[] command = {
                    nodeCommand,
                    jsFilePath, // Use the path to the temporary file
                    gameId,
                    String.valueOf(subServerPort),
                    lobbytype
            };

            ProcessBuilder pb = new ProcessBuilder(command);
            pb.redirectErrorStream(true); // Redirects stderr to stdout for easier logging

            log.info("Starting subserver with command: {}", String.join(" ", command));
            pb.environment().put("RESOURCES_PATH", "/tmp/wordle-resources");
            //pb.directory(new File("/path/to/your/resources")); // Only needed in development
            Process process = pb.start();

            // Log output from the subserver in a separate thread
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
            }, "Subserver-Output-Logger-" + gameId).start(); // Give thread a name for easier debugging

            // Add shutdown hook to ensure subserver is killed when main app exits
            Runtime.getRuntime().addShutdownHook(new Thread(() -> {
                if (process.isAlive()) {
                    process.destroy();
                    log.info("Subserver process for game {} terminated", gameId);
                }
            }, "Subserver-Shutdown-Hook-" + gameId));

            log.info("Subserver started successfully on port {}", subServerPort);

        } catch (Exception e) {
            log.error("Failed to start subserver for game {}: {}", gameId, e.getMessage(), e);
            throw new RuntimeException("Could not start subserver for game " + gameId, e);
        }

        subservers.put(gameId, new GameLobby(gameId, subServerPort));
        subservers.get(gameId).joinRequest(); // Assuming this method exists and is safe to call
        // log.info("server {} started on port http://localhost:{}/game",gameId,subServerPort);

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
        if (word.length() == 5) {
            int[] colors = new int[5];
            int[] rest;
            StringBuilder restWort = new StringBuilder();
            StringBuilder restCorrect = new StringBuilder();
            ArrayList<Integer> restIndexList = new ArrayList<>();
            for (int i = 0; i < 5; i++) {
                String currentLetter = String.valueOf(word.toLowerCase().charAt(i));
                if (correctWord.toLowerCase().contains(currentLetter)) {
                    if (correctWord.toLowerCase().charAt(i) == word.toLowerCase().charAt(i)) {
                        colors[i] = 3;
                    } else {
                        restIndexList.add(i);
                        restWort.append(currentLetter);
                        restCorrect.append(correctWord.toLowerCase().charAt(i));
                    }
                } else {
                    colors[i] = 1;
                }
            }
            rest = restIndexList.stream().mapToInt(i -> i).toArray();
            for (int i = 0; i < restCorrect.length(); i++) {
                char curr = word.toLowerCase().charAt(i);
                if (instancesOfChar(restWort.substring(0, i+1), curr) > instancesOfChar(restCorrect.toString(), curr)) {
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
