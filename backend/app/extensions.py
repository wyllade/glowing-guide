from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
try:
    from flask_jwt_extended import JWTManager
except ImportError:
    JWTManager = None
from flask_socketio import SocketIO

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
socketio = SocketIO()
