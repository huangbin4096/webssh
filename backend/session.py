import paramiko
import asyncio
import logging
import json
import traceback

logger = logging.getLogger(__name__)

class Session:
    def __init__(self, websocket, session_id):
        self.websocket = websocket
        self.session_id = session_id
        self.ssh = paramiko.SSHClient()
        self.ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        self.connected = False
        self.channel = None
        self.last_active = asyncio.get_event_loop().time()

    async def connect(self, host="localhost", port=22, username="root", password="qwer@123"):
        try:
            self.ssh.connect(
                hostname=host,
                port=port,
                username=username,
                password=password,
                timeout=10
            )
            self.channel = self.ssh.invoke_shell(term='xterm')
            self.channel.settimeout(0.1)
            self.connected = True
            return True
        except Exception as e:
            logger.error(f"SSH connection error: {str(e)}")
            return False

    async def forward_output(self):
        try:
            while self.connected:
                if not self.channel or self.channel.closed:
                    if not await self.reconnect():
                        break
                        
                if self.channel.recv_ready():
                    data = self.channel.recv(1024).decode(errors='ignore')
                    if data:
                        try:
                            await self.websocket.send_text(data)
                        except:
                            break
                elif self.channel.recv_stderr_ready():
                    data = self.channel.recv_stderr(1024).decode(errors='ignore')
                    if data:
                        try:
                            await self.websocket.send_text(data)
                        except:
                            break
                await asyncio.sleep(0.01)
        except Exception as e:
            logger.error(f"Forward output error: {str(e)}")

    async def reconnect(self):
        try:
            if self.ssh.get_transport() and self.ssh.get_transport().is_active():
                self.channel = self.ssh.invoke_shell(term='xterm')
                self.channel.settimeout(0.1)
                return True
            else:
                # 完全重新连接
                await self.connect()
                return self.connected
        except Exception as e:
            logger.error(f"Reconnect failed: {str(e)}")
            return False

    async def handle_input(self, data):
        if data.startswith("{") or data.startswith("["):
            try:
                cmd = json.loads(data)
                if cmd["action"] == "connect":
                    if not self.connected:
                        await self.connect("localhost", 22, "root", "qwer@123")
                        asyncio.create_task(self.forward_output())
                elif cmd["action"] == "heartbeat":
                    self.last_active = asyncio.get_event_loop().time()
                elif cmd["action"] == "resize":
                    self.resize(int(cmd["cols"]), int(cmd["rows"]))
                elif cmd["action"] == "disconnect":
                    self.disconnect()
                else:
                    logger.info(f"unknow cmd: session {self.session_id} {cmd}")    
            except Exception as ex:
                logger.error(traceback.format_exc())
        else:
            if not self.connected or not self.channel or self.channel.closed:
                if not await self.reconnect():
                    return
            if self.connected and self.channel:
                self.channel.send(data)

    def resize(self, cols, rows):
        if self.connected and self.channel:
            self.channel.resize_pty(width=int(cols), height=int(rows))

    def disconnect(self):
        try:
            self.connected = False
            if self.channel:
                self.channel.close()
        finally:
            self.ssh.close()
