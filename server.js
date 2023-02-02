import http from "http"

const host = 'localhost';
const port = 8000;

const requestListener = function (req, res) {
    res.setHeader("Content-Type", "application/json");
    switch (req.url) {
        case "/us/getChartInfo":
            res.writeHead(200);
            res.end("This is books response !!");
            break
        default:
            res.writeHead(200);
            res.end("My first server!");
            break
    }
};

const server = http.createServer(requestListener);
server.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
});