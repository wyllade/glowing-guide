from app.extensions import socketio, db
from flask_jwt_extended import decode_token
from app.models.message import Message
from flask import request


@socketio.on("connect")
def handle_connect():
    token = request.args.get("token")
    if token:
        try:
            data = decode_token(token)
            request.user_id = int(data["sub"])
        except Exception:
            return False
    return True


@socketio.on("join")
def handle_join(data):
    room = get_room(data["user1"], data["user2"])
    socketio.join_room(room)


@socketio.on("send_message")
def handle_send_message(data):
    sender_id = request.user_id
    receiver_id = data["receiver_id"]
    content = data["content"]

    message = Message(
        sender_id=sender_id,
        receiver_id=receiver_id,
        content=content,
        appointment_id=data.get("appointment_id"),
    )
    db.session.add(message)
    db.session.commit()

    room = get_room(sender_id, receiver_id)
    socketio.emit("new_message", message.to_dict(), room=room)


def get_room(id1, id2):
    return f"chat_{min(id1, id2)}_{max(id1, id2)}"
