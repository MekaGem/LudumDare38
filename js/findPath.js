function generateHelpField(world) {
    var help_field = new Array();
    for (i = 0; i < world.width; ++i) {
        help_field.push([]);
        for (j = 0; j < world.height; ++j) {
            help_field[i].push({
                used : false,
                from : [-1, -1]
            });
        }
    }
    return help_field;
}

// #TODO: should be declared in some config.
var possible_moves = [[1, 0], [0, 1], [-1, 0], [0, -1]];

function findPath(world, start_x, start_y, destination_x, destination_y) {
    help_field = generateHelpField(world);
    var answerPath = new Array();
    var queue = new Array();
    queue.push([start_x, start_y]);
    help_field[start_x][start_y].used = true;
    while (queue.length > 0) {
        current = queue.shift();
        if (current[0] === destination_x && current[1] === destination_y) {
            // we are in a destination point.
            while(current[0] != start_x || current[1] != start_y) {
                answerPath.push(current);
                current = help_field[current[0]][current[1]].from;
            }
            answerPath.push(current);
            answerPath.reverse();
            // return all cells, that are in path to destination, starting from current.
            return answerPath;
        }

        for (i = 0; i < possible_moves.length; ++i) {
            var next_tile = [current[0] + possible_moves[i][0], current[1] + possible_moves[i][1]];
            if (world.cellIsPassable(next_tile[0], next_tile[1]) && !help_field[next_tile[0]][next_tile[1]].used) {
                help_field[next_tile[0]][next_tile[1]].used = true;
                help_field[next_tile[0]][next_tile[1]].from = current;
                queue.push(next_tile);
            }
        }
    }

    // no path found.
    return answerPath;
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
