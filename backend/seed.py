import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.counsellor import CounsellorProfile, Availability
from app.models.appointment import Appointment
from app.models.journal import JournalEntry, MoodLog
from app.models.message import Message
from datetime import datetime, time, timedelta

app = create_app()

with app.app_context():
    db.drop_all()
    db.create_all()

    print("Creating users...")

    # Client
    client = User(
        email="alice@example.com",
        first_name="Alice",
        last_name="Johnson",
        role="client",
        is_verified=True,
    )
    client.set_password("password123")
    db.session.add(client)

    # Counsellor 1 — Dr. Sarah
    sarah = User(
        email="sarah@example.com",
        first_name="Sarah",
        last_name="Chen",
        role="counsellor",
        is_verified=True,
    )
    sarah.set_password("password123")
    db.session.add(sarah)
    db.session.flush()

    sarah_profile = CounsellorProfile(
        user_id=sarah.id,
        bio="Dr. Sarah Chen is a licensed clinical psychologist with over a decade of experience helping individuals navigate anxiety, depression, and life transitions. She uses evidence-based approaches including CBT and mindfulness to create a warm, supportive space for healing.",
        specialties="Anxiety,Depression,Life Transitions,Mindfulness,CBT,Stress Management",
        license_number="PSY-54321",
        years_experience=12,
        hourly_rate=120.0,
        is_verified=True,
        education="Ph.D. in Clinical Psychology, Stanford University",
        languages="English,Mandarin",
        city="San Francisco",
        state="CA",
        country="US",
    )
    db.session.add(sarah_profile)
    db.session.flush()

    for day in [1, 3, 5]:  # Mon, Wed, Fri
        db.session.add(Availability(
            counsellor_id=sarah_profile.id, day_of_week=day,
            start_time=time(9, 0), end_time=time(12, 0), is_recurring=True,
        ))
        db.session.add(Availability(
            counsellor_id=sarah_profile.id, day_of_week=day,
            start_time=time(14, 0), end_time=time(17, 0), is_recurring=True,
        ))

    # Counsellor 2 — Mark
    mark = User(
        email="mark@example.com",
        first_name="Mark",
        last_name="Rivera",
        role="counsellor",
        is_verified=True,
    )
    mark.set_password("password123")
    db.session.add(mark)
    db.session.flush()

    mark_profile = CounsellorProfile(
        user_id=mark.id,
        bio="Mark is a licensed professional counsellor dedicated to helping couples and individuals build stronger relationships. His approach combines emotionally focused therapy with practical communication strategies.",
        specialties="Couples Therapy,Relationship Issues,Communication,Grief,PTSD",
        license_number="LPC-78901",
        years_experience=8,
        hourly_rate=95.0,
        is_verified=True,
        education="M.A. in Counseling, University of Texas",
        languages="English,Spanish",
        city="Austin",
        state="TX",
        country="US",
    )
    db.session.add(mark_profile)
    db.session.flush()

    for day in [2, 4, 6]:  # Tue, Thu, Sat
        db.session.add(Availability(
            counsellor_id=mark_profile.id, day_of_week=day,
            start_time=time(10, 0), end_time=time(13, 0), is_recurring=True,
        ))
        db.session.add(Availability(
            counsellor_id=mark_profile.id, day_of_week=day,
            start_time=time(15, 0), end_time=time(18, 0), is_recurring=True,
        ))

    # Admin user
    admin = User(
        email="admin@upward.com",
        first_name="Admin",
        last_name="User",
        role="admin",
        is_verified=True,
    )
    admin.set_password("admin123")
    db.session.add(admin)

    # Sample appointment (past — completed)
    past_appt = Appointment(
        client_id=client.id,
        counsellor_id=sarah.id,
        start_time=datetime.utcnow() - timedelta(days=7),
        end_time=datetime.utcnow() - timedelta(days=7, hours=-1),
        status="completed",
        notes="Discussed work-related anxiety and coping strategies.",
    )
    db.session.add(past_appt)

    # Sample upcoming appointment (confirmed)
    future_start = datetime.utcnow() + timedelta(days=2)
    future_start = future_start.replace(hour=10, minute=0, second=0, microsecond=0)
    future_appt = Appointment(
        client_id=client.id,
        counsellor_id=mark.id,
        start_time=future_start,
        end_time=future_start + timedelta(minutes=50),
        status="confirmed",
        notes="First session — looking forward to it!",
        meeting_link="https://meet.jit.si/Upward-sample-abc123",
    )
    db.session.add(future_appt)

    # Journal entries
    db.session.add(JournalEntry(
        user_id=client.id, title="First session thoughts",
        content="Had my first session with Dr. Chen today. She was very understanding and gave me some great breathing exercises for when I feel anxious. Looking forward to our next session.",
        mood_score=7, tags="first session, anxiety, breathing", is_private=True,
    ))
    db.session.add(JournalEntry(
        user_id=client.id, title="Weekend reflection",
        content="Spent the weekend hiking and practicing mindfulness. Feeling more centered than I have in weeks. The techniques are starting to feel more natural.",
        mood_score=8, tags="mindfulness, weekend, progress", is_private=True,
    ))

    # Mood logs
    for i in range(14):
        db.session.add(MoodLog(
            user_id=client.id,
            mood_score=max(1, min(10, 6 + (i % 5) - 2)),
            note="Daily check-in" if i % 3 == 0 else None,
            created_at=datetime.utcnow() - timedelta(days=13 - i),
        ))

    # Sample messages
    db.session.add(Message(
        sender_id=client.id, receiver_id=sarah.id,
        content="Hi Dr. Chen, thank you for the session yesterday. The breathing exercises are helping already!",
    ))
    db.session.add(Message(
        sender_id=sarah.id, receiver_id=client.id,
        content="You're welcome, Alice! I'm glad to hear that. Practice them 3 times a day and let me know how it goes.",
    ))

    db.session.commit()
    print("Seed data created successfully!")
    print()
    print("Test accounts:")
    print(f"  Client:     alice@example.com / password123")
    print(f"  Counsellor: sarah@example.com / password123")
    print(f"  Counsellor: mark@example.com / password123")
    print(f"  Admin:      admin@upward.com / admin123")
