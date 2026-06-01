from app.extensions import db
from datetime import datetime


class CounsellorProfile(db.Model):
    __tablename__ = "counsellor_profiles"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), unique=True, nullable=False)
    bio = db.Column(db.Text)
    specialties = db.Column(db.String(500))
    license_number = db.Column(db.String(100))
    years_experience = db.Column(db.Integer)
    hourly_rate = db.Column(db.Float)
    is_verified = db.Column(db.Boolean, default=False)
    education = db.Column(db.String(500))
    languages = db.Column(db.String(200))
    address = db.Column(db.String(500))
    city = db.Column(db.String(100))
    state = db.Column(db.String(100))
    postal_code = db.Column(db.String(20))
    country = db.Column(db.String(100), default="US")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    availability = db.relationship("Availability", backref="counsellor", lazy="dynamic", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "bio": self.bio,
            "specialties": self.specialties.split(",") if self.specialties else [],
            "license_number": self.license_number,
            "years_experience": self.years_experience,
            "hourly_rate": self.hourly_rate,
            "is_verified": self.is_verified,
            "education": self.education,
            "languages": self.languages.split(",") if self.languages else [],
            "city": self.city,
            "state": self.state,
            "country": self.country,
            "user": self.user.to_dict() if self.user else None,
        }


class Availability(db.Model):
    __tablename__ = "availability"

    id = db.Column(db.Integer, primary_key=True)
    counsellor_id = db.Column(db.Integer, db.ForeignKey("counsellor_profiles.id"), nullable=False)
    day_of_week = db.Column(db.Integer, nullable=False)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    is_recurring = db.Column(db.Boolean, default=True)
    specific_date = db.Column(db.Date, nullable=True)
    is_booked = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            "id": self.id,
            "counsellor_id": self.counsellor_id,
            "day_of_week": self.day_of_week,
            "start_time": self.start_time.strftime("%H:%M") if self.start_time else None,
            "end_time": self.end_time.strftime("%H:%M") if self.end_time else None,
            "is_recurring": self.is_recurring,
            "specific_date": self.specific_date.isoformat() if self.specific_date else None,
            "is_booked": self.is_booked,
        }
