import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { appointmentAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

const JITSI_DOMAIN = "meet.jit.si";

export default function VideoCall() {
  const { appointmentId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const jitsiContainerRef = useRef(null);
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const jitsiApiRef = useRef(null);

  useEffect(() => {
    if (!appointmentId) return;
    appointmentAPI
      .get(appointmentId)
      .then((res) => {
        const a = res.data.appointment;
        setAppointment(a);
        if (!a.meeting_link) {
          setError("No meeting link available for this appointment.");
          setLoading(false);
        }
      })
      .catch((err) => {
        setError(err.response?.data?.error || "Failed to load appointment");
        setLoading(false);
      });
  }, [appointmentId]);

  useEffect(() => {
    if (!appointment?.meeting_link || !user) return;

    const roomName = new URL(appointment.meeting_link).pathname.slice(1);

    const script = document.createElement("script");
    script.src = `https://${JITSI_DOMAIN}/external_api.js`;
    script.async = true;
    script.onload = () => {
      const domain = JITSI_DOMAIN;
      const options = {
        roomName,
        width: "100%",
        height: "100%",
        parentNode: jitsiContainerRef.current,
        userInfo: {
          displayName: `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email,
        },
        configOverrides: {
          startWithAudioMuted: true,
          startWithVideoMuted: true,
          disableDeepLinking: true,
          prejoinPageEnabled: false,
        },
        interfaceConfigOverrides: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          TOOLBAR_ALWAYS_VISIBLE: true,
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
        },
      };

      try {
        jitsiApiRef.current = new window.JitsiMeetExternalAPI(domain, options);
        setLoading(false);
      } catch (e) {
        setError("Failed to initialize video call.");
        setLoading(false);
      }
    };
    script.onerror = () => {
      setError("Failed to load video provider.");
      setLoading(false);
    };
    document.body.appendChild(script);

    return () => {
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
        jitsiApiRef.current = null;
      }
      const existingScript = document.querySelector(
        `script[src="https://${JITSI_DOMAIN}/external_api.js"]`
      );
      if (existingScript) existingScript.remove();
    };
  }, [appointment, user]);

  const handleEndCall = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.dispose();
      jitsiApiRef.current = null;
    }
    navigate("/appointments");
  };

  if (error) {
    return (
      <div className="video-call-page">
        <div className="video-error">
          <h2>Unable to join call</h2>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => navigate("/appointments")}>
            Back to Appointments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="video-call-page">
      <div className="video-toolbar">
        <span className="video-room-info">
          {appointment && (
            <>
              Session #{appointment.id} —{" "}
              {new Date(appointment.start_time).toLocaleDateString()}{" "}
              {new Date(appointment.start_time).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </>
          )}
        </span>
        <button className="btn btn-danger" onClick={handleEndCall}>
          End Call
        </button>
      </div>
      <div className="video-container" ref={jitsiContainerRef}>
        {loading && <div className="video-loading">Connecting to video call...</div>}
      </div>
    </div>
  );
}
