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

    # ── Client ──
    client = User(
        email="alice@example.com",
        first_name="Alice",
        last_name="Johnson",
        role="client",
        is_verified=True,
    )
    client.set_password("password123")
    db.session.add(client)

    # ── Admin ──
    admin = User(
        email="admin@upward.com",
        first_name="Admin",
        last_name="User",
        role="admin",
        is_verified=True,
    )
    admin.set_password("admin123")
    db.session.add(admin)

    # ═══════════════════════════════════════════════
    # COUNSELLOR 1 — Esther Perel
    # ═══════════════════════════════════════════════
    esther = User(
        email="esther.perel@upward.com",
        first_name="Esther",
        last_name="Perel",
        role="counsellor",
        is_verified=True,
    )
    esther.set_password("password123")
    db.session.add(esther)
    db.session.flush()

    esther_profile = CounsellorProfile(
        user_id=esther.id,
        bio="Esther Perel is recognized as one of the most insightful and provocative voices on personal and professional relationships. Fluent in nine languages, she has run a private practice in New York City for over 35 years. Her celebrated TED Talks have garnered nearly 40 million views and her international bestseller 'Mating in Captivity: Unlocking Erotic Intelligence' has been translated into 30 languages. Esther is also an executive producer and host of the award-winning podcast 'Where Should We Begin?' and a licensed marriage and family therapist trained and supervised by Dr. Salvador Minuchin.",
        specialties="Couples Therapy,Relationships,Infidelity,Sex Therapy,Intimacy,Communication",
        license_number="LMFT-001234",
        years_experience=35,
        hourly_rate=350.0,
        is_verified=True,
        education="M.A. in Expressive Arts Therapy, Lesley University; trained at Minuchin Institute for the Family",
        languages="English,French,Spanish,Portuguese,German,Hebrew,Dutch,Italian,Flemish",
        city="New York",
        state="NY",
        country="US",
    )
    db.session.add(esther_profile)
    db.session.flush()

    for day in [2, 4]:  # Tue, Thu
        db.session.add(Availability(counsellor_id=esther_profile.id, day_of_week=day, start_time=time(10, 0), end_time=time(13, 0), is_recurring=True))

    # ═══════════════════════════════════════════════
    # COUNSELLOR 2 — Lori Gottlieb
    # ═══════════════════════════════════════════════
    lori = User(
        email="lori.gottlieb@upward.com",
        first_name="Lori",
        last_name="Gottlieb",
        role="counsellor",
        is_verified=True,
    )
    lori.set_password("password123")
    db.session.add(lori)
    db.session.flush()

    lori_profile = CounsellorProfile(
        user_id=lori.id,
        bio="Lori Gottlieb is a licensed marriage and family therapist and the New York Times bestselling author of 'Maybe You Should Talk to Someone', which has been translated into more than 30 languages. She writes The Atlantic's weekly 'Dear Therapist' column and is the co-host of the 'Dear Therapists' podcast. With a background in both journalism and clinical psychology, Lori brings a unique blend of warmth, humor, and insight to her work with individuals navigating life transitions, relationships, and personal growth.",
        specialties="Life Transitions,Relationships,Anxiety,Depression,Grief,Personal Growth",
        license_number="LMFT-005678",
        years_experience=20,
        hourly_rate=250.0,
        is_verified=True,
        education="M.A. in Clinical Psychology, Pepperdine University; B.A. in Psychology, Stanford University",
        languages="English",
        city="Los Angeles",
        state="CA",
        country="US",
    )
    db.session.add(lori_profile)
    db.session.flush()

    for day in [1, 3, 5]:  # Mon, Wed, Fri
        db.session.add(Availability(counsellor_id=lori_profile.id, day_of_week=day, start_time=time(9, 0), end_time=time(12, 0), is_recurring=True))

    # ═══════════════════════════════════════════════
    # COUNSELLOR 3 — Dr. Joy Harden Bradford
    # ═══════════════════════════════════════════════
    joy = User(
        email="joy.bradford@upward.com",
        first_name="Joy",
        last_name="Bradford",
        role="counsellor",
        is_verified=True,
    )
    joy.set_password("password123")
    db.session.add(joy)
    db.session.flush()

    joy_profile = CounsellorProfile(
        user_id=joy.id,
        bio="Dr. Joy Harden Bradford is a licensed clinical psychologist and the founder of 'Therapy for Black Girls', an award-winning platform dedicated to making mental health resources more accessible for Black women. She hosts the wildly popular 'Therapy for Black Girls' podcast, which has garnered millions of downloads and features conversations around mental health, personal development, and wellness. Dr. Joy specializes in helping Black women navigate anxiety, career stress, life transitions, and imposter syndrome in a culturally affirming space.",
        specialties="Anxiety,Black Mental Health,Career Stress,Life Transitions,Self-Esteem,Imposter Syndrome",
        license_number="PSY-003456",
        years_experience=14,
        hourly_rate=175.0,
        is_verified=True,
        education="Ph.D. in Clinical Psychology, Georgia State University; M.A. in Clinical Psychology, University of Alabama",
        languages="English",
        city="Atlanta",
        state="GA",
        country="US",
    )
    db.session.add(joy_profile)
    db.session.flush()

    for day in [2, 3, 4]:  # Tue, Wed, Thu
        db.session.add(Availability(counsellor_id=joy_profile.id, day_of_week=day, start_time=time(10, 0), end_time=time(15, 0), is_recurring=True))

    # ═══════════════════════════════════════════════
    # COUNSELLOR 4 — Nedra Glover Tawwab
    # ═══════════════════════════════════════════════
    nedra = User(
        email="nedra.tawwab@upward.com",
        first_name="Nedra Glover",
        last_name="Tawwab",
        role="counsellor",
        is_verified=True,
    )
    nedra.set_password("password123")
    db.session.add(nedra)
    db.session.flush()

    nedra_profile = CounsellorProfile(
        user_id=nedra.id,
        bio="Nedra Glover Tawwab is a licensed clinical social worker and the New York Times bestselling author of 'Set Boundaries, Find Peace: A Guide to Reclaiming Yourself' and 'Drama Free: A Guide to Managing Unhealthy Family Relationships'. She is the founder of the group therapy practice Kaleidoscope Counseling in Charlotte, North Carolina. Nedra has built a massive online following by sharing practical, no-nonsense advice about setting boundaries, improving communication, and navigating difficult family dynamics. Her work has been featured in The New York Times, The Guardian, and on Red Table Talk.",
        specialties="Boundary Setting,Relationships,Family Dynamics,Anxiety,Communication,Conflict Resolution",
        license_number="LCSW-C009012",
        years_experience=18,
        hourly_rate=200.0,
        is_verified=True,
        education="M.S.W. in Clinical Social Work, Wayne State University; B.A. in Psychology, North Carolina Central University",
        languages="English",
        city="Charlotte",
        state="NC",
        country="US",
    )
    db.session.add(nedra_profile)
    db.session.flush()

    for day in [1, 3, 5]:  # Mon, Wed, Fri
        db.session.add(Availability(counsellor_id=nedra_profile.id, day_of_week=day, start_time=time(11, 0), end_time=time(14, 0), is_recurring=True))
        db.session.add(Availability(counsellor_id=nedra_profile.id, day_of_week=day, start_time=time(16, 0), end_time=time(19, 0), is_recurring=True))

    # ═══════════════════════════════════════════════
    # COUNSELLOR 5 — Dr. Thema Bryant
    # ═══════════════════════════════════════════════
    thema = User(
        email="thema.bryant@upward.com",
        first_name="Thema",
        last_name="Bryant",
        role="counsellor",
        is_verified=True,
    )
    thema.set_password("password123")
    db.session.add(thema)
    db.session.flush()

    thema_profile = CounsellorProfile(
        user_id=thema.id,
        bio="Dr. Thema Bryant is a licensed clinical psychologist and the 2023 President of the American Psychological Association (APA). She is a professor at Pepperdine University's Graduate School of Education and Psychology and the host of the 'Homecoming' podcast. Dr. Thema specializes in trauma recovery, depression, anxiety, and women's issues, with a particular focus on the intersection of mental health, spirituality, and cultural identity. She is the author of several books including 'Homecoming: Overcome Fear and Trauma to Reclaim Your Whole, Authentic Self' and 'The Anti-Anxiety Card Deck.'",
        specialties="Trauma,Depression,Women's Issues,Anxiety,Spirituality,Cultural Identity",
        license_number="PSY-007890",
        years_experience=22,
        hourly_rate=225.0,
        is_verified=True,
        education="Ph.D. in Clinical Psychology, Duke University; M.Div., Harvard Divinity School; B.A. in Psychology, Spelman College",
        languages="English,Spanish",
        city="Washington",
        state="DC",
        country="US",
    )
    db.session.add(thema_profile)
    db.session.flush()

    for day in [2, 4, 6]:  # Tue, Thu, Sat
        db.session.add(Availability(counsellor_id=thema_profile.id, day_of_week=day, start_time=time(10, 0), end_time=time(16, 0), is_recurring=True))

    # ── Appointments ──
    past_appt = Appointment(
        client_id=client.id,
        counsellor_id=lori.id,
        start_time=datetime.utcnow() - timedelta(days=7),
        end_time=datetime.utcnow() - timedelta(days=7, hours=-1),
        status="completed",
        notes="Discussed recent life transition after a career change. Explored feelings of uncertainty and perfectionism.",
    )
    db.session.add(past_appt)

    future_start = datetime.utcnow() + timedelta(days=2)
    future_start = future_start.replace(hour=14, minute=0, second=0, microsecond=0)
    future_appt = Appointment(
        client_id=client.id,
        counsellor_id=esther.id,
        start_time=future_start,
        end_time=future_start + timedelta(minutes=50),
        status="confirmed",
        notes="First session — exploring communication patterns in my relationship.",
        meeting_link="https://meet.jit.si/Upward-esther-session",
    )
    db.session.add(future_appt)

    # ── Journal entries ──
    db.session.add(JournalEntry(
        user_id=client.id, title="Session with Lori",
        content="Had my first session with Lori today. She has such a warm presence and helped me see that my perfectionism is really getting in the way of my happiness. She gave me some great prompts for journaling this week. Already feel like this is going to be transformative.",
        mood_score=8, tags="therapy, perfectionism, growth", is_private=True,
    ))
    db.session.add(JournalEntry(
        user_id=client.id, title="Setting boundaries this week",
        content="Read Nedra's book on boundaries and practiced saying no to an extra project at work. It felt uncomfortable but also liberating. My therapist would be proud! Going to keep practicing this.",
        mood_score=7, tags="boundaries, work, growth", is_private=True,
    ))
    db.session.add(JournalEntry(
        user_id=client.id, title="Feeling anxious today",
        content="Had a rough morning with anxiety. Used the breathing technique Dr. Thema shared on her podcast. It helped calm me down enough to get through my morning meeting. One step at a time.",
        mood_score=5, tags="anxiety, breathing, coping", is_private=True,
    ))

    # ── Mood logs (2 weeks) ──
    for i in range(14):
        db.session.add(MoodLog(
            user_id=client.id,
            mood_score=max(1, min(10, 6 + (i % 5) - 2)),
            note="Daily check-in" if i % 3 == 0 else None,
            created_at=datetime.utcnow() - timedelta(days=13 - i),
        ))

    # ── Messages ──
    db.session.add(Message(
        sender_id=client.id, receiver_id=lori.id,
        content="Hi Lori, thank you for the session. The journal prompts are already helping me reflect in a new way.",
    ))
    db.session.add(Message(
        sender_id=lori.id, receiver_id=client.id,
        content="You're welcome, Alice! I'm so glad to hear that. Pay attention to any patterns that come up this week — that's where the real work begins.",
    ))

    db.session.commit()

    print("✓ Seed data created successfully!")
    print()
    print("=" * 50)
    print("TEST ACCOUNTS")
    print("=" * 50)
    print(f"  Client:              alice@example.com / password123")
    print(f"  Admin:               admin@upward.com   / admin123")
    print()
    print("COUNSELLORS (all use password123):")
    print(f"  Esther Perel:        esther.perel@upward.com      — NYC      — $350/hr")
    print(f"  Lori Gottlieb:       lori.gottlieb@upward.com     — LA       — $250/hr")
    print(f"  Dr. Joy Bradford:    joy.bradford@upward.com      — Atlanta  — $175/hr")
    print(f"  Nedra Tawwab:        nedra.tawwab@upward.com      — Charlotte— $200/hr")
    print(f"  Dr. Thema Bryant:    thema.bryant@upward.com      — DC       — $225/hr")
    print()
    print("SAMPLE DATA:")
    print("  - 1 completed session with Lori Gottlieb")
    print("  - 1 upcoming confirmed session with Esther Perel")
    print("  - 3 journal entries, 14 mood logs, 2 sample messages")
