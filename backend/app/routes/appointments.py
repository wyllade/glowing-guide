from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.user import User
from app.models.appointment import Appointment
from app.models.counsellor import CounsellorProfile, Availability
from app.utils.decorators import role_required
from datetime import datetime
import secrets

appointments_bp = Blueprint("appointments", __name__)


@appointments_bp.route("", methods=["GET"])
@jwt_required()
def list_appointments():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    status = request.args.get("status")

    if user.role == "counsellor":
        query = Appointment.query.filter_by(counsellor_id=user_id)
    else:
        query = Appointment.query.filter_by(client_id=user_id)

    if status:
        query = query.filter_by(status=status)

    appointments = query.order_by(Appointment.start_time.desc()).all()
    return jsonify({"appointments": [a.to_dict() for a in appointments]})


@appointments_bp.route("", methods=["POST"])
@jwt_required()
@role_required("client")
def create_appointment():
    user_id = int(get_jwt_identity())
    data = request.get_json()

    if not data or not data.get("counsellor_id") or not data.get("start_time") or not data.get("end_time"):
        return jsonify({"error": "counsellor_id, start_time, end_time are required"}), 400

    counsellor = User.query.get(data["counsellor_id"])
    if not counsellor or counsellor.role != "counsellor":
        return jsonify({"error": "Invalid counsellor"}), 400

    start = datetime.fromisoformat(data["start_time"])
    end = datetime.fromisoformat(data["end_time"])

    if start < datetime.utcnow():
        return jsonify({"error": "Cannot book in the past"}), 400

    appointment = Appointment(
        client_id=user_id,
        counsellor_id=data["counsellor_id"],
        start_time=start,
        end_time=end,
        notes=data.get("notes"),
        status="pending",
    )
    db.session.add(appointment)
    db.session.commit()

    return jsonify({"appointment": appointment.to_dict()}), 201


@appointments_bp.route("/<int:appointment_id>", methods=["GET"])
@jwt_required()
def get_appointment(appointment_id):
    user_id = int(get_jwt_identity())
    appointment = Appointment.query.get(appointment_id)
    if not appointment:
        return jsonify({"error": "Appointment not found"}), 404
    if appointment.client_id != user_id and appointment.counsellor_id != user_id:
        return jsonify({"error": "Forbidden"}), 403
    return jsonify({"appointment": appointment.to_dict()})


@appointments_bp.route("/<int:appointment_id>/status", methods=["PATCH"])
@jwt_required()
def update_status(appointment_id):
    user_id = int(get_jwt_identity())
    appointment = Appointment.query.get(appointment_id)
    if not appointment:
        return jsonify({"error": "Appointment not found"}), 404

    data = request.get_json()
    new_status = data.get("status")

    if new_status == "confirmed":
        if appointment.counsellor_id != user_id:
            return jsonify({"error": "Only counsellor can confirm"}), 403
        appointment.status = "confirmed"
        if not appointment.meeting_link:
            room = f"GlowingGuide-{appointment.id}-{secrets.token_hex(4)}"
            appointment.meeting_link = f"https://meet.jit.si/{room}"

    elif new_status == "cancelled":
        if appointment.client_id != user_id and appointment.counsellor_id != user_id:
            return jsonify({"error": "Forbidden"}), 403
        appointment.status = "cancelled"
        appointment.cancelled_by = "client" if appointment.client_id == user_id else "counsellor"
        appointment.cancellation_reason = data.get("reason")

    elif new_status == "completed":
        if appointment.counsellor_id != user_id:
            return jsonify({"error": "Only counsellor can complete"}), 403
        appointment.status = "completed"

    else:
        return jsonify({"error": "Invalid status"}), 400

    db.session.commit()
    return jsonify({"appointment": appointment.to_dict()})
