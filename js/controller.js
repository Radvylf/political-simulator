var run_game, run_turn, read_board, send_dialog;

var States = {
    NOT_RUNNING: 0,
    RUNNING: 1,
    DONE: 2
};
    
var state = States.NOT_RUNNING;

var campaign = (from, to) => {
    if (!Array.isArray(from) || !Array.isArray(to) || from.length != 2 || to.length != 2)
        return ["invalid", "campaign", from.toString(), to.toString()];
    
    if (!Number.isInteger(from[0]) || !Number.isInteger(from[1]) || from[0] < 0 || from[0] > 16 || from[1] < 0 || from[1] > 16)
        return ["invalid", "campaign", "[" + from.join(", ") + "]", "[" + to.join(", ") + "]"];
    
    if (!Number.isInteger(to[0]) || !Number.isInteger(to[1]) || to[0] < 0 || to[0] > 16 || to[1] < 0 || to[1] > 16)
        return ["invalid", "campaign", "[" + from.join(", ") + "]", "[" + to.join(", ") + "]"];
    
    return ["campaign", from, to];
};
var poll = (from, to) => {
    if (!Array.isArray(from) || !Array.isArray(to) || from.length != 2 || to.length != 2)
        return ["invalid", "poll", from.toString(), to.toString()];
    
    if (!Number.isInteger(from[0]) || !Number.isInteger(from[1]) || from[0] < 0 || from[0] > 16 || from[1] < 0 || from[1] > 16)
        return ["invalid", "poll", "[" + from.join(", ") + "]", "[" + to.join(", ") + "]"];
    
    if (!Number.isInteger(to[0]) || !Number.isInteger(to[1]) || to[0] < 0 || to[0] > 16 || to[1] < 0 || to[1] > 16)
        return ["invalid", "poll", "[" + from.join(", ") + "]", "[" + to.join(", ") + "]"];
    
    return ["poll", from, to];
};
var bribe = (at) => {
    if (!Array.isArray(at) || at.length != 2)
        return ["invalid", "bribe", at.toString()];
    
    if (!Number.isInteger(at[0]) || !Number.isInteger(at[1]) || at[0] < 0 || at[0] >= 16 || at[1] < 0 || at[1] >= 16)
        return ["invalid", "bribe", "[" + at.join(", ") + "]", "[" + at.join(", ") + "]"];
    
    return ["bribe", at];
};
var merge = (from, to) => {
    if (!Array.isArray(from) || !Array.isArray(to) || from.length != 2 || to.length != 2)
        return ["invalid", "merge", from.toString(), to.toString()];
    
    if (!Number.isInteger(from[0]) || !Number.isInteger(from[1]) || from[0] < 0 || from[0] >= 16 || from[1] < 0 || from[1] >= 16)
        return ["invalid", "merge", "[" + from.join(", ") + "]", "[" + to.join(", ") + "]"];
    
    if (!Number.isInteger(to[0]) || !Number.isInteger(to[1]) || to[0] < 0 || to[0] >= 16 || to[1] < 0 || to[1] >= 16)
        return ["invalid", "merge", "[" + from.join(", ") + "]", "[" + to.join(", ") + "]"];
    
    return ["merge", from, to];
};
var unmerge = (at) => {
    if (!Array.isArray(at) || at.length != 2)
        return ["invalid", "unmerge", at.toString()];
    
    if (!Number.isInteger(at[0]) || !Number.isInteger(at[1]) || at[0] < 0 || at[0] >= 16 || at[1] < 0 || at[1] >= 16)
        return ["invalid", "unmerge", "[" + at.join(", ") + "]", "[" + at.join(", ") + "]"];
    
    return ["unmerge", at];
};

(function() {
    var people, regions, bribes, bots;
    
    var dialog;
    
    send_dialog = function(sent) {
        dialog = sent;
    };
    
    run_game = function(bot_one, bot_two) {
        people = [...Array(16)].map(r => Array(16).fill(0));
        regions = [...Array(16)].map((r, i) => [[(i % 4) * 4, (i / 4 | 0) * 4]]);
        bribes = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
        
        bots = Array(2);
        
        try {
            bots[0] = {
                run: eval(bot_one),

                moves: [],
                
                money: 100,
                poll: null,
                storage: {}
            };
        } catch(e) {
            dialog("Bot One:\n  " + (e.stack.replace(/[a-z]+:\/+.*((controller|main)\.js.*)\)/g, "$1)") || (e.name + ": " + e.message)).split("\n").join("\n  "), true);
            
            return;
        }
        
        if (typeof bots[0].run != "function") {
            dialog("Bot One:\n  Not a function", true);
            
            return;
        }
        
        try {
            bots[1] = {
                run: eval(bot_two),

                moves: [],
                
                money: 100,
                poll: null,
                storage: {}
            };
        } catch(e) {
            dialog("Bot Two:\n  " + (e.stack.replace(/[a-z]+:\/+.*((controller|main)\.js.*)\)/g, "$1)") || (e.name + ": " + e.message)).split("\n").join("\n  "), true)
            
            return;
        }
        
        if (typeof bots[1].run != "function") {
            dialog("Bot Two:\n  Not a function", true);
            
            return;
        }
        
        state = States.RUNNING;
    };
    
    run_turn = function() {
        var region_data = (bot) => {
            return regions.map(r => {
                var region = [].concat.apply([], r.map(b => [
                    ...people[b[0]].slice(b[1], b[1] + 4),
                    ...people[b[0] + 1].slice(b[1], b[1] + 4),
                    ...people[b[0] + 2].slice(b[1], b[1] + 4),
                    ...people[b[0] + 3].slice(b[1], b[1] + 4)
                ]));

                return {
                    blocks: r.map(b => [...b]),
                    number_neutral: region.reduce((a, p) => a + (p == 0), 0),
                    number_you: region.reduce((a, p) => a + (p * Math.sign(bot - 0.5) > 0), 0),
                    number_opponent: region.reduce((a, p) => a + (p * Math.sign(bot - 0.5) < 0), 0),
                    absolute_average: region.reduce((a, p) => a + Math.abs(p), 0) / region.length
                };
            });
        };

        var poll_data = (poll, bot) => {
            var area = [];
            var data = [];

            var min_x = Math.min(poll[0][0], poll[1][0]);
            var max_x = Math.max(poll[0][0], poll[1][0]);
            var min_y = Math.min(poll[0][1], poll[1][1]);
            var max_y = Math.max(poll[0][1], poll[1][1]);

            for (let x = min_x; x < max_x; x++)
                area = area.concat(people[x].slice(min_y, max_y));
            
            for (let x = min_x; x < max_x; x++)
                for (let y = min_y; y < max_y; y++)
                    data.push({
                        position: [x, y],
                        region: regions.findIndex(r => r.some(o => (
                            o[0] <= x &&
                            x - o[0] < 4 &&
                            o[1] <= y &&
                            y - o[1] < 4
                        ))),
                        support: people[x][y]
                    });

            return {
                people: data,
                amounts: {
                    number_neutral: area.reduce((a, p) => a + (p == 0), 0),
                    number_you: area.reduce((a, p) => a + (p * Math.sign(bot - 0.5) > 0), 0),
                    number_opponent: area.reduce((a, p) => a + (p * Math.sign(bot - 0.5) < 0), 0),
                    absolute_average: area.reduce((a, p) => a + Math.abs(p), 0) / area.length
                }
            };
        };
        
        bots.forEach((b, i) => {
            try {
                b.move = b.run(
                    region_data(i),
                    b.money,
                    b.poll ? poll_data(b.poll, i) : {},
                    b.storage
                );
            } catch(e) {
                console.warn("Bot " + ["One", "Two"][i] + ":\n  " + (e.stack || e.message).replace(/\n/g, "\n  "));

                b.move = ["invalid", "error"];
            }
        
            if (!Array.isArray(b.move))
                b.move = ["invalid", "none", String(b.move)];
            
            b.moves.push(b.move);
            
            b.poll = null;
        });
        
        if (bots[0].move[0].slice(-5) == "merge" && bots[1].move[0].slice(-5) == "merge") {
            bots[0].move = ["none"];
            bots[1].move = ["none"];
        }
        
        bots.forEach((b, i) => {
            if (b.move[0] != "bribe")
                return;
            
            var bribe = bribes[b.move[1][0] / 4 | 0][b.move[1][1] / 4 | 0];
            
            if (b.money >= bribe + 5) {
                people[b.move[1][0]][b.move[1][1]] += Math.sign(i - 0.5) * (3.5 - bribe * 0.15);
                
                b.money -= bribe + 5;
            } else {
                b.move = ["none"];
            }
        });
        
        bots.forEach((b, i) => {
            if (b.move[0] == "bribe")
                bribes[b.move[1][1] / 4 | 0][b.move[1][0] / 4 | 0] += 1;
            else if (b.move[0] == "campaign" && b.money < Math.abs(b.move[1][0] - b.move[2][0]) * Math.abs(b.move[1][1] - b.move[2][1]))
                b.move = ["none"];
        });
        
        var after = [...Array(16)].map(r => Array(16).fill(0));
        
        bots.forEach((b, i) => {
            if (b.move[0] != "campaign")
                return;
            
            var min = [Math.min(b.move[1][0], b.move[2][0]), Math.min(b.move[1][1], b.move[2][1])];
            var max = [Math.max(b.move[1][0], b.move[2][0]), Math.max(b.move[1][1], b.move[2][1])];
            
            var amount = (x, y) => Math.sign(people[x][y]) * (Math.abs(people[x][y]) >= 2 ? 0.2 : 0.05);
            
            for (let x = min[0]; x < max[0]; x++) {
                for (let a, y = min[1]; y < max[1]; y++) {
                    a = 0;
                    
                    if (x > 0)
                        a += amount(x - 1, y);
                    
                    if (x < 15)
                        a += amount(x + 1, y);
                    
                    if (y > 0)
                        a += amount(x, y - 1);
                    
                    if (y < 15)
                        a += amount(x, y + 1);
                    
                    if (x > 0 && y > 0)
                        a += amount(x - 1, y - 1);
                    
                    if (x > 0 && y < 15)
                        a += amount(x - 1, y + 1);
                    
                    if (x < 15 && y > 0)
                        a += amount(x + 1, y - 1);
                    
                    if (x < 15 && y < 15)
                        a += amount(x + 1, y + 1);
                    
                    after[x][y] += a;
                }
            }
        });
            
        for (let x = 0; x < 16; x++)
            for (let y = 0; y < 16; y++)
                people[x][y] += after[x][y];
        
        bots.forEach((b, i) => {
            if (b.move[0] != "campaign")
                return;
            
            var min = [Math.min(b.move[1][0], b.move[2][0]), Math.min(b.move[1][1], b.move[2][1])];
            var max = [Math.max(b.move[1][0], b.move[2][0]), Math.max(b.move[1][1], b.move[2][1])];
            
            for (let x = min[0]; x < max[0]; x++)
                for (let y = min[1]; y < max[1]; y++)
                    people[x][y] += Math.sign(i - 0.5) * 0.25;
            
            b.money -= Math.abs(b.move[1][0] - b.move[2][0]) * Math.abs(b.move[1][1] - b.move[2][1]);
        });
        
        bots.forEach((b, i) => {
            if (b.move[0] == "poll") {
                var cost = Math.ceil(0.25 * Math.abs(b.move[1][0] - b.move[2][0]) * Math.abs(b.move[1][1] - b.move[2][1]));
                
                if (b.money >= cost) {
                    b.poll = [b.move[1], b.move[2]];
                    b.money -= cost;
                }
                
                return;
            }
            
            if (b.move[0] == "merge") {
                var old = regions.findIndex(r => r.some(o => (
                    o[0] <= b.move[1][0] &&
                    b.move[1][0] - o[0] < 4 &&
                    o[1] <= b.move[1][1] &&
                    b.move[1][1] - o[1] < 4
                )));
                
                var next = regions.find(r => r.some(o => (
                    o[0] <= b.move[2][0] &&
                    b.move[2][0] - o[0] < 4 &&
                    o[1] <= b.move[2][1] &&
                    b.move[2][1] - o[1] < 4
                )));
                
                if (!next.some(n => regions[old].some(o => Math.abs(n[0] - o[0]) + Math.abs(n[1] - o[1]) == 4)) || next[0][0] == regions[old][0][0] && next[0][1] == regions[old][0][1])
                    return;
                
                var cost = 25 * (regions[old].length + next.length);
                
                if (b.money >= cost) {
                    next.push(...regions[old]);
                    regions = regions.filter((r, j) => j != old);
                    
                    b.money -= cost;
                }
                
                return;
            }
            
            if (b.move[0] == "unmerge") {
                var region = regions.findIndex(r => r.some(o => (
                    o[0] <= b.move[1][0] &&
                    b.move[1][0] - o[0] < 4 &&
                    o[1] <= b.move[1][1] &&
                    b.move[1][1] - o[1] < 4
                )));
                
                var cost = 25 * regions[region].length;
                
                if (b.money >= cost) {
                    regions.push(...regions[region]);
                    regions.filter((r, j) => j != region);
                    
                    b.money -= cost;
                }
                
                return;
            }
        });
        
        bots[0].money += 10;
        bots[1].money += 10;
        
        var data = region_data(1);
        
        if (data.some(r => r.number_neutral >= r.blocks.length * 8 || r.number_you == r.number_opponent))
            return;
        
        var total = data.reduce((a, r) => a + Math.sign(r.number_you - r.number_opponent), 0);
        
        if (total < 0) {
            dialog("Winner: Bot One");
            
            state = States.DONE;
            
            return;
        } else if (total > 0) {
            dialog("Winner: Bot Two");
            
            state = States.DONE;
            
            return;
        }
    };
    
    read_board = function() {
        if (state == States.NOT_RUNNING)
            return [
                [...Array(16)].map(r => Array(16).fill(0)),
                [...Array(16)].map((r, i) => [[(i % 4) * 4, (i / 4 | 0) * 4]]),
                [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
                [100, 100],
                [Array(10).fill("\xa0"), Array(10).fill("\xa0")]
            ];
        else
            return [people, regions, bribes, [bots[0].money, bots[1].money], bots.map(b => (b.moves = b.moves.slice(-10)).map(m => ({
                "campaign": "Campaign: ",
                "poll": "Poll: ",
                "bribe": "Bribe: ",
                "merge": "Merge: ",
                "unmerge": "Unmerge: ",
                "invalid": "Invalid",
                "none": "None"
            })[m[0]] + m.slice(1).map(a => Array.isArray(a) ? "(" + a.join(",") + ") " : "").join("")).concat(Array(10).fill("\xa0")).slice(0, 10))];
    };
})();
