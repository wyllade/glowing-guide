from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.journal import JournalEntry, MoodLog
from datetime import datetime, timedelta

journal_bp = Blueprint("journal", __name__)


@journal_bp.route("/entries", methods=["GET"])
@jwt_required()
def list_entries():
    user_id = int(get_jwt_identity())
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    pagination = (
        JournalEntry.query.filter_by(user_id=user_id)
        .order_by(JournalEntry.created_at.desc())
        .paginate(page=page, per_page=per_page, error_out=False)
    )
    return jsonify({
        "entries": [e.to_dict() for e in pagination.items],
        "total": pagination.total,
        "page": page,
    })


@journal_bp.route("/entries", methods=["POST"])
@jwt_required()
def create_entry():
    user_id = int(get_jwt_identity())
    data = request.get_json()

    if not data or not data.get("content"):
        return jsonify({"error": "Content is required"}), 400

    entry = JournalEntry(
        user_id=user_id,
        title=data.get("title"),
        content=data["content"],
        mood_score=data.get("mood_score"),
        tags=data.get("tags"),
        is_private=data.get("is_private", True),
    )
    db.session.add(entry)
    db.session.commit()

    return jsonify({"entry": entry.to_dict()}), 201


@journal_bp.route("/entries/<int:entry_id>", methods=["GET", "PUT", "DELETE"])
@jwt_required()
def handle_entry(entry_id):
    user_id = int(get_jwt_identity())
    entry = JournalEntry.query.filter_by(id=entry_id, user_id=user_id).first()

    if not entry:
        return jsonify({"error": "Entry not found"}), 404

    if request.method == "GET":
        return jsonify({"entry": entry.to_dict()})

    if request.method == "PUT":
        data = request.get_json()
        for field in ["title", "content", "mood_score", "tags", "is_private"]:
            if field in data:
                setattr(entry, field, data[field])
        db.session.commit()
        return jsonify({"entry": entry.to_dict()})

    if request.method == "DELETE":
        db.session.delete(entry)
        db.session.commit()
        return jsonify({"message": "Entry deleted"}), 204


@journal_bp.route("/mood", methods=["POST"])
@jwt_required()
def log_mood():
    user_id = int(get_jwt_identity())
    data = request.get_json()

    if not data or data.get("mood_score") is None:
        return jsonify({"error": "mood_score is required"}), 400

    log = MoodLog(
        user_id=user_id,
        mood_score=data["mood_score"],
        note=data.get("note"),
    )
    db.session.add(log)
    db.session.commit()

    return jsonify({"log": log.to_dict()}), 201


@journal_bp.route("/mood", methods=["GET"])
@jwt_required()
def get_mood_logs():
    user_id = int(get_jwt_identity())
    days = request.args.get("days", 30, type=int)
    since = datetime.utcnow() - timedelta(days=days)
    logs = (
        MoodLog.query.filter_by(user_id=user_id)
        .filter(MoodLog.created_at >= since)
        .order_by(MoodLog.created_at.asc())
        .all()
    )
    return jsonify({"logs": [l.to_dict() for l in logs]})
