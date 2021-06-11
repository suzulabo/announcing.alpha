import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import { createProxyServer } from 'http-proxy';

type ProxyServer = ReturnType<typeof createProxyServer>;

const httpsOptions = {
  key: fs.readFileSync('./localhttps_key.pem'),
  cert: fs.readFileSync('./localhttps_cert.pem'),
};

const logging = (s: string, all?: boolean) => {
  const now = new Date();
  const d = now.toLocaleTimeString(undefined, { hour12: false });
  if (!all && s.length > 100) {
    s = s.substr(0, 97) + '...';
  }
  console.log(`${d} ${s}`);
};

interface ProxyConfig {
  pattern: string | RegExp;
  proxy: number | ((req: http.IncomingMessage, res: http.ServerResponse) => void);
}

const proxyServerMap = new Map<number, ProxyServer>();

const getProxyServer = (port: number) => {
  if (proxyServerMap.has(port)) {
    return proxyServerMap.get(port);
  }

  const sv = createProxyServer({
    target: { host: '127.0.0.1', port },
    secure: false,
  });
  sv.on('error', err => {
    logging(`${err.stack}`, true);
  });
  proxyServerMap.set(port, sv);
  return sv;
};

const createDevProxy = (port: number, httpsPort: number, patterns: ProxyConfig[]) => {
  const match = (url: string, pattern: string | RegExp) => {
    if (!pattern) {
      return true;
    }
    if (typeof pattern == 'string') {
      return url.startsWith(pattern);
    }
    return pattern.test(url);
  };

  const proxyServers = patterns.map(x => {
    if (typeof x.proxy == 'number') {
      const server = getProxyServer(x.proxy);
      return {
        server: server,
        pattern: x.pattern,
      };
    } else {
      return {
        handler: x.proxy,
        pattern: x.pattern,
      };
    }
  });

  const reqListener = (req: http.IncomingMessage, res: http.ServerResponse) => {
    const url = req.url;
    logging(url);
    for (const sv of proxyServers) {
      if (match(url, sv.pattern)) {
        if (sv.server) {
          sv.server.web(req, res);
        } else {
          sv.handler(req, res);
        }
        return;
      }
    }
  };
  const handleUpgrade = (req: http.IncomingMessage, socket: any, head: any) => {
    const url = req.url as string;
    logging(`ws:${url}`);
    for (const sv of proxyServers) {
      if (match(url, sv.pattern)) {
        if (sv.server) {
          sv.server.ws(req, socket, head);
        } else {
          console.warn('handler on web socket is unsupported');
        }
        return;
      }
    }
  };

  {
    const httpServer = http.createServer(reqListener);
    httpServer.on('upgrade', handleUpgrade);
    httpServer.on('error', err => {
      logging(`${err.stack}`, true);
    });
    httpServer.listen(port);
  }
  {
    const httpsServer = https.createServer(httpsOptions, reqListener);
    httpsServer.on('upgrade', handleUpgrade);
    httpsServer.on('error', err => {
      logging(`${err.stack}`, true);
    });
    httpsServer.listen(httpsPort);
  }
};

/*
const errorProxy = (req: http.IncomingMessage, res: http.ServerResponse) => {
  res.writeHead(500, { 'Content-Type': 'text/plain' });
  res.end('Error from dev-proxy config');
};
*/

createDevProxy(9292, 9392, [
  {
    pattern: '/www.googleapis.com/identitytoolkit/v3/relyingparty/getProjectConfig',
    proxy: (req, res) => {
      // hack emulator's authorizedDomains
      // https://github.com/firebase/firebase-tools/issues/3104
      const host = (req.headers.host || '').split(':')[0];
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ projectId: '12345', authorizedDomains: ['localhost', host] }));
    },
  },
  { proxy: 9099, pattern: '/www.googleapis.com/identitytoolkit/' }, // auth
  { proxy: 9099, pattern: '/securetoken.googleapis.com/' }, // auth
  { proxy: 9099, pattern: '/emulator/auth' }, // auth
  { proxy: 9099, pattern: '/identitytoolkit.googleapis.com/' }, // auth
  { proxy: 8080, pattern: '/google.firestore.v1.Firestore/' }, // firestore RPC
  { proxy: 8080, pattern: '/v1/' }, // firestore REST
  { proxy: 5001, pattern: new RegExp('.+/us-central1/.+') }, // functions
  { proxy: 3370, pattern: '' }, // stencil
]);
console.log('Console: http://localhost:9292/');
console.log('Console: https://localhost:9392/');

createDevProxy(9293, 9393, [
  { proxy: 8080, pattern: '/v1/' }, // firestore REST
  { proxy: 8080, pattern: '/google.firestore.v1.Firestore/' }, // firestore RPC
  { proxy: 5001, pattern: new RegExp('.+/us-central1/.+') }, // functions
  { proxy: 5000, pattern: '/data/' }, // functions by hosting
  { proxy: 3371, pattern: '' }, // stencil
]);
console.log('Client: http://localhost:9293/');
console.log('Client: https://localhost:9393/');
