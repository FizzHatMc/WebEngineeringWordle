package de.dhbwka.java.exercise.packages;


import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.servlet.view.RedirectView;

import java.net.http.HttpClient;

@Controller
public class WebController {
    @GetMapping("/test")
    public String greeting(@RequestParam(name="name", required=false, defaultValue="World") String name, Model model) {
        model.addAttribute("name", name);
        model.addAttribute("wort","wort");
        return "test";
    }

    @GetMapping("/")
    public String home(){
        return "home";
    }
    @GetMapping("/game")
    public String game(){
        return "game";
    }

    @GetMapping("/try/{word}")
    @ResponseBody
    public ResponseEntity<int[]> tryWord(@PathVariable("word") String word){
        if(word.length()==5) {
            int[] colors = new int[5];
            for (int i = 0; i < 5; i++) {
                if ("Milch".toLowerCase().contains(String.valueOf(word.toLowerCase().charAt(i)))) {
                    if ("Milch".toLowerCase().charAt(i) == word.toLowerCase().charAt(i)) {
                        colors[i] = 3;
                    } else {
                        colors[i] = 2;
                    }
                } else {
                    colors[i] = 1;
                }
            }
            return ResponseEntity.ok(colors);
        }else{
            return ResponseEntity.ok(new int[]{0, 0, 0, 0, 0});
        }
    }
}
