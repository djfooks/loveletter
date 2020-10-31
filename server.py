import time
from http.server import HTTPServer, BaseHTTPRequestHandler


HOST_NAME = '192.168.1.9'
PORT_NUMBER = 8080


class MyHandler(BaseHTTPRequestHandler):
    def get_content_type(s):
        s.binary = False
        s.content_type = ''
        path_split = s.path.split(".")
        if len(path_split) > 1:
            ext = path_split[-1]
            if ext == "html":
                s.content_type = "text/html"
            elif ext == "js":
                s.content_type = "text/javascript"
            elif ext == "css":
                s.content_type = "text/css"
            elif ext == "png":
                s.content_type = "image/png"
                s.binary = True
            elif ext == "svg":
                s.content_type = "image/svg+xml"
                s.binary = True
            elif ext == "ico":
                s.content_type = "image/vnd.microsoft.icon"
                s.binary = True
        else:
            s.content_type = "text/html"

    def do_GET(s):
        """Respond to a GET request."""
        s.get_content_type()
        path = s.path
        if path == "/":
            path = "/index.html"
        path = path[1:]

        try:
            with open(path, "rb" if s.binary else "r") as f:
                s.send_response(200)
                s.send_header("Content-type", s.content_type)
                s.end_headers()
                s.wfile.write(f.read() if s.binary else bytes(f.read(), "utf8"))
        except Exception as e:
            s.send_response(404)
            s.send_header("Content-type", s.content_type)
            s.end_headers()
            print(e)

if __name__ == '__main__':
    httpd = HTTPServer((HOST_NAME, PORT_NUMBER), MyHandler)
    print(time.asctime(), "Server Starts - %s:%s" % (HOST_NAME, PORT_NUMBER))
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    httpd.server_close()
    print(time.asctime(), "Server Stops - %s:%s" % (HOST_NAME, PORT_NUMBER))
