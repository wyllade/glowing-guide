from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.user import User
from app.models.counsellor import CounsellorProfile, Availability
from app.utils.decorators import role_required

counsellors_bp = Blueprint("counsellors", __name__)


@counsellors_bp.route("", methods=["GET"])
def list_counsellors():
    query = CounsellorProfile.query.filter_by(is_verified=True)

    specialty = request.args.get("specialty")
    if specialty:
        query = query.filter(CounsellorProfile.specialties.ilike(f"%{specialty}%"))

    search = request.args.get("search")
    if search:
        query = query.join(User).filter(
            db.or_(
                User.first_name.ilike(f"%{search}%"),
                User.last_name.ilike(f"%{search}%"),
                CounsellorProfile.bio.ilike(f"%{search}%"),
            )
        )

    min_rate = request.args.get("min_rate", type=float)
    if min_rate:
        query = query.filter(CounsellorProfile.hourly_rate >= min_rate)

    max_rate = request.args.get("max_rate", type=float)
    if max_rate:
        query = query.filter(CounsellorProfile.hourly_rate <= max_rate)

    city = request.args.get("city")
    if city:
        query = query.filter(CounsellorProfile.city.ilike(f"%{city}%"))

    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    pagination = query.order_by(CounsellorProfile.hourly_rate).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return jsonify({
        "counsellors": [c.to_dict() for c in pagination.items],
        "total": pagination.total,
        "pages": pagination.pages,
        "page": page,
    })


@counsellors_bp.route("/<int:counsellor_id>", methods=["GET"])
def get_counsellor(counsellor_id):
    profile = CounsellorProfile.query.get(counsellor_id)
    if not profile:
        return jsonify({"error": "Counsellor not found"}), 404
    availabilities = [a.to_dict() for a in profile.availability.all()]
    return jsonify({"counsellor": profile.to_dict(), "availability": availabilities})


@counsellors_bp.route("/profile", methods=["POST", "PUT"])
@jwt_required()
@role_required("counsellor")
def upsert_profile():
    user_id = int(get_jwt_identity())
    profile = CounsellorProfile.query.filter_by(user_id=user_id).first()
    data = request.get_json()

    fields = [
        "bio", "specialties", "license_number", "years_experience",
        "hourly_rate", "education", "languages", "address",
        "city", "state", "postal_code", "country",
    ]

    if profile and request.method == "PUT":
        for field in fields:
            if field in data:
                setattr(profile, field, data[field])
        db.session.commit()
        return jsonify({"counsellor": profile.to_dict()})

    if not profile:
        profile = CounsellorProfile(user_id=user_id)
        for field in fields:
            if field in data:
                setattr(profile, field, data[field])
        db.session.add(profile)
        db.session.commit()
        return jsonify({"counsellor": profile.to_dict()}), 201

    return jsonify({"counsellor": profile.to_dict()})


@counsellors_bp.route("/availability", methods=["GET"])
@jwt_required()
@role_required("counsellor")
def get_availability():
    user_id = int(get_jwt_identity())
    profile = CounsellorProfile.query.filter_by(user_id=user_id).first()
    if not profile:
        return jsonify({"error": "Complete your profile first"}), 400
    slots = [a.to_dict() for a in profile.availability.all()]
    return jsonify({"availability": slots})


@counsellors_bp.route("/availability", methods=["POST"])
@jwt_required()
@role_required("counsellor")
def set_availability():
    user_id = int(get_jwt_identity())
    profile = CounsellorProfile.query.filter_by(user_id=user_id).first()
    if not profile:
        return jsonify({"error": "Complete your profile first"}), 400

    data = request.get_json()
    slots = data.get("slots", [])

    for slot in slots:
        avail = Availability(
            counsellor_id=profile.id,
            day_of_week=slot["day_of_week"],
            start_time=slot["start_time"],
            end_time=slot["end_time"],
            is_recurring=slot.get("is_recurring", True),
            specific_date=slot.get("specific_date"),
        )
        db.session.add(avail)

    db.session.commit()
    return jsonify({"message": "Availability saved"}), 201


@counsellors_bp.route("/availability/<int:slot_id>", methods=["DELETE"])
@jwt_required()
@role_required("counsellor")
def delete_availability(slot_id):
    user_id = int(get_jwt_identity())
    profile = CounsellorProfile.query.filter_by(user_id=user_id).first()
    if not profile:
        return jsonify({"error": "Complete your profile first"}), 400

    slot = Availability.query.get(slot_id)
    if not slot or slot.counsellor_id != profile.id:
        return jsonify({"error": "Availability slot not found"}), 404

    db.session.delete(slot)
    db.session.commit()
    return jsonify({"message": "Availability slot deleted"}), 200


@counsellors_bp.route("/<int:counsellor_id>/availability", methods=["GET"])
def get_counsellor_availability(counsellor_id):
    profile = CounsellorProfile.query.get(counsellor_id)
    if not profile:
        return jsonify({"error": "Counsellor not found"}), 404
    slots = [a.to_dict() for a in profile.availability.filter_by(is_booked=False).all()]
    return jsonify({"availability": slots})
