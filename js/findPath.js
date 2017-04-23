function generateHelpField(width, height) {
    var helpField = [];
    for (var i = 0; i < width; ++i) {
        helpField.push([]);
        for (var j = 0; j < height; ++j) {
            helpField[i].push({
                used : false,
                from : new Point(-1, -1)
            });
        }
    }
    return helpField;
}

function findPath(world, startX, startY, destinationX, destinationY) {
    if (startX == destinationX && startY == destinationY) return null;

    helpField = generateHelpField(world.width, world.height);
    var answerPath = [];
    var queue = [];

    queue.push(new Point(startX, startY));
    helpField[startX][startY].used = true;
    while (queue.length > 0) {
        var current = queue.shift();
        if (current.x === destinationX && current.y === destinationY) {
            // we are in a destination point.
            while (current.x != startX || current.y != startY) {
                answerPath.push(current);
                current = helpField[current.x][current.y].from;
            }

            answerPath.reverse();
            // return all cells, that are in path to destination, starting from current.
            return answerPath;
        }

        for (var i = 0; i < DIRS.length; ++i) {
            var nextTile = new Point(current.x + DIRS[i].x, current.y + DIRS[i].y);
            if (world.cellIsPassable(nextTile.x, nextTile.y) && !helpField[nextTile.x][nextTile.y].used) {
                helpField[nextTile.x][nextTile.y].used = true;
                helpField[nextTile.x][nextTile.y].from = current;
                queue.push(nextTile);
            }
        }
    }

    // no path found.
    return null;
}

function testFillWorldWithGrass(width, height) {
    test_world = new World(width, height);
    my_cells = new Array();
    for (var x = 0; x < test_world.width; ++x) {
        my_cells.push([]);
        for (var y = 0; y < test_world.height; ++y) {
            my_cells[x].push(new Cell("G"));
        }
    }
    test_world.cells = my_cells;
    return test_world;
}

function findPathTest() {
    var world_1 = testFillWorldWithGrass(2, 2);
    var answerPath_1 = findPath(world_1, 0, 0, 0, 0);
    console.log(answerPath_1);

    /*
        [0, 0, 1, 0, 0]
        [0, 0, 1, 0, 0]
        [1, 1, 1, 0, 1]
        [0, 1, 0, 0, 0]
    */
    var world_2 = testFillWorldWithGrass(4, 5);
    world_2.cells[0][2].type = "W";
    world_2.cells[1][2].type = "W";
    world_2.cells[2][0].type = "W";
    world_2.cells[2][1].type = "W";
    world_2.cells[2][2].type = "W";
    world_2.cells[2][4].type = "W";
    world_2.cells[3][1].type = "W";
    var answerPath_2 = findPath(world_2, 0, 0, 3, 4);
    console.log(answerPath_2);

    /*
        [0, 0, 1, 0, 0]
        [0, 0, 1, 0, 0]
        [1, 0, 0, 0, 1]
        [0, 1, 0, 0, 0]
    */
    var world_3 = testFillWorldWithGrass(4, 5);
    world_3.cells[0][2].type = "W";
    world_3.cells[1][2].type = "W";
    world_3.cells[2][0].type = "W";
    world_3.cells[2][4].type = "W";
    world_3.cells[3][1].type = "W";
    var answerPath_3 = findPath(world_3, 1, 1, 3, 4);
    console.log(answerPath_3);

    var world_4 = testFillWorldWithGrass(2, 2);
    var answerPath_4 = findPath(world_4, 0, 0, 1, 1);
    console.log(answerPath_4);
}

// findPathTest();
