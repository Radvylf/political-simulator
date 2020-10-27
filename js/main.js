window.onload = function() {
    var canvas = document.getElementById("display");
    var ctx = canvas.getContext("2d");
    
    var money_one = document.getElementById("money_one");
    var money_two = document.getElementById("money_two");
    var moves_one = document.getElementById("moves_one");
    var moves_two = document.getElementById("moves_two");
    var bot_one = document.getElementById("bot_one");
    var bot_two = document.getElementById("bot_two");
    var start = document.getElementById("start");
    var next = document.getElementById("next");
    var reset = document.getElementById("reset");
    var tps = document.getElementById("tps");
    var container = document.getElementById("dialog_container");
    var dialog_text = document.getElementById("dialog_text");
    var close = document.getElementById("dialog_close");
    
    var rate = 4;
    var interval = -1;
    
    var dialog = (text, code) => {
        container.style.display = "flex";
        dialog_text.textContent = text;
        dialog_text.className = code ? "code" : "";
    };
    
    send_dialog(dialog);
    
    var draw_board = () => {
        var [people, regions, bribes, money, moves] = read_board();
        
        ctx.fillStyle = "#000000";

        ctx.fillRect(0, 0, 410, 410);
        
        for (let x = 0; x < 16; x++) {
            for (let y = 0; y < 16; y++) {
                ctx.fillStyle = "hsl(" + (people[x][y] < 0 ? 0 : 240) + ", 80%, " + Math.max(100 - Math.sqrt(Math.abs(people[x][y])) * 20, 40) + "%)";
                ctx.fillRect((x * 24) + x + (x / 4 | 0) + 4, (y * 24) + y + (y / 4 | 0) + 4, 24, 24);
            }
        }
        
        ctx.fillStyle = "#000000";
        
        ctx.fillRect(420, 0, 200, 200);
        
        var data = regions.map(r => {
            var region = [].concat.apply([], r.map(b => [
                ...people[b[0]].slice(b[1], b[1] + 4),
                ...people[b[0] + 1].slice(b[1], b[1] + 4),
                ...people[b[0] + 2].slice(b[1], b[1] + 4),
                ...people[b[0] + 3].slice(b[1], b[1] + 4)
            ]));
            
            return {
                blocks: r.map(b => [...b]),
                number_neutral: region.reduce((a, p) => a + (p == 0), 0),
                number_blue: region.reduce((a, p) => a + (p > 0), 0),
                number_red: region.reduce((a, p) => a + (p < 0), 0),
                absolute_average: region.reduce((a, p) => a + Math.abs(p), 0) / region.length
            };
        });
        
        data.forEach((r, i) => {
            r.blocks.forEach(b => {
                ctx.fillStyle = r.number_neutral >= r.blocks.length * 8 || r.number_red == r.number_blue ? "hsl(0, 0%, 100%)" : "hsl(" + (r.number_red > r.number_blue ? 0 : 240) + ", 80%, 80%)";
                ctx.fillRect(b[0] * 12 + 424, b[1] * 12 + 4, 48, 48);
            });
            
            r.blocks.forEach(b => {
                ctx.strokeStyle = "#000000";
                ctx.lineWidth = 4;
                
                if (b[0] < 12 && !r.blocks.some(s => s[0] == b[0] + 4 && s[1] == b[1])) {
                    ctx.beginPath();
                    ctx.moveTo(b[0] * 12 + 472, b[1] * 12 + 4);
                    ctx.lineTo(b[0] * 12 + 472, b[1] * 12 + 52);
                    ctx.stroke();
                }
                
                if (b[1] < 12 && !r.blocks.some(s => s[0] == b[0] && s[1] == b[1] + 4)) {
                    ctx.beginPath();
                    ctx.moveTo(b[0] * 12 + 424, b[1] * 12 + 52);
                    ctx.lineTo(b[0] * 12 + 472, b[1] * 12 + 52);
                    ctx.stroke();
                }
            });
        });
        
        money_one.textContent = money[0].toFixed(2);
        money_two.textContent = money[1].toFixed(2);
        
        moves_one.textContent = moves[0].join("\n");
        moves_two.textContent = moves[1].join("\n");
    };
    
    var draw_turn = () => {
        run_turn();
        draw_board();
        
        if (state == States.DONE) {
            clearInterval(interval);
            interval = -1;
            
            start.textContent = "Start";
        }
    };
    
    draw_board();
    
    start.onclick = function() {
        if (state != States.RUNNING) {
            run_game(bot_one.value, bot_two.value);
            draw_board();
        }
        
        if (interval == -1) {
            interval = setInterval(draw_turn, 1000 / rate);

            start.textContent = "Stop";
        } else {
            clearInterval(interval);
            interval = -1;
            
            start.textContent = "Start";
        }
    };
    
    next.onclick = function() {
        if (state != States.RUNNING) {
            run_game(bot_one.value, bot_two.value);
            draw_board();
        }
        
        run_turn();
        draw_board();
    };
    
    reset.onclick = function() {
        run_game(bot_one.value, bot_two.value);
        draw_board();
        
        clearInterval(interval);
        interval = -1;
        
        start.textContent = "Start";
    };
    
    tps.onclick = function() {
        rate = [40, 20, 10, 4, 2, 1, 1 / 2, 1 / 4][[20, 10, 4, 2, 1, 1 / 2, 1 / 4, 40].indexOf(rate)];
        
        if (interval != -1) {
            clearInterval(interval);
            interval = setInterval(draw_turn, 1000 / rate);
        }
        
        tps.textContent = rate >= 1 ? rate + " t/s" : (1 / rate) + " s/t";
    };
    
    close.onclick = function() {
        container.style.display = "";
    };
};
