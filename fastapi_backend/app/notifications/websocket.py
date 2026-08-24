from fastapi import (
    APIRouter,
    WebSocket,
    WebSocketDisconnect,
)


# ============================================================
# ROUTER
# ============================================================

router = APIRouter()


# ============================================================
# CONNECTION MANAGER
# ============================================================

class ConnectionManager:

    def __init__(self):
        self.active_connections = []


    async def connect(
        self,
        websocket: WebSocket,
    ):
        await websocket.accept()

        self.active_connections.append(
            websocket
        )

        print(
            "WebSocket client connected ✅"
        )


    def disconnect(
        self,
        websocket: WebSocket,
    ):
        if websocket in self.active_connections:

            self.active_connections.remove(
                websocket
            )

            print(
                "WebSocket client disconnected ❌"
            )


    async def broadcast(
        self,
        message: dict,
    ):
        disconnected = []

        for connection in self.active_connections:

            try:

                await connection.send_json(
                    message
                )

            except Exception:

                disconnected.append(
                    connection
                )


        for connection in disconnected:

            self.disconnect(
                connection
            )


# ============================================================
# GLOBAL CONNECTION MANAGER
# ============================================================

manager = ConnectionManager()


# ============================================================
# WEBSOCKET ENDPOINT
# ============================================================

@router.websocket(
    "/ws/notifications"
)
async def websocket_notifications(
    websocket: WebSocket,
):

    print(
        "WebSocket connection request received..."
    )

    await manager.connect(
        websocket
    )

    try:

        while True:

            data = await websocket.receive_text()

            print(
                "WebSocket received:",
                data
            )


            if data == "ping":

                await websocket.send_json(
                    {
                        "type": "pong"
                    }
                )

    except WebSocketDisconnect:

        manager.disconnect(
            websocket
        )

    except Exception as error:

        print(
            "WebSocket error:",
            error
        )

        manager.disconnect(
            websocket
        )