export default class Session {
  constructor() {
    // 尝试从localStorage获取上次的sessionId
    this.socket = null;
    this.history = [];
    this.heartbeatInterval = null;
    this.sessionId = null;
  }

  connect(terminal) {
    this.terminal = terminal;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/api/ssh`;
    console.log('Connecting to WebSocket:', wsUrl);

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.addEventListener('open', () => {
        console.log('WebSocket connection opened');
        this.socket.send(
          JSON.stringify({
            action: 'connect',
          }),
        );

        // 启动心跳
        this.heartbeatInterval = setInterval(() => {
          if (this.isConnected()) {
            this.socket.send(JSON.stringify({ action: 'heartbeat' }));
          }
        }, 10000);

        // 显示历史消息
        this.history.forEach((msg) => terminal.write(msg));
      });

      this.socket.addEventListener('message', (event) => {
        const data = event.data;
        if (data.startsWith('{')) {
          const cmd = JSON.parse(data);
          if (cmd['action'] === 'reuse_session') {
            // 重用session，不做处理
            this.send('\n');
          } else if (cmd['action'] === 'new_session') {
            // 新session，保存sessionId
            this.sessionId = cmd.session_id;
          }
        } else {
          this.history.push(data);
          this.terminal.write(data);
        }
      });

      this.socket.addEventListener('error', (error) => {
        console.error('WebSocket error:', error);
      });

      this.socket.addEventListener('close', (event) => {
        console.log('WebSocket connection closed:', event);
        if (this.heartbeatInterval) {
          clearInterval(this.heartbeatInterval);
        }
      });
    } catch (error) {
      console.error('WebSocket connection failed:', error);
    }
  }

  send(data) {
    if (this.isConnected()) {
      this.socket.send(data);
    }
  }

  isConnected() {
    return this.socket && this.socket.readyState === WebSocket.OPEN;
  }

  updateTerminal(terminal) {
    // 发送历史消息到新terminal
    // console.log(this.history);
    this.history.forEach((msg) => terminal.write(msg));

    if (this.isConnected()) {
      this.terminal = terminal;
    } else {
      this.connect(terminal);
    }
  }

  destroy() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
  }
}
