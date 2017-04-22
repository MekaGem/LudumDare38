var stage;
var center;
var camera;

var CAMERA_MOVEMENT_BORDER = 80;
var CAMERA_MOVEMENT_SPEED = 500;

function resize() {
    stage.canvas.width = window.innerWidth;
    stage.canvas.height = window.innerHeight;
    center = new Point(stage.canvas.width / 2, stage.canvas.height / 2);
    console.log("Resize to: " + stage.canvas.width + ":" + stage.canvas.height);
}

function init() {
    stage = new createjs.Stage("demoCanvas");

    window.addEventListener('resize', resize);
    resize();

    var circle = new createjs.Shape();
    circle.graphics.beginFill("DeepSkyBlue").drawCircle(0, 0, 50);
    circle.x = 100;
    circle.y = 100;
    stage.addChild(circle);
    stage.update();

    var map = new Map(100, 50);
    var world = new World(10, 10, 10, 10);
    map.addWorld(world);
    camera = world.getCenter();
    console.log("Camera at " + camera.x + ":" + camera.y);

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

    for (var x = 0; x < world.width; ++x) {
        for (var y = 0; y < world.height; ++y) {
            if (world.cells[x][y].type == "G") {
                if (x % 2 == 0) {
                    world.addUnit(new Tree(x, y, spriteSheet));
                } else {
                    world.addUnit(new Rock(x, y, spriteSheet));
                }
            }
        }
    }

    stage.update();

    // Setup periodic ticker.
    createjs.Ticker.setFPS(60);
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
        seconds = event.delta / 1000.;

        // Move camera.
        if (stage.mouseX < CAMERA_MOVEMENT_BORDER) {
            camera.x -= CAMERA_MOVEMENT_SPEED * seconds;
        }
        if (stage.mouseX > stage.canvas.width - CAMERA_MOVEMENT_BORDER) {
            camera.x += CAMERA_MOVEMENT_SPEED * seconds;
        }
        if (stage.mouseY < CAMERA_MOVEMENT_BORDER) {
            camera.y -= CAMERA_MOVEMENT_SPEED * seconds;
        }
        if (stage.mouseY > stage.canvas.height - CAMERA_MOVEMENT_BORDER) {
            camera.y += CAMERA_MOVEMENT_SPEED * seconds;
        }

        map.container.x = center.x;
        map.container.y = center.y;

        map.container.regX = camera.x;
        map.container.regY = camera.y;

        // Render.
        stage.update();
    }

    function step() {
        borderCell = pickRandomBorderCell(world);
        if (borderCell) {
            world.transformToWater(borderCell.x, borderCell.y);
        }
        console.log("Step!");
    }
}
