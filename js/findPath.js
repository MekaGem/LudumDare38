function isFree(field, pos_x, pos_y) {
    if (pos_x < 0 || pos_x >= field.length || pos_y < 0 || pos_y >= field[0].length) {
        // out of bounds.
        return false;
    }
    value = field[pos_x][pos_y];
    if (value === 0) {
        return true;
    } else {
        return false;
    }
}

var possible_moves = [[1, 0], [0, 1], [-1, 0], [0, -1]];

function generateHelpField(field) {
    var help_field = new Array();
    for (i = 0; i < field.length; ++i) {
        help_field.push([]);
        for (j = 0; j < field[0].length; ++j) {
            help_field[i].push({
                used : false,
                from : [-1, -1]
            });
        }
    }
    return help_field;
}

function findPath(field, start_x, start_y, destination_x, destination_y) {
    help_field = generateHelpField(field);
    var answerPath = new Array();
    var queue = new Array();
    var current = [start_x, start_y];
    queue.push(current);
    help_field[start_x][start_y].used = true;
    while (queue.length > 0) {
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
            if (isFree(field, next_tile[0], next_tile[1]) === true
                && help_field[next_tile[0]][next_tile[1]].used == false) {
                help_field[next_tile[0]][next_tile[1]].used = true;
                help_field[next_tile[0]][next_tile[1]].from = current;
                queue.push(next_tile);
            }
        }
        current = queue.shift();
    }

    // no path found.
    return answerPath;
}

function findPathTest() {
    var field_1 = [
        [0, 0],
        [0, 0]
    ];
    var answerPath_1 = findPath(field_1, 0, 0, 0, 0);
    var field_2 = [
        [0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0],
        [1, 1, 1, 0, 1],
        [0, 1, 0, 0, 0]
    ];
    var answerPath_2 = findPath(field_2, 0, 0, 3, 4);
    var field_3 = [
        [0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0],
        [1, 0, 0, 0, 1],
        [0, 1, 0, 0, 0]
    ];
    var answerPath_3 = findPath(field_3, 1, 1, 3, 4);
    var field_4 = [
        [0, 0],
        [0, 0]
    ];
    var answerPath_4 = findPath(field_4, 0, 0, 1, 1);
}