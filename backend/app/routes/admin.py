from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.user import User
from app.models.counsellor import CounsellorProfile
from app.models.appointment import Appointment
from app.models.payment import Payment
from app.utils.decorators import role_required

admin_bp = Blueprint("admin", __name__)


@admin_bp.route("/users", methods=["GET"])
@jwt_required()
@role_required("admin")
def list_users():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    role = request.args.get("role")

    query = User.query
    if role:
        query = query.filter_by(role=role)

    pagination = query.order_by(User.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    return jsonify({
        "users": [u.to_dict() for u in pagination.items],
        "total": pagination.total,
        "pages": pagination.pages,
        "page": page,
    })


@admin_bp.route("/users/<int:user_id>", methods=["PATCH"])
@jwt_required()
@role_required("admin")
def update_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json()
    if "is_active" in data:
        user.is_active = data["is_active"]
    if "is_verified" in data:
        user.is_verified = data["is_verified"]

    db.session.commit()
    return jsonify({"user": user.to_dict()})


@admin_bp.route("/counsellors", methods=["GET"])
@jwt_required()
@role_required("admin")
def list_counsellors():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    verified = request.args.get("verified")

    query = CounsellorProfile.query
    if verified is not None:
        query = query.filter_by(is_verified=verified.lower() == "true")

    pagination = query.order_by(CounsellorProfile.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    return jsonify({
        "counsellors": [c.to_dict() for c in pagination.items],
        "total": pagination.total,
        "pages": pagination.pages,
        "page": page,
    })


@admin_bp.route("/counsellors/<int:counsellor_id>/verify", methods=["PATCH"])
@jwt_required()
@role_required("admin")
def verify_counsellor(counsellor_id):
    profile = CounsellorProfile.query.get(counsellor_id)
    if not profile:
        return jsonify({"error": "Counsellor profile not found"}), 404

    data = request.get_json()
    if "is_verified" not in data:
        return jsonify({"error": "is_verified field is required"}), 400

    profile.is_verified = data["is_verified"]
    db.session.commit()
    return jsonify({"counsellor": profile.to_dict()})


@admin_bp.route("/appointments", methods=["GET"])
@jwt_required()
@role_required("admin")
def list_appointments():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    status = request.args.get("status")

    query = Appointment.query
    if status:
        query = query.filter_by(status=status)

    pagination = query.order_by(Appointment.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    results = []
    for a in pagination.items:
        d = a.to_dict()
        client_user = User.query.get(a.client_id)
        counsellor_user = User.query.get(a.counsellor_id)
        d["client_name"] = f"{client_user.first_name} {client_user.last_name}" if client_user else "Unknown"
        d["counsellor_name"] = f"{counsellor_user.first_name} {counsellor_user.last_name}" if counsellor_user else "Unknown"
        results.append(d)

    return jsonify({
        "appointments": results,
        "total": pagination.total,
        "pages": pagination.pages,
        "page": page,
    })


@admin_bp.route("/dashboard", methods=["GET"])
@jwt_required()
@role_required("admin")
def dashboard():
    total_users = User.query.count()
    total_counsellors = CounsellorProfile.query.count()
    verified_counsellors = CounsellorProfile.query.filter_by(is_verified=True).count()
    total_appointments = Appointment.query.count()
    pending_appointments = Appointment.query.filter_by(status="pending").count()
    completed_appointments = Appointment.query.filter_by(status="completed").count()
    total_revenue = db.session.query(db.func.sum(Payment.amount)).filter_by(status="succeeded").scalar() or 0

    return jsonify({
        "total_users": total_users,
        "total_counsellors": total_counsellors,
        "verified_counsellors": verified_counsellors,
        "total_appointments": total_appointments,
        "pending_appointments": pending_appointments,
        "completed_appointments": completed_appointments,
        "total_revenue": round(total_revenue, 2),
    })
