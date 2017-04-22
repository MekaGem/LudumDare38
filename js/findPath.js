function isFree(map, pos_x, pos_y) {
    if (pos_x < 0 || pos_x >= map.width || pos_y < 0 || pos_y >= map.height) {
        // out of bounds.
        return false;
    }
    cell = map.cells[pos_x][pos_y];
    return isPassable(cell);
}

function generateHelpField(map) {
    var help_field = new Array();
    for (i = 0; i < map.width; ++i) {
        help_field.push([]);
        for (j = 0; j < map.height; ++j) {
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

function findPath(map, start_x, start_y, destination_x, destination_y) {
    help_field = generateHelpField(map);
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
            if (isFree(map, next_tile[0], next_tile[1]) === true
                && help_field[next_tile[0]][next_tile[1]].used == false) {
                help_field[next_tile[0]][next_tile[1]].used = true;
                help_field[next_tile[0]][next_tile[1]].from = current;
                queue.push(next_tile);
            }
        }
    }

    // no path found.
    return answerPath;
}

function testFillMapWithGrass(width, height) {
    test_map = new Map(width, height);
    my_cells = new Array();
    for (var x = 0; x < test_map.width; ++x) {
        my_cells.push([]);
        for (var y = 0; y < test_map.height; ++y) {
            my_cells[x].push(new Cell("G"));
        }
    }
    test_map.cells = my_cells;
    return test_map;
}

function findPathTest() {
    var map_1 = testFillMapWithGrass(2, 2);
    var answerPath_1 = findPath(map_1, 0, 0, 0, 0);


    /*
        [0, 0, 1, 0, 0]
        [0, 0, 1, 0, 0]
        [1, 1, 1, 0, 1]
        [0, 1, 0, 0, 0]
    */
    var map_2 = testFillMapWithGrass(4, 5);
    map_2.cells[0][2].type = "W";
    map_2.cells[1][2].type = "W";
    map_2.cells[2][0].type = "W";
    map_2.cells[2][1].type = "W";
    map_2.cells[2][2].type = "W";
    map_2.cells[2][4].type = "W";
    map_2.cells[3][1].type = "W";
    var answerPath_2 = findPath(map_2, 0, 0, 3, 4);


    /*
        [0, 0, 1, 0, 0]
        [0, 0, 1, 0, 0]
        [1, 0, 0, 0, 1]
        [0, 1, 0, 0, 0]
    */
    var map_3 = testFillMapWithGrass(4, 5);
    map_3.cells[0][2].type = "W";
    map_3.cells[1][2].type = "W";
    map_3.cells[2][0].type = "W";
    map_3.cells[2][4].type = "W";
    map_3.cells[3][1].type = "W";
    var answerPath_3 = findPath(map_3, 1, 1, 3, 4);


    var map_4 = testFillMapWithGrass(2, 2);
    var answerPath_4 = findPath(map_4, 0, 0, 1, 1);
}