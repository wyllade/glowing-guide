from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.payment import Payment
from app.models.appointment import Appointment
import stripe

payments_bp = Blueprint("payments", __name__)


@payments_bp.route("/create-intent", methods=["POST"])
@jwt_required()
def create_payment_intent():
    user_id = int(get_jwt_identity())
    data = request.get_json()

    if not data or not data.get("amount") or not data.get("appointment_id"):
        return jsonify({"error": "amount and appointment_id are required"}), 400

    appointment = Appointment.query.get(data["appointment_id"])
    if not appointment or appointment.client_id != user_id:
        return jsonify({"error": "Invalid appointment"}), 400

    from flask import current_app

    stripe.api_key = current_app.config["STRIPE_SECRET_KEY"]

    intent = stripe.PaymentIntent.create(
        amount=int(data["amount"] * 100),
        currency=data.get("currency", "usd"),
        metadata={"appointment_id": str(appointment.id), "user_id": str(user_id)},
    )

    payment = Payment(
        user_id=user_id,
        appointment_id=appointment.id,
        amount=data["amount"],
        currency=data.get("currency", "USD"),
        stripe_payment_intent_id=intent.id,
        status="pending",
    )
    db.session.add(payment)
    db.session.commit()

    return jsonify({"client_secret": intent.client_secret, "payment_id": payment.id})


@payments_bp.route("/confirm", methods=["POST"])
@jwt_required()
def confirm_payment():
    data = request.get_json()
    if not data or not data.get("payment_intent_id"):
        return jsonify({"error": "payment_intent_id is required"}), 400

    from flask import current_app

    stripe.api_key = current_app.config["STRIPE_SECRET_KEY"]

    intent = stripe.PaymentIntent.retrieve(data["payment_intent_id"])
    payment = Payment.query.filter_by(stripe_payment_intent_id=intent.id).first()

    if payment:
        payment.status = intent.status
        db.session.commit()

    return jsonify({"status": intent.status, "payment": payment.to_dict() if payment else None})


@payments_bp.route("/history", methods=["GET"])
@jwt_required()
def payment_history():
    user_id = int(get_jwt_identity())
    payments = Payment.query.filter_by(user_id=user_id).order_by(Payment.created_at.desc()).all()
    return jsonify({"payments": [p.to_dict() for p in payments]})
