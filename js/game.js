function init() {
    var stage = new createjs.Stage("demoCanvas");
    var circle = new createjs.Shape();
    circle.graphics.beginFill("DeepSkyBlue").drawCircle(0, 0, 50);
    circle.x = 100;
    circle.y = 100;
    stage.addChild(circle);
    stage.update();

    var map = simpleMap();
    stage.addChild(map.container);

    var data = {
        images: ["assets/tree.png", "assets/rock.png"],
        frames: [
            [0, 0, 64, 64, 0, 32, 32],
            [0, 0, 64, 64, 1, 32, 32]
        ],
        animations: {
            tree: 0,
            rock: 1
        }
    };
    var spriteSheet = new createjs.SpriteSheet(data);

    for (var x = 0; x < map.width; ++x) {
        for (var y = 0; y < map.height; ++y) {
            if (map.cells[x][y].type == "G") {
                if (x % 2 == 0) {
                    map.addUnit(new Tree(x, y, spriteSheet));
                } else {
                    map.addUnit(new Rock(x, y, spriteSheet));
                }
            }
        }
    }

    stage.update();

    // Setup periodic ticker.
    createjs.Ticker.setFPS(30);
    createjs.Ticker.addEventListener("tick", tick);

    var stepPeriod = 1000; // 1 second.
    var timePassed = 0;

    function tick(event) {
        timePassed += event.delta;
        while (timePassed > stepPeriod) {
            // Update game world.
            step();
            timePassed -= stepPeriod;
        }
        // Render.
        stage.update();
    }

    function step() {
        borderCell = pickRandomBorderCell(map);
        if (borderCell) {
            map.transformToWater(borderCell.x, borderCell.y);
        }
        console.log("Step!");
    }
}
