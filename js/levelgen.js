function GenerateIsland(w, h, k) {
    var island = [];
    
    for (var x = 0; x < w; x++) {
        island[x] = [];
        for (var y = 0; y < h; y++) {
            island[x][y] = true;
        }
    }
    
    for (var i = 0; i < k; i++) {
        var outedge = [];
        for (var x = 0; x < w; x++) {
            for (var y = 0; y < h; y++) {
                if (!island[x] || !island[x][y]) continue;
                
                var inside = true;
                var neighbor;
                for (var d = 0; d < 4; d++) {
                    var nx = x + DIRS[d].x;
                    var ny = y + DIRS[d].y;
                    if (!island[nx] || !island[nx][ny]) {
                        inside = false;
                    } else {
                        neighbor = {x: nx, y: ny};
                    }
                }
                
                if (inside) continue;
                
                var visited = [];
                for (var xx = 0; xx < w; xx++) visited[xx] = [];
                visited[neighbor.x][neighbor.y] = true;
                var q = [neighbor];
                while (q.length > 0) {
                    var pos = q.shift();
                    
                    for (var d = 0; d < 4; d++) {
                        var npos = {x: pos.x + DIRS[d].x, y: pos.y + DIRS[d].y};
                        if ((npos.y != y || npos.x != x) && island[npos.x] && island[npos.x][npos.y] && !visited[npos.x][npos.y]) {
                            visited[npos.x][npos.y] = true;
                            q.push(npos);
                        }
                    }
                }
                
                var cutVertex = false;
                for (var d = 0; d < 4; d++) {
                    var nx = x + DIRS[d].x;
                    var ny = y + DIRS[d].y;
                    if (island[nx] && island[nx][ny] && !visited[nx][ny]) {
                        cutVertex = true;
                        break;
                    }
                }
                
                if (cutVertex) continue;
                
                outedge.push({x: x, y: y});
            }
        }
        
        if (outedge.length == 0) break;
        
        var id = getRandomInt(0, outedge.length);
        island[outedge[id].x][outedge[id].y] = false;
    }
    
    return island;
}
