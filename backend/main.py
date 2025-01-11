import time
import uuid
import json
import paramiko
import asyncio
import logging
import traceback
import uuid

from collections import defaultdict
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from starlette.websockets import WebSocketState

app = FastAPI()

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(filename)s:%(lineno)4d - %(levelname)5s - %(message)s", datefmt="%Y-%m-%d %H:%M:%S")
logger = logging.getLogger(__name__)

from session import Session

class SessionManager:
    def __init__(self):
        self.sessions = {}
        
    def create_session(self, websocket, session_id=None)-> str:
        if not session_id:
            session_id = str(uuid.uuid4())
        self.sessions[session_id] = Session(websocket, session_id)
        return session_id
        
    def get_session(self, session_id) -> Session:
        return self.sessions.get(session_id)
        
    def remove_session(self, session_id):
        session = self.sessions.pop(session_id, None)
        if session:
            try:
                session.disconnect()
            except:
                pass
            
    async def get_or_create_session(self, session_id, websocket) -> Session:
        session = self.get_session(session_id) if session_id else None
        if session:
            logger.info(f"Resuming existing session: {session_id}")
            session.websocket = websocket
            await websocket.send_text(json.dumps({
                "action": "reuse_session",
                "session_id": session_id
            }))
        else:
            session_id = self.create_session(websocket, session_id)
            await websocket.send_text(json.dumps({
                "action": "new_session", 
                "session_id": session_id
            }))
            logger.info(f"Created new session: {session_id}")
            
        return self.get_session(session_id)
                

session_manager = SessionManager()

@app.websocket("/ssh")
async def websocket_endpoint(websocket: WebSocket, session_id: str = None):
    logger.info("accept time {}".format(time.time()))
    await websocket.accept()

    if session_id == None:
        session_id = str(uuid.uuid4())

    session = await session_manager.get_or_create_session(session_id, websocket)
    
    try:
        while True:
            try:
                # 检查最后活动时间是否超过300秒
                current_time = asyncio.get_event_loop().time()
                if current_time - session.last_active > 300:
                    logger.warning(f"Session {session_id} timeout due to inactivity")
                    await websocket.send_text('{"timeout": "No activity detected"}')
                    break
                data = await asyncio.wait_for(websocket.receive_text(), timeout=300)
                session.last_active = asyncio.get_event_loop().time()
                await session.handle_input(data)
            except asyncio.TimeoutError:
                logger.warning("WebSocket timeout")
                await websocket.send_text("Timeout: No data received")
                break
            except paramiko.SSHException as e:
                logger.error(f"SSH error: {str(e)}")
                await websocket.send_text(f"SSH Error: {str(e)}")
                break
    except WebSocketDisconnect:
        logger.info("Client disconnected {}".format(time.time()))
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        try:
            await websocket.send_text(f"Error: {str(e)}")
        except:
            logger.error("Failed to send error message - connection already closed")
    finally:
        session_manager.remove_session(session_id)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
