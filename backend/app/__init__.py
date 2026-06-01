from flask import Flask
from flask_cors import CORS
from config import Config
from app.extensions import db, migrate, jwt, socketio


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    CORS(app, origins=app.config["CORS_ORIGINS"].split(","))

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    socketio.init_app(app, cors_allowed_origins="*")

    from app.routes.auth import auth_bp
    from app.routes.users import users_bp
    from app.routes.counsellors import counsellors_bp
    from app.routes.appointments import appointments_bp
    from app.routes.chat import chat_bp
    from app.routes.payments import payments_bp
    from app.routes.journal import journal_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(users_bp, url_prefix="/api/users")
    app.register_blueprint(counsellors_bp, url_prefix="/api/counsellors")
    app.register_blueprint(appointments_bp, url_prefix="/api/appointments")
    app.register_blueprint(chat_bp, url_prefix="/api/chat")
    app.register_blueprint(payments_bp, url_prefix="/api/payments")
    app.register_blueprint(journal_bp, url_prefix="/api/journal")

    @app.route("/api/health")
    def health():
        return {"status": "ok"}

    return app
