function GenerateIsland(w, h, k) {
    var island = [];
    
    for (var y = 0; y < h; y++) {
        island[y] = [];
        for (var x = 0; x < w; x++) {
            island[y][x] = true;
        }
    }
    
    var dirs = [
        {x: 1, y: 0},
        {x: 0, y: 1},
        {x: -1, y: 0},
        {x: 0, y: -1}
    ];
    
    for (var i = 0; i < k; i++) {
        var outedge = [];
        for (var y = 0; y < h; y++) {
            for (var x = 0; x < w; x++) {
                if (!island[y] || !island[y][x]) continue;
                
                var inside = true;
                var neighbor;
                for (var d = 0; d < 4; d++) {
                    var nx = x + dirs[d].x;
                    var ny = y + dirs[d].y;
                    if (!island[ny] || !island[ny][nx]) {
                        inside = false;
                    } else {
                        neighbor = {x: nx, y: ny};
                    }
                }
                
                if (inside) continue;
                
                var visited = [];
                for (var yy = 0; yy < h; yy++) visited[yy] = [];
                visited[neighbor.y][neighbor.x] = true;
                var q = [neighbor];
                while (q.length > 0) {
                    var pos = q.shift();
                    
                    for (var d = 0; d < 4; d++) {
                        var npos = {x: pos.x + dirs[d].x, y: pos.y + dirs[d].y};
                        if ((npos.y != y || npos.x != x) && island[npos.y] && island[npos.y][npos.x] && !visited[npos.y][npos.x]) {
                            visited[npos.y][npos.x] = true;
                            q.push(npos);
                        }
                    }
                }
                
                var cutVertex = false;
                for (var d = 0; d < 4; d++) {
                    var nx = x + dirs[d].x;
                    var ny = y + dirs[d].y;
                    if (island[ny] && island[ny][nx] && !visited[ny][nx]) {
                        cutVertex = true;
                        break;
                    }
                }
                
                if (cutVertex) continue;
                
                outedge.push({x: x, y: y});
            }
        }
        
        if (outedge.length == 0) break;
        
        var t = Math.floor(Math.random() * outedge.length);
        island[outedge[t].y][outedge[t].x] = false;
    }
    
    return island;
}