from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.message import Message

chat_bp = Blueprint("chat", __name__)


@chat_bp.route("/messages/<int:other_user_id>", methods=["GET"])
@jwt_required()
def get_messages(other_user_id):
    user_id = int(get_jwt_identity())
    messages = (
        Message.query.filter(
            db.or_(
                db.and_(Message.sender_id == user_id, Message.receiver_id == other_user_id),
                db.and_(Message.sender_id == other_user_id, Message.receiver_id == user_id),
            )
        )
        .order_by(Message.created_at.asc())
        .all()
    )

    Message.query.filter_by(receiver_id=user_id, sender_id=other_user_id, is_read=False).update(
        {"is_read": True}
    )
    db.session.commit()

    return jsonify({"messages": [m.to_dict() for m in messages]})


@chat_bp.route("/messages", methods=["POST"])
@jwt_required()
def send_message():
    user_id = int(get_jwt_identity())
    data = request.get_json()

    if not data or not data.get("receiver_id") or not data.get("content"):
        return jsonify({"error": "receiver_id and content are required"}), 400

    message = Message(
        sender_id=user_id,
        receiver_id=data["receiver_id"],
        content=data["content"],
        appointment_id=data.get("appointment_id"),
    )
    db.session.add(message)
    db.session.commit()

    return jsonify({"message": message.to_dict()}), 201


@chat_bp.route("/conversations", methods=["GET"])
@jwt_required()
def get_conversations():
    user_id = int(get_jwt_identity())
    sent = (
        db.session.query(Message.receiver_id)
        .filter(Message.sender_id == user_id)
        .distinct()
        .subquery()
    )
    received = (
        db.session.query(Message.sender_id)
        .filter(Message.receiver_id == user_id)
        .distinct()
        .subquery()
    )

    from app.models.user import User

    user_ids = set()
    for row in db.session.query(sent).all():
        user_ids.add(row[0])
    for row in db.session.query(received).all():
        user_ids.add(row[0])

    users = User.query.filter(User.id.in_(user_ids)).all()
    return jsonify({"conversations": [u.to_dict() for u in users]})
