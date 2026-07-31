import InstructorSetupForm from '../components/InstructorSetupForm';
import '../styles/InstructorSetup.css';
import NbscLogo from '../assets/Nbsc-logo.png';

/**
 * Rendered by App.jsx in place of the normal Sidebar/page shell when
 * hasAssignedSections(instructorId) comes back false right after
 * login. onComplete should re-run that check (or just flip local
 * state) so the app proceeds to the Dashboard.
 */
export default function InstructorSetup({ instructorName, onComplete }) {
  return (
    <div className="setup-page">
      <div className="setup-page__card">
        <div className="setup-page__header">
          <img src={NbscLogo} alt="NBSC" className="setup-page__logo" />
          <h1 className="setup-page__title">Welcome{instructorName ? `, ${instructorName}` : ''}</h1>
          <p className="setup-page__subtitle">
            Before you continue, tell us which sections you handle.
          </p>
        </div>

        <InstructorSetupForm onComplete={onComplete} />
      </div>
    </div>
  );
}
