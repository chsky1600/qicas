import './toolbar.css';
import type { SectionState, InstructorState } from '@/features/assignment/assignment.types';
import { useState } from 'react';
import PropertiesDialog from './propertiesDialog';

export default function Toolbar({sectionState, instructorState}: {sectionState: SectionState, instructorState: InstructorState}) {
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(false);
  return (
    <div className="toolbar">
      {/* Left side - Logo and Schedule selector */}
      <div className="toolbar-left">
        <div className="logo">
          <span className="logo-text">Q</span>
          <span className="logo-subtext">IC<br/>AS</span>
        </div>
        
        <select className="schedule-selector">
          <option>2024-25 Schedule</option>
          <option>2023-24 Schedule</option>
          <option>2025-26 Schedule</option>
        </select>
      </div>

      {/* Right side - Action buttons */}
      <div className="toolbar-right">
        <button className="toolbar-btn">
          <span className="icon">📖</span>
          Tutorial
        </button>
        
        <button className="toolbar-btn" onClick={() => setIsPropertiesOpen(true)}>
          <span className="icon">📄</span>
          Edit Properties
        </button>
        
        <button className="toolbar-btn">
          <span className="icon">📸</span>
          Snapshots
        </button>
        
        <button className="toolbar-btn">
          <span className="icon">📤</span>
          Export
        </button>
        
        <button className="toolbar-btn">
          <span className="icon">⚙️</span>
          Settings
        </button>
      </div>
      <PropertiesDialog isOpen={isPropertiesOpen} onClose={() => setIsPropertiesOpen(false)} sectionState={sectionState} instructorState={instructorState} />
    </div>
  );
}
