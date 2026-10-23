import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout';
import { markIntroComplete } from '../utils/intro';
import { CAMPUS_MAP } from '../utils/constants';
import patPhoto from '@pictures/pat.jpeg';
import natPhoto from '@pictures/nat.jpeg';
import marielPhoto from '@pictures/mariel.jpeg';

const TEAM = [
  {
    name: 'Mariel Derla',
    email: 'derla.mariel@dnsc.edu.ph',
    phone: '09302551169',
    photo: marielPhoto,
    role: 'Project Manager',
  },
  {
    name: 'Nathaniel Quiber',
    email: 'quiber.nathanielquille@dnsc.edu.ph',
    phone: '09948874847',
    photo: natPhoto,
    role: 'Systems Developer',
  },
  {
    name: 'Patricia Fuster',
    email: 'fuster.patriciajoana@dnsc.edu.ph',
    photo: patPhoto,
    role: 'System Analyst & Documentarian',
  },
];

const emptyContact = { name: '', email: '', subject: '', message: '' };

export default function About() {
  const navigate = useNavigate();
  const location = useLocation();
  const [contact, setContact] = useState(emptyContact);
  const [contactSent, setContactSent] = useState(false);

  useEffect(() => {
    if (location.hash === '#contact') {
      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location]);

  const goLogin = () => {
    markIntroComplete();
    navigate('/login');
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    const subject = encodeURIComponent(contact.subject || 'Campus Eye — Contact Inquiry');
    const body = encodeURIComponent(
      `Name: ${contact.name}\nEmail: ${contact.email}\n\n${contact.message}`,
    );
    window.location.href = `mailto:${TEAM.map((m) => m.email).join(',')}?subject=${subject}&body=${body}`;
    setContactSent(true);
    setTimeout(() => {
      setContactSent(false);
      setContact(emptyContact);
    }, 4000);
  };

  return (
    <PublicLayout className="about-page">
      <main className="about-main">
        <div className="about-hero">
          <p className="intro-eyebrow">About Campus Eye</p>
          <div className="about-badges">
            <span className="about-badge">
              <i className="bi bi-mortarboard" />
              Davao del Norte State College
            </span>
            <span className="about-badge about-badge-accent">
              <i className="bi bi-code-slash" />
              BSIT Students
            </span>
          </div>
          <h1 className="about-title">
            Built by DNSC students.
            <span> Focused on drone waste monitoring.</span>
          </h1>
          <p className="about-lead">
            We are Bachelor of Science in Information Technology (BSIT) students from
            {' '}<strong>Davao del Norte State College (DNSC)</strong>, Panabo City — the team behind
            Campus Eye, combining drone vision, AI waste detection, and geospatial mapping
            to help teams monitor, map, and manage waste in one place.
          </p>
        </div>

        <section className="about-team" aria-labelledby="team-heading">
          <div className="about-team-header">
            <h2 id="team-heading">Meet the Team</h2>
            <p>BSIT students from DNSC — building the Campus Eye waste detection platform.</p>
          </div>

          <div className="about-team-grid">
            {TEAM.map((member, index) => (
              <article
                key={member.email}
                className="team-card"
                style={{ '--team-delay': `${index * 0.12}s` }}
              >
                <div className="team-card-glow" aria-hidden="true" />
                <div className="team-card-photo-wrap">
                  <img src={member.photo} alt={member.name} className="team-card-photo" loading="lazy" />
                  <div className="team-card-photo-overlay">
                    <i className="bi bi-envelope-heart" />
                  </div>
                </div>
                <div className="team-card-body">
                  <span className="team-card-program">BSIT</span>
                  <span className="team-card-role">{member.role}</span>
                  <h3 className="team-card-name">{member.name}</h3>
                  <a href={`mailto:${member.email}`} className="team-card-email">
                    <i className="bi bi-envelope me-2" />
                    {member.email}
                  </a>
                  {member.phone && (
                    <a href={`tel:${member.phone}`} className="team-card-phone">
                      <i className="bi bi-telephone me-2" />
                      {member.phone}
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="about-contact" id="contact" aria-labelledby="contact-heading">
          <div className="about-contact-card">
            <div className="about-contact-info">
              <p className="intro-eyebrow mb-2">Contact Us</p>
              <h2 id="contact-heading">Get in touch</h2>
              <p className="about-contact-lead">
                Questions, feedback, or want to add more info about Campus Eye?
                Send us a message — we&apos;d love to hear from you.
              </p>

              <ul className="about-contact-details">
                <li>
                  <i className="bi bi-building" />
                  <span>
                    <strong>Davao del Norte State College</strong>
                    <br />
                    {CAMPUS_MAP.address}
                  </span>
                </li>
                <li>
                  <i className="bi bi-mortarboard" />
                  <span>Bachelor of Science in Information Technology (BSIT)</span>
                </li>
                <li>
                  <i className="bi bi-envelope" />
                  <span className="about-contact-emails">
                    {TEAM.map((member) => (
                      <a key={member.email} href={`mailto:${member.email}`} className="about-contact-email-link">
                        <strong>{member.name}</strong>
                        <span>{member.email}</span>
                      </a>
                    ))}
                  </span>
                </li>
                <li>
                  <i className="bi bi-telephone" />
                  <span className="about-contact-emails">
                    {TEAM.filter((m) => m.phone).map((member) => (
                      <a key={member.phone} href={`tel:${member.phone}`} className="about-contact-email-link">
                        <strong>{member.name}</strong>
                        <span>{member.phone}</span>
                      </a>
                    ))}
                  </span>
                </li>
              </ul>
            </div>

            <form className="about-contact-form" onSubmit={handleContactSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label about-form-label" htmlFor="contact-name">Your name</label>
                  <input
                    id="contact-name"
                    className="form-control about-form-input"
                    value={contact.name}
                    onChange={(e) => setContact({ ...contact, name: e.target.value })}
                    placeholder="Juan Dela Cruz"
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label about-form-label" htmlFor="contact-email">Your email</label>
                  <input
                    id="contact-email"
                    type="email"
                    className="form-control about-form-input"
                    value={contact.email}
                    onChange={(e) => setContact({ ...contact, email: e.target.value })}
                    placeholder="you@dnsc.edu.ph"
                    required
                  />
                </div>
                <div className="col-12">
                  <label className="form-label about-form-label" htmlFor="contact-subject">Subject</label>
                  <input
                    id="contact-subject"
                    className="form-control about-form-input"
                    value={contact.subject}
                    onChange={(e) => setContact({ ...contact, subject: e.target.value })}
                    placeholder="Project inquiry, feedback, partnership…"
                    required
                  />
                </div>
                <div className="col-12">
                  <label className="form-label about-form-label" htmlFor="contact-message">Message</label>
                  <textarea
                    id="contact-message"
                    className="form-control about-form-input"
                    rows={4}
                    value={contact.message}
                    onChange={(e) => setContact({ ...contact, message: e.target.value })}
                    placeholder="Tell us what you'd like to share or ask…"
                    required
                  />
                </div>
              </div>

              {contactSent && (
                <div className="alert alert-success py-2 mt-3 mb-0 small">
                  <i className="bi bi-check-circle me-1" />
                  Opening your email app — send the message to reach our team.
                </div>
              )}

              <button type="submit" className="btn intro-cta mt-3">
                Send Message
                <i className="bi bi-send ms-2" />
              </button>
            </form>
          </div>
        </section>

        <div className="about-cta-row">
          <button type="button" className="btn intro-cta" onClick={goLogin}>
            Get Started
            <i className="bi bi-arrow-right ms-2" />
          </button>
        </div>
      </main>
    </PublicLayout>
  );
}
